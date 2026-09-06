import { z } from "zod";
import { desc, eq, sql } from "drizzle-orm";
import { router, protectedProcedure } from "../trpc.js";
import { schema } from "../../db/index.js";

const productInput = z.object({ name: z.string().trim().min(2).max(120), description: z.string().trim().min(5).max(1000), price: z.number().positive(), stock: z.number().int().min(0).max(100000), categorySlug: z.string().trim().min(2).max(60), image: z.string().url().optional() });

export const vendorRouter = router({
  products: protectedProcedure.query(({ ctx }) => ctx.db.select().from(schema.products).where(eq(schema.products.sellerId, ctx.user.id)).orderBy(desc(schema.products.id))),
  profile: protectedProcedure.query(({ ctx }) => ctx.db.select().from(schema.vendorProfiles).where(eq(schema.vendorProfiles.userId, ctx.user.id))),
  saveProfile: protectedProcedure.input(z.object({ businessName: z.string().trim().min(2).max(120), description: z.string().max(1000).optional(), phone: z.string().max(30).optional(), location: z.string().max(120).optional() })).mutation(async ({ ctx, input }) => {
    const [profile] = await ctx.db.insert(schema.vendorProfiles).values({ userId: ctx.user.id, ...input }).onConflictDoUpdate({ target: schema.vendorProfiles.userId, set: { ...input, updatedAt: new Date() } }).returning();
    return profile;
  }),
  addProduct: protectedProcedure.input(productInput).mutation(async ({ ctx, input }) => {
    const [product] = await ctx.db.insert(schema.products).values({ ...input, sellerId: ctx.user.id, price: input.price.toFixed(2), image: input.image ?? "https://images.unsplash.com/photo-1556742049-0cfed4f6a45d?w=600", vendor: "Vendor" }).returning();
    return product;
  }),
  salesSummary: protectedProcedure.query(async ({ ctx }) => {
    const [summary] = await ctx.db.select({ orders: sql<number>`count(distinct ${schema.orders.id})`, revenue: sql<string>`coalesce(sum(${schema.orderItems.price} * ${schema.orderItems.quantity}), 0)` }).from(schema.orderItems).innerJoin(schema.products, eq(schema.products.id, schema.orderItems.productId)).innerJoin(schema.orders, eq(schema.orders.id, schema.orderItems.orderId)).where(eq(schema.products.sellerId, ctx.user.id));
    return summary;
  }),
});
