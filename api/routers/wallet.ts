import { z } from "zod";
import { router, protectedProcedure } from "../trpc";
import { schema } from "../../db";
import { eq, desc, sql } from "drizzle-orm";

export const walletRouter = router({
  balance: protectedProcedure.query(async ({ ctx }) => {
    const [row] = await ctx.db
      .select({
        balance: sql<string>`coalesce(sum(${schema.walletTransactions.amount}), 0)`,
      })
      .from(schema.walletTransactions)
      .where(eq(schema.walletTransactions.userId, ctx.user.id));
    return { balance: row?.balance ?? "0" };
  }),

  transactions: protectedProcedure.query(({ ctx }) => {
    return ctx.db
      .select()
      .from(schema.walletTransactions)
      .where(eq(schema.walletTransactions.userId, ctx.user.id))
      .orderBy(desc(schema.walletTransactions.createdAt));
  }),

  topUp: protectedProcedure
    .input(
      z.object({
        amount: z.number().min(100),
        provider: z.enum(["M-Pesa", "Airtel", "MTN"]),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const [tx] = await ctx.db
        .insert(schema.walletTransactions)
        .values({
          userId: ctx.user.id,
          amount: String(input.amount),
          type: "topup",
          provider: input.provider,
          description: `Top up via ${input.provider}`,
        })
        .returning();

      await ctx.db.insert(schema.notifications).values({
        userId: ctx.user.id,
        type: "payment",
        title: "Wallet top up",
        message: `K${input.amount.toLocaleString()} added via ${input.provider}.`,
      });

      return tx;
    }),
});
