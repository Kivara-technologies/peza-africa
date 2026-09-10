import { z } from "zod";
import { router, protectedProcedure } from "../trpc.js";
import { schema } from "../../db/index.js";
import { and, asc, eq, inArray, sql } from "drizzle-orm";
import { TRPCError } from "@trpc/server";
import { toCents, fromCents } from "../lib/money.js";

// One GROUP BY query for all circle member counts, instead of one query
// per circle (the N+1 the audit flagged in discover/myCircles).
async function memberCountsByCircle(db: any, circleIds: number[]): Promise<Map<number, number>> {
  if (circleIds.length === 0) return new Map();
  const rows = await db
    .select({ circleId: schema.chilimbaMembers.circleId, count: sql<number>`count(*)::int` })
    .from(schema.chilimbaMembers)
    .where(inArray(schema.chilimbaMembers.circleId, circleIds))
    .groupBy(schema.chilimbaMembers.circleId);
  return new Map(rows.map((r: any) => [r.circleId, r.count]));
}

export const chilimbaRouter = router({
  // Circles still recruiting members — open to join.
  discover: protectedProcedure.query(async ({ ctx }) => {
    const circles = await ctx.db
      .select()
      .from(schema.chilimbaCircles)
      .where(eq(schema.chilimbaCircles.status, "recruiting"))
      .orderBy(asc(schema.chilimbaCircles.createdAt));

    const counts = await memberCountsByCircle(
      ctx.db,
      circles.map((c) => c.id),
    );

    return circles.map((c) => ({ ...c, memberCount: counts.get(c.id) ?? 0 }));
  }),

  // Circles the signed-in user belongs to, with their own position/status.
  myCircles: protectedProcedure.query(async ({ ctx }) => {
    const memberships = await ctx.db
      .select({
        circle: schema.chilimbaCircles,
        payoutPosition: schema.chilimbaMembers.payoutPosition,
        hasBeenPaid: schema.chilimbaMembers.hasBeenPaid,
      })
      .from(schema.chilimbaMembers)
      .innerJoin(schema.chilimbaCircles, eq(schema.chilimbaMembers.circleId, schema.chilimbaCircles.id))
      .where(eq(schema.chilimbaMembers.userId, ctx.user.id))
      .orderBy(asc(schema.chilimbaCircles.createdAt));

    const counts = await memberCountsByCircle(
      ctx.db,
      memberships.map((m) => m.circle.id),
    );

    const withDetail = await Promise.all(
      memberships.map(async (m) => {
        const myContribution =
          m.circle.status === "active"
            ? await ctx.db
                .select({ id: schema.chilimbaContributions.id })
                .from(schema.chilimbaContributions)
                .where(
                  and(
                    eq(schema.chilimbaContributions.circleId, m.circle.id),
                    eq(schema.chilimbaContributions.userId, ctx.user.id),
                    eq(schema.chilimbaContributions.round, m.circle.currentRound),
                  ),
                )
            : [];

        return {
          ...m.circle,
          memberCount: counts.get(m.circle.id) ?? 0,
          myPayoutPosition: m.payoutPosition,
          myHasBeenPaid: m.hasBeenPaid,
          hasContributedThisRound: myContribution.length > 0,
        };
      }),
    );

    return withDetail;
  }),

  create: protectedProcedure
    .input(
      z.object({
        name: z.string().min(1),
        description: z.string().optional(),
        contributionAmount: z.number().positive(),
        frequencyDays: z.number().int().positive().default(7),
        maxMembers: z.number().int().min(2).max(50),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      return ctx.db.transaction(async (tx) => {
        const [circle] = await tx
          .insert(schema.chilimbaCircles)
          .values({
            name: input.name,
            description: input.description ?? null,
            contributionAmount: input.contributionAmount.toString(),
            frequencyDays: input.frequencyDays,
            maxMembers: input.maxMembers,
            creatorId: ctx.user.id,
          })
          .returning();

        // Creator automatically takes the first payout position.
        await tx.insert(schema.chilimbaMembers).values({
          circleId: circle.id,
          userId: ctx.user.id,
          payoutPosition: 1,
        });

        return circle;
      });
    }),

  join: protectedProcedure
    .input(z.object({ circleId: z.number() }))
    .mutation(async ({ ctx, input }) => {
      return ctx.db.transaction(async (tx) => {
        // Lock the circle row for the duration of this transaction so two
        // people can't both grab the last open slot at the same time.
        const [circle] = await tx
          .select()
          .from(schema.chilimbaCircles)
          .where(eq(schema.chilimbaCircles.id, input.circleId))
          .for("update");

        if (!circle) {
          throw new TRPCError({ code: "NOT_FOUND", message: "Circle not found" });
        }
        if (circle.status !== "recruiting") {
          throw new TRPCError({ code: "BAD_REQUEST", message: "This circle is no longer accepting members" });
        }

        const existingMembers = await tx
          .select()
          .from(schema.chilimbaMembers)
          .where(eq(schema.chilimbaMembers.circleId, circle.id));

        if (existingMembers.some((m) => m.userId === ctx.user.id)) {
          throw new TRPCError({ code: "BAD_REQUEST", message: "You're already in this circle" });
        }
        if (existingMembers.length >= circle.maxMembers) {
          throw new TRPCError({ code: "BAD_REQUEST", message: "This circle is full" });
        }

        const nextPosition = existingMembers.length + 1;

        await tx.insert(schema.chilimbaMembers).values({
          circleId: circle.id,
          userId: ctx.user.id,
          payoutPosition: nextPosition,
        });

        // Circle fills up -> activate it, round 1 begins.
        if (nextPosition === circle.maxMembers) {
          await tx
            .update(schema.chilimbaCircles)
            .set({ status: "active", currentRound: 1 })
            .where(eq(schema.chilimbaCircles.id, circle.id));

          for (const m of existingMembers) {
            await tx.insert(schema.notifications).values({
              userId: m.userId,
              type: "info",
              title: "Chilimba circle is full",
              message: `"${circle.name}" is now active. Round 1 contributions are open.`,
            });
          }
          await tx.insert(schema.notifications).values({
            userId: ctx.user.id,
            type: "info",
            title: "Chilimba circle is full",
            message: `"${circle.name}" is now active. Round 1 contributions are open.`,
          });
        }

        return { success: true };
      });
    }),

  // Contribute this round's amount. If this completes the round (every
  // member has paid in), the pot is paid out to that round's recipient
  // automatically, atomically, in the same transaction.
  contribute: protectedProcedure
    .input(z.object({ circleId: z.number() }))
    .mutation(async ({ ctx, input }) => {
      return ctx.db.transaction(async (tx) => {
        const [circle] = await tx
          .select()
          .from(schema.chilimbaCircles)
          .where(eq(schema.chilimbaCircles.id, input.circleId))
          .for("update");

        if (!circle) {
          throw new TRPCError({ code: "NOT_FOUND", message: "Circle not found" });
        }
        if (circle.status !== "active") {
          throw new TRPCError({ code: "BAD_REQUEST", message: "This circle isn't active" });
        }

        const [membership] = await tx
          .select()
          .from(schema.chilimbaMembers)
          .where(
            and(
              eq(schema.chilimbaMembers.circleId, circle.id),
              eq(schema.chilimbaMembers.userId, ctx.user.id),
            ),
          );

        if (!membership) {
          throw new TRPCError({ code: "FORBIDDEN", message: "You're not a member of this circle" });
        }

        const [already] = await tx
          .select()
          .from(schema.chilimbaContributions)
          .where(
            and(
              eq(schema.chilimbaContributions.circleId, circle.id),
              eq(schema.chilimbaContributions.userId, ctx.user.id),
              eq(schema.chilimbaContributions.round, circle.currentRound),
            ),
          );

        if (already) {
          throw new TRPCError({ code: "BAD_REQUEST", message: "You've already contributed this round" });
        }

        const contributionCents = toCents(circle.contributionAmount);

        const [balanceRow] = await tx
          .select({
            balance: sql<string>`coalesce(sum(${schema.walletTransactions.amount}), 0)`,
          })
          .from(schema.walletTransactions)
          .where(
            and(
              eq(schema.walletTransactions.userId, ctx.user.id),
              eq(schema.walletTransactions.status, "completed"),
            ),
          );
        const balanceCents = toCents(balanceRow?.balance ?? "0");

        if (balanceCents < contributionCents) {
          throw new TRPCError({
            code: "BAD_REQUEST",
            message: `Insufficient wallet balance. You need K${fromCents(contributionCents)} but have K${fromCents(balanceCents)}.`,
          });
        }

        // Debit the contributor's wallet and record the contribution.
        await tx.insert(schema.walletTransactions).values({
          userId: ctx.user.id,
          amount: fromCents(-contributionCents),
          type: "payment",
          status: "completed", // internal transfer between members — immediate, never pending
          description: `Chilimba contribution — "${circle.name}" (round ${circle.currentRound})`,
        });

        await tx.insert(schema.chilimbaContributions).values({
          circleId: circle.id,
          userId: ctx.user.id,
          round: circle.currentRound,
          amount: fromCents(contributionCents),
        });

        const allMembers = await tx
          .select()
          .from(schema.chilimbaMembers)
          .where(eq(schema.chilimbaMembers.circleId, circle.id));

        const contributionsThisRound = await tx
          .select()
          .from(schema.chilimbaContributions)
          .where(
            and(
              eq(schema.chilimbaContributions.circleId, circle.id),
              eq(schema.chilimbaContributions.round, circle.currentRound),
            ),
          );

        const roundComplete = contributionsThisRound.length === allMembers.length;

        if (!roundComplete) {
          return { success: true, roundComplete: false };
        }

        // Everyone has paid in — pay out the pot to this round's recipient.
        const recipient = allMembers.find((m) => m.payoutPosition === circle.currentRound);
        if (!recipient) {
          throw new TRPCError({
            code: "INTERNAL_SERVER_ERROR",
            message: "Could not determine this round's payout recipient",
          });
        }

        const potCents = contributionCents * allMembers.length;

        await tx.insert(schema.walletTransactions).values({
          userId: recipient.userId,
          amount: fromCents(potCents),
          // "payout" (not "refund" — a payout was never a refund, and
          // labeling it as one polluted refund accounting/reporting).
          type: "payout",
          status: "completed", // internal transfer between members — immediate, never pending
          description: `Chilimba payout — "${circle.name}" (round ${circle.currentRound})`,
        });

        await tx.insert(schema.chilimbaPayouts).values({
          circleId: circle.id,
          round: circle.currentRound,
          recipientId: recipient.userId,
          amount: fromCents(potCents),
        });

        await tx
          .update(schema.chilimbaMembers)
          .set({ hasBeenPaid: true })
          .where(eq(schema.chilimbaMembers.id, recipient.id));

        const isLastRound = circle.currentRound === circle.maxMembers;

        await tx
          .update(schema.chilimbaCircles)
          .set({
            currentRound: circle.currentRound + 1,
            status: isLastRound ? "completed" : "active",
          })
          .where(eq(schema.chilimbaCircles.id, circle.id));

        for (const m of allMembers) {
          await tx.insert(schema.notifications).values({
            userId: m.userId,
            type: "payment",
            title:
              m.userId === recipient.userId
                ? "You received your Chilimba payout!"
                : "Chilimba round complete",
            message:
              m.userId === recipient.userId
                ? `K${fromCents(potCents)} has been added to your wallet from "${circle.name}".`
                : `Round ${circle.currentRound} of "${circle.name}" is complete. Payout sent.`,
          });
        }

        return { success: true, roundComplete: true, payoutAmount: fromCents(potCents) };
      });
    }),
});
