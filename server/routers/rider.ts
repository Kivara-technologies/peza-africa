import { z } from "zod";
import { TRPCError } from "@trpc/server";
import { router, protectedProcedure, invalidateProfileCache } from "../trpc.js";
import { schema } from "../../db/index.js";
import { eq, and, isNull, inArray, desc } from "drizzle-orm";

// Statuses a rider can pick a delivery up from. "paid" covers wallet orders
// (already paid, ready to go); "processing" covers cash-on-delivery orders
// (confirmed, no payment gateway step) — see server/routers/order.ts.
const CLAIMABLE_STATUSES = ["paid", "processing"] as const;

function requireRider(role: string) {
  if (role !== "rider") {
    throw new TRPCError({ code: "FORBIDDEN", message: "Rider account required" });
  }
}

export const riderRouter = router({
  // Self-service, same pattern as customer signup — no admin approval step
  // for the MVP. Anyone can opt into delivering.
  becomeRider: protectedProcedure.mutation(async ({ ctx }) => {
    if (ctx.user.role === "rider") return ctx.user;
    const [updated] = await ctx.db
      .update(schema.profiles)
      .set({ role: "rider" })
      .where(eq(schema.profiles.id, ctx.user.id))
      .returning();

    // Must happen before this request returns — otherwise a request that
    // lands within the profile-cache TTL right after this one (e.g. the
    // rider app immediately calling updateLocation) could still see the
    // old cached role and get wrongly rejected.
    invalidateProfileCache(ctx.user.id);

    await ctx.db.insert(schema.adminAuditLog).values({
      actorId: ctx.user.id,
      action: "rider.becomeRider",
      targetType: "profile",
      targetId: ctx.user.id,
      detail: { previousRole: ctx.user.role },
    });

    return updated;
  }),

  updateLocation: protectedProcedure
    .input(
      z.object({
        lat: z.number().min(-90).max(90),
        lng: z.number().min(-180).max(180),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      requireRider(ctx.user.role);
      const [row] = await ctx.db
        .insert(schema.riderLocations)
        .values({ riderId: ctx.user.id, lat: input.lat.toString(), lng: input.lng.toString(), isOnline: true })
        .onConflictDoUpdate({
          target: schema.riderLocations.riderId,
          set: { lat: input.lat.toString(), lng: input.lng.toString(), isOnline: true, updatedAt: new Date() },
        })
        .returning();
      return row;
    }),

  goOffline: protectedProcedure.mutation(async ({ ctx }) => {
    requireRider(ctx.user.role);
    await ctx.db
      .update(schema.riderLocations)
      .set({ isOnline: false })
      .where(eq(schema.riderLocations.riderId, ctx.user.id));
    return { success: true };
  }),

  // Unclaimed orders ready for pickup — a rider browses this list and
  // claims one. Deliberately light: enough to decide whether it's worth
  // taking, not the full order contents.
  availableOrders: protectedProcedure.query(async ({ ctx }) => {
    requireRider(ctx.user.role);
    return ctx.db
      .select({
        id: schema.orders.id,
        orderNumber: schema.orders.orderNumber,
        total: schema.orders.total,
        deliveryAddress: schema.orders.deliveryAddress,
        deliveryLat: schema.orders.deliveryLat,
        deliveryLng: schema.orders.deliveryLng,
        createdAt: schema.orders.createdAt,
      })
      .from(schema.orders)
      .where(and(isNull(schema.orders.riderId), inArray(schema.orders.status, [...CLAIMABLE_STATUSES])))
      .orderBy(desc(schema.orders.createdAt))
      .limit(50);
  }),

  // Claims are guarded by `riderId is null` in the WHERE clause itself, so
  // two riders tapping the same order at the same instant can't both win —
  // the second UPDATE simply matches zero rows.
  claimOrder: protectedProcedure
    .input(z.object({ orderId: z.number() }))
    .mutation(async ({ ctx, input }) => {
      requireRider(ctx.user.role);
      const [claimed] = await ctx.db
        .update(schema.orders)
        .set({ riderId: ctx.user.id, status: "shipped" })
        .where(
          and(
            eq(schema.orders.id, input.orderId),
            isNull(schema.orders.riderId),
            inArray(schema.orders.status, [...CLAIMABLE_STATUSES]),
          ),
        )
        .returning();

      if (!claimed) {
        throw new TRPCError({ code: "CONFLICT", message: "This delivery was just claimed by another rider" });
      }

      await ctx.db.insert(schema.notifications).values({
        userId: claimed.userId,
        type: "order",
        title: "Rider assigned",
        message: `A rider has picked up order ${claimed.orderNumber} and is on the way.`,
      });

      return claimed;
    }),

  // Deliveries currently assigned to me, in progress.
  myDeliveries: protectedProcedure.query(async ({ ctx }) => {
    requireRider(ctx.user.role);
    return ctx.db
      .select()
      .from(schema.orders)
      .where(and(eq(schema.orders.riderId, ctx.user.id), eq(schema.orders.status, "shipped")))
      .orderBy(desc(schema.orders.createdAt));
  }),

  markDelivered: protectedProcedure
    .input(z.object({ orderId: z.number() }))
    .mutation(async ({ ctx, input }) => {
      requireRider(ctx.user.role);
      const [order] = await ctx.db
        .select()
        .from(schema.orders)
        .where(eq(schema.orders.id, input.orderId));

      if (!order) throw new TRPCError({ code: "NOT_FOUND", message: "Order not found" });
      if (order.riderId !== ctx.user.id) {
        throw new TRPCError({ code: "FORBIDDEN", message: "This delivery isn't assigned to you" });
      }

      const [updated] = await ctx.db
        .update(schema.orders)
        .set({ status: "delivered" })
        .where(eq(schema.orders.id, input.orderId))
        .returning();

      await ctx.db.insert(schema.notifications).values({
        userId: order.userId,
        type: "order",
        title: "Delivered",
        message: `Order ${order.orderNumber} has been delivered. Enjoy!`,
      });

      return updated;
    }),
});
