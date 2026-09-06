import { z } from "zod";
import { TRPCError } from "@trpc/server";
import { and, desc, eq, sql } from "drizzle-orm";
import { router, protectedProcedure } from "../trpc.js";
import { schema } from "../../db/index.js";

const network = z.enum(["Airtel", "MTN", "Zamtel"]);

export const airtimeRouter = router({
  history: protectedProcedure.query(({ ctx }) => ctx.db.select().from(schema.airtimeTransactions).where(eq(schema.airtimeTransactions.userId, ctx.user.id)).orderBy(desc(schema.airtimeTransactions.createdAt))),
  purchase: protectedProcedure.input(z.object({ network, productType: z.enum(["airtime", "data"]), phoneNumber: z.string().regex(/^\+?260\d{9}$/, "Enter a valid Zambian mobile number"), amount: z.number().int().min(5).max(10000) })).mutation(async ({ ctx, input }) => ctx.db.transaction(async (tx) => {
    const [balance] = await tx.select({ value: sql<string>`coalesce(sum(${schema.walletTransactions.amount}), 0)` }).from(schema.walletTransactions).where(and(eq(schema.walletTransactions.userId, ctx.user.id), eq(schema.walletTransactions.status, "completed")));
    if (Number(balance?.value ?? 0) < input.amount) throw new TRPCError({ code: "BAD_REQUEST", message: "Insufficient wallet balance" });
    const [debit] = await tx.insert(schema.walletTransactions).values({ userId: ctx.user.id, amount: (-input.amount).toFixed(2), type: "payment", status: "completed", description: `${input.productType === "data" ? "Data bundle" : "Airtime"} for ${input.phoneNumber}` }).returning();
    const [purchase] = await tx.insert(schema.airtimeTransactions).values({ userId: ctx.user.id, network: input.network, productType: input.productType, phoneNumber: input.phoneNumber, amount: input.amount.toFixed(2), status: "pending", walletTransactionId: debit.id }).returning();
    return purchase;
  })),
});
