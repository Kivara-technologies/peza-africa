import { z } from "zod";
import { TRPCError } from "@trpc/server";
import { and, desc, eq, sql } from "drizzle-orm";
import { router, protectedProcedure } from "../trpc.js";
import { schema } from "../../db/index.js";

const circleInput = z.object({
  name: z.string().trim().min(2).max(80),
  contributionAmount: z.number().positive().max(1_000_000),
  cycleLength: z.number().int().min(2).max(50),
});

export const chilimbaRouter = router({
  list: protectedProcedure.query(async ({ ctx }) =>
    ctx.db.select().from(schema.chilimbaCircles).orderBy(desc(schema.chilimbaCircles.createdAt)),
  ),

  mine: protectedProcedure.query(async ({ ctx }) =>
    ctx.db.select().from(schema.chilimbaMembers).where(eq(schema.chilimbaMembers.userId, ctx.user.id)),
  ),

  create: protectedProcedure.input(circleInput).mutation(async ({ ctx, input }) =>
    ctx.db.transaction(async (tx) => {
      const [circle] = await tx.insert(schema.chilimbaCircles).values({
        ownerId: ctx.user.id,
        name: input.name,
        contributionAmount: input.contributionAmount.toFixed(2),
        cycleLength: input.cycleLength,
      }).returning();
      await tx.insert(schema.chilimbaMembers).values({ circleId: circle.id, userId: ctx.user.id, payoutPosition: 1 });
      return circle;
    }),
  ),

  join: protectedProcedure.input(z.object({ circleId: z.number().int().positive() })).mutation(async ({ ctx, input }) =>
    ctx.db.transaction(async (tx) => {
      const [circle] = await tx.select().from(schema.chilimbaCircles).where(eq(schema.chilimbaCircles.id, input.circleId));
      if (!circle || circle.status !== "open") throw new TRPCError({ code: "NOT_FOUND", message: "This circle is not accepting members" });
      const [existing] = await tx.select().from(schema.chilimbaMembers).where(and(eq(schema.chilimbaMembers.circleId, input.circleId), eq(schema.chilimbaMembers.userId, ctx.user.id)));
      if (existing) return existing;
      const [{ count }] = await tx.select({ count: sql<number>`count(*)` }).from(schema.chilimbaMembers).where(eq(schema.chilimbaMembers.circleId, input.circleId));
      if (Number(count) >= circle.cycleLength) throw new TRPCError({ code: "BAD_REQUEST", message: "This circle is full" });
      const [member] = await tx.insert(schema.chilimbaMembers).values({ circleId: input.circleId, userId: ctx.user.id, payoutPosition: Number(count) + 1 }).returning();
      return member;
    }),
  ),

  contribute: protectedProcedure.input(z.object({ circleId: z.number().int().positive() })).mutation(async ({ ctx, input }) =>
    ctx.db.transaction(async (tx) => {
      const [circle] = await tx.select().from(schema.chilimbaCircles).where(eq(schema.chilimbaCircles.id, input.circleId)).for("update");
      if (!circle || circle.status !== "open") throw new TRPCError({ code: "NOT_FOUND", message: "Circle is not active" });
      const [member] = await tx.select().from(schema.chilimbaMembers).where(and(eq(schema.chilimbaMembers.circleId, input.circleId), eq(schema.chilimbaMembers.userId, ctx.user.id)));
      if (!member) throw new TRPCError({ code: "FORBIDDEN", message: "Join the circle before contributing" });
      const [existing] = await tx.select().from(schema.chilimbaContributions).where(and(eq(schema.chilimbaContributions.memberId, member.id), eq(schema.chilimbaContributions.cycle, circle.currentCycle)));
      if (existing) throw new TRPCError({ code: "CONFLICT", message: "You already contributed for this cycle" });
      const [balance] = await tx.select({ value: sql<string>`coalesce(sum(${schema.walletTransactions.amount}), 0)` }).from(schema.walletTransactions).where(and(eq(schema.walletTransactions.userId, ctx.user.id), eq(schema.walletTransactions.status, "completed")));
      const amount = Number(circle.contributionAmount);
      if (Number(balance?.value ?? 0) < amount) throw new TRPCError({ code: "BAD_REQUEST", message: "Insufficient wallet balance" });
      const [debit] = await tx.insert(schema.walletTransactions).values({ userId: ctx.user.id, amount: (-amount).toFixed(2), type: "payment", status: "completed", description: `Chilimba: ${circle.name}` }).returning();
      const [contribution] = await tx.insert(schema.chilimbaContributions).values({ circleId: circle.id, memberId: member.id, cycle: circle.currentCycle, amount: amount.toFixed(2), walletTransactionId: debit.id }).returning();
      return contribution;
    }),
  ),
});
