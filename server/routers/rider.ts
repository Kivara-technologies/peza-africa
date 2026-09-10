import { z } from "zod";
import { TRPCError } from "@trpc/server";
import { router, protectedProcedure, invalidateProfileCache } from "../trpc.js";
import { schema } from "../../db/index.js";
import { eq, and, isNull, inArray, desc, sql } from "drizzle-orm";

const CLAIMABLE_STATUSES = ["paid", "processing"] as const;
const RIDER_BASE_ZMW = 6.7;
const RIDER_PER_KM_ZMW = 1.1;
function requireRider(role: string) { if (role !== "rider") throw new TRPCError({ code: "FORBIDDEN", message: "Rider account required" }); }
function requireAdmin(role: string) { if (role !== "admin") throw new TRPCError({ code: "FORBIDDEN", message: "Admin account required" }); }
function distanceKm(lat1: number, lng1: number, lat2: number, lng2: number) { const r = 6371; const dLat = ((lat2 - lat1) * Math.PI) / 180; const dLng = ((lng2 - lng1) * Math.PI) / 180; const a = Math.sin(dLat / 2) ** 2 + Math.cos((lat1 * Math.PI) / 180) * Math.cos((lat2 * Math.PI) / 180) * Math.sin(dLng / 2) ** 2; return 2 * r * Math.asin(Math.sqrt(a)); }
const applicationInput = z.object({ vehicleType: z.string().trim().min(2).max(50), vehicleRegistration: z.string().trim().max(30).optional(), serviceArea: z.string().trim().min(2).max(100), notes: z.string().trim().max(500).optional() });

