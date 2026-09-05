import { z } from "zod";
import { router, protectedProcedure } from "../trpc.js";
import { schema } from "../../db/index.js";
import { eq, desc, sql, and } from "drizzle-orm";

export const walletRouter = router({
  // Only "completed" transactions count — a pending top-up that was never
  // confirmed by the provider must never inflate the spendable balance.
  balance: protectedProcedure.query(async ({ ctx }) => {
    const [row] = await ctx.db
      .select({
        balance: sql<string>`coalesce(sum(${schema.walletTransactions.amount}), 0)`,
      })
      .from(schema.walletTransactions)
      .where(
        and(eq(schema.walletTransactions.userId, ctx.user.id), eq(schema.walletTransactions.status, "completed")),
      );
    return { balance: row?.balance ?? "0" };
  }),

  transactions: protectedProcedure.query(({ ctx }) => {
    return ctx.db
      .select()
      .from(schema.walletTransactions)
      .where(eq(schema.walletTransactions.userId, ctx.user.id))
      .orderBy(desc(schema.walletTransactions.createdAt));
  }),

  // IMPORTANT: this does NOT credit the wallet. It only records that the
  // user says they're paying — the balance never moves until a signed
  // webhook from Airtel Money / MTN MoMo / Zamtel Kwacha confirms the charge
  // actually happened (see server/routers/paymentWebhook.ts, not yet wired
  // to a real provider). Do not add balance-crediting logic here: doing so
  // is exactly the "call this endpoint, mint free money" exploit this
  // replaced.
  topUp: protectedProcedure
    .input(
      z.object({
        amount: z.number().min(100),
        provider: z.enum(["Airtel Money", "MTN MoMo", "Zamtel Kwacha"]),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const [tx] = await ctx.db
        .insert(schema.walletTransactions)
        .values({
          userId: ctx.user.id,
          amount: String(input.amount),
          type: "topup",
          status: "pending",
          provider: input.provider,
          description: `Top up via ${input.provider} (awaiting confirmation)`,
        })
        .returning();

      await ctx.db.insert(schema.notifications).values({
        userId: ctx.user.id,
        type: "payment",
        title: "Top-up requested",
        message: `Approve the ${input.provider} prompt on your phone to complete the K${input.amount.toLocaleString()} top-up.`,
      });

      return tx;
    }),
});