export const riderRouter = router({
  becomeRider: protectedProcedure.mutation(async ({ ctx }) => {
    if (ctx.user.role === "rider") return { status: "approved" as const, message: "Your account is already an approved rider." };
    const existing = await ctx.db.select().from(schema.riderApplications).where(eq(schema.riderApplications.userId, ctx.user.id)).limit(1);
    if (existing[0]?.status === "pending") return { status: "pending" as const, message: "Your rider application is already under review." };
    if (existing[0]?.status === "rejected") throw new TRPCError({ code: "CONFLICT", message: "Your previous rider application was not approved. Please submit an updated application." });
    await ctx.db.insert(schema.riderApplications).values({ userId: ctx.user.id, vehicleType: "To be provided", serviceArea: "To be provided", notes: "Application started from rider onboarding; details require completion." });
    return { status: "pending" as const, message: "Rider application submitted for PEZA review." };
  }),
  apply: protectedProcedure.input(applicationInput).mutation(async ({ ctx, input }) => {
    if (ctx.user.role === "rider") return { status: "approved" as const, message: "Your account is already an approved rider." };
    const existing = await ctx.db.select().from(schema.riderApplications).where(eq(schema.riderApplications.userId, ctx.user.id)).limit(1);
    if (existing[0]?.status === "pending") return { status: "pending" as const, message: "Your rider application is already under review." };
    let application;
    if (existing[0]) {
      [application] = await ctx.db.update(schema.riderApplications).set({ ...input, status: "pending", reviewedBy: null, reviewedAt: null, reviewNote: null, updatedAt: new Date() }).where(eq(schema.riderApplications.userId, ctx.user.id)).returning();
    } else {
      [application] = await ctx.db.insert(schema.riderApplications).values({ userId: ctx.user.id, ...input }).returning();
    }
    return { status: application.status as "pending", message: "Application submitted. PEZA will review your rider application." };
  }),
  applicationStatus: protectedProcedure.query(async ({ ctx }) => {
    if (ctx.user.role === "rider") return { status: "approved" as const, application: null };
    const [application] = await ctx.db.select().from(schema.riderApplications).where(eq(schema.riderApplications.userId, ctx.user.id)).limit(1);
    return { status: (application?.status ?? "none") as "none" | "pending" | "approved" | "rejected", application: application ?? null };
  }),
  adminApplications: protectedProcedure.query(async ({ ctx }) => {
    requireAdmin(ctx.user.role);
    return ctx.db.select({ application: schema.riderApplications, name: schema.profiles.name, email: schema.profiles.email, phone: schema.profiles.phone }).from(schema.riderApplications).innerJoin(schema.profiles, eq(schema.riderApplications.userId, schema.profiles.id)).orderBy(desc(schema.riderApplications.createdAt)).limit(100);
  }),
  reviewApplication: protectedProcedure.input(z.object({ applicationId: z.number(), decision: z.enum(["approved", "rejected"]), reviewNote: z.string().trim().max(500).optional() })).mutation(async ({ ctx, input }) => {
    requireAdmin(ctx.user.role);
    const [application] = await ctx.db.select().from(schema.riderApplications).where(eq(schema.riderApplications.id, input.applicationId)).limit(1);
    if (!application) throw new TRPCError({ code: "NOT_FOUND", message: "Rider application not found" });
    if (application.status !== "pending") throw new TRPCError({ code: "CONFLICT", message: "This application has already been reviewed" });
    return ctx.db.transaction(async (tx) => {
      const [updated] = await tx.update(schema.riderApplications).set({ status: input.decision, reviewedBy: ctx.user.id, reviewedAt: new Date(), reviewNote: input.reviewNote || null, updatedAt: new Date() }).where(and(eq(schema.riderApplications.id, input.applicationId), eq(schema.riderApplications.status, "pending"))).returning();
      if (!updated) throw new TRPCError({ code: "CONFLICT", message: "This application was reviewed by another admin" });
      if (input.decision === "approved") {
        await tx.update(schema.profiles).set({ role: "rider" }).where(eq(schema.profiles.id, application.userId));
        await tx.insert(schema.notifications).values({ userId: application.userId, type: "rider", title: "Rider application approved", message: "Your PEZA rider application has been approved. You can now go online and accept deliveries." });
      } else {
        await tx.insert(schema.notifications).values({ userId: application.userId, type: "rider", title: "Rider application update", message: input.reviewNote ? `Your PEZA rider application was not approved. ${input.reviewNote}` : "Your PEZA rider application was not approved at this time." });
      }
      await tx.insert(schema.adminAuditLog).values({ actorId: ctx.user.id, action: `rider.application.${input.decision}`, targetType: "rider_application", targetId: String(application.id), detail: { userId: application.userId, reviewNote: input.reviewNote || null } });
      invalidateProfileCache(application.userId);
      return updated;
    });
  }),
  updateLocation: protectedProcedure.input(z.object({ lat: z.number().min(-90).max(90), lng: z.number().min(-180).max(180) })).mutation(async ({ ctx, input }) => { requireRider(ctx.user.role); const [row] = await ctx.db.insert(schema.riderLocations).values({ riderId: ctx.user.id, lat: input.lat.toString(), lng: input.lng.toString(), isOnline: true }).onConflictDoUpdate({ target: schema.riderLocations.riderId, set: { lat: input.lat.toString(), lng: input.lng.toString(), isOnline: true, updatedAt: new Date() } }).returning(); return row; }),
  goOffline: protectedProcedure.mutation(async ({ ctx }) => { requireRider(ctx.user.role); await ctx.db.update(schema.riderLocations).set({ isOnline: false }).where(eq(schema.riderLocations.riderId, ctx.user.id)); return { success: true }; }),
  availableOrders: protectedProcedure.query(async ({ ctx }) => { requireRider(ctx.user.role); return ctx.db.select({ id: schema.orders.id, orderNumber: schema.orders.orderNumber, total: schema.orders.total, shipping: schema.orders.shipping, deliveryAddress: schema.orders.deliveryAddress, deliveryLat: schema.orders.deliveryLat, deliveryLng: schema.orders.deliveryLng, createdAt: schema.orders.createdAt }).from(schema.orders).where(and(isNull(schema.orders.riderId), inArray(schema.orders.status, [...CLAIMABLE_STATUSES]))).orderBy(desc(schema.orders.createdAt)).limit(50); }),
  claimOrder: protectedProcedure.input(z.object({ orderId: z.number() })).mutation(async ({ ctx, input }) => { requireRider(ctx.user.role); const [location] = await ctx.db.select().from(schema.riderLocations).where(eq(schema.riderLocations.riderId, ctx.user.id)).limit(1); const [order] = await ctx.db.select().from(schema.orders).where(and(eq(schema.orders.id, input.orderId), isNull(schema.orders.riderId), inArray(schema.orders.status, [...CLAIMABLE_STATUSES]))).limit(1); if (!order) throw new TRPCError({ code: "CONFLICT", message: "This delivery was just claimed by another rider" }); let earning = Number(order.shipping); if (location && order.deliveryLat !== null && order.deliveryLng !== null) { const km = distanceKm(Number(location.lat), Number(location.lng), Number(order.deliveryLat), Number(order.deliveryLng)); earning = Math.max(earning, RIDER_BASE_ZMW + RIDER_PER_KM_ZMW * km); } earning = Number(earning.toFixed(2)); const [claimed] = await ctx.db.update(schema.orders).set({ riderId: ctx.user.id, riderEarning: earning.toFixed(2), status: "shipped" }).where(and(eq(schema.orders.id, input.orderId), isNull(schema.orders.riderId), inArray(schema.orders.status, [...CLAIMABLE_STATUSES]))).returning(); if (!claimed) throw new TRPCError({ code: "CONFLICT", message: "This delivery was just claimed by another rider" }); await ctx.db.insert(schema.notifications).values({ userId: claimed.userId, type: "order", title: "Rider assigned", message: `A rider has picked up order ${claimed.orderNumber} and is on the way.` }); return claimed; }),
  myDeliveries: protectedProcedure.query(async ({ ctx }) => { requireRider(ctx.user.role); return ctx.db.select().from(schema.orders).where(and(eq(schema.orders.riderId, ctx.user.id), eq(schema.orders.status, "shipped"))).orderBy(desc(schema.orders.createdAt)); }),
  history: protectedProcedure.query(async ({ ctx }) => { requireRider(ctx.user.role); return ctx.db.select({ id: schema.orders.id, orderNumber: schema.orders.orderNumber, total: schema.orders.total, riderEarning: schema.orders.riderEarning, deliveryAddress: schema.orders.deliveryAddress, status: schema.orders.status, createdAt: schema.orders.createdAt }).from(schema.orders).where(and(eq(schema.orders.riderId, ctx.user.id), eq(schema.orders.status, "delivered"))).orderBy(desc(schema.orders.createdAt)).limit(100); }),
  earnings: protectedProcedure.query(async ({ ctx }) => { requireRider(ctx.user.role); const [result] = await ctx.db.select({ total: sql<string>`coalesce(sum(${schema.orders.riderEarning}), 0)`, trips: sql<number>`count(*)` }).from(schema.orders).where(and(eq(schema.orders.riderId, ctx.user.id), eq(schema.orders.status, "delivered"))); return { total: Number(result?.total ?? 0), trips: Number(result?.trips ?? 0), currency: "ZMW" as const }; }),
  markDelivered: protectedProcedure.input(z.object({ orderId: z.number() })).mutation(async ({ ctx, input }) => { requireRider(ctx.user.role); const [order] = await ctx.db.select().from(schema.orders).where(eq(schema.orders.id, input.orderId)); if (!order) throw new TRPCError({ code: "NOT_FOUND", message: "Order not found" }); if (order.riderId !== ctx.user.id) throw new TRPCError({ code: "FORBIDDEN", message: "This delivery isn't assigned to you" }); if (order.status !== "shipped") throw new TRPCError({ code: "BAD_REQUEST", message: `Order is "${order.status}" and cannot be marked delivered` }); const [updated] = await ctx.db.update(schema.orders).set({ status: "delivered" }).where(and(eq(schema.orders.id, input.orderId), eq(schema.orders.riderId, ctx.user.id), eq(schema.orders.status, "shipped"))).returning(); if (!updated) throw new TRPCError({ code: "CONFLICT", message: "Delivery status changed; refresh and try again" }); await ctx.db.insert(schema.notifications).values({ userId: order.userId, type: "order", title: "Delivered", message: `Order ${order.orderNumber} has been delivered. Enjoy!` }); return updated; }),
});