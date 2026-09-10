import { desc, eq, inArray, sql } from "drizzle-orm";
import { TRPCError } from "@trpc/server";
import { router, protectedProcedure } from "../trpc.js";
import { schema } from "../../db/index.js";

const productInput = z.object({
  name: z.string().min(1, "Product name is required"), description: z.string().optional(), price: z.number().positive("Price must be greater than 0"), comparePrice: z.number().positive().optional(), image: z.string().url("Image must be a valid URL"), categorySlug: z.string().min(1, "Category is required"), whatsappNumber: z.string().optional(), laybyMonths: z.number().int().positive().optional(), stock: z.number().int().min(0).default(10),
});

const SALES_STATUSES = ["paid", "processing", "shipped", "delivered"] as const;

export const vendorRouter = router({
  myProducts: protectedProcedure.query(({ ctx }) => ctx.db.select().from(schema.products).where(eq(schema.products.vendorId, ctx.user.id)).orderBy(desc(schema.products.createdAt))),
  addProduct: protectedProcedure.input(productInput).mutation(async ({ ctx, input }) => {
    const [category] = await ctx.db.select().from(schema.categories).where(eq(schema.categories.slug, input.categorySlug)).limit(1);
    if (!category) throw new TRPCError({ code: "BAD_REQUEST", message: "Unknown category" });
    const [created] = await ctx.db.insert(schema.products).values({ name: input.name, description: input.description ?? null, price: input.price.toString(), comparePrice: input.comparePrice?.toString() ?? null, image: input.image, categoryId: category.id, categorySlug: input.categorySlug, vendorId: ctx.user.id, vendor: ctx.user.name ?? "PEZA Seller", whatsappNumber: input.whatsappNumber ?? ctx.user.phone ?? null, laybyMonths: input.laybyMonths ?? null, stock: input.stock }).returning();
    await ctx.db.insert(schema.adminAuditLog).values({ actorId: ctx.user.id, action: "vendor.addProduct", targetType: "product", targetId: String(created.id), detail: { name: created.name, price: created.price, categorySlug: input.categorySlug } });
    return created;
  }),
  updateProduct: protectedProcedure.input(productInput.partial().extend({ id: z.number() })).mutation(async ({ ctx, input }) => {
    const { id, ...rest } = input;
    const [existing] = await ctx.db.select().from(schema.products).where(eq(schema.products.id, id)).limit(1);
    if (!existing) throw new TRPCError({ code: "NOT_FOUND", message: "Product not found" });
    if (existing.vendorId !== ctx.user.id) throw new TRPCError({ code: "FORBIDDEN", message: "You can only edit your own products" });
    let categoryId = existing.categoryId;
    if (rest.categorySlug) { const [category] = await ctx.db.select().from(schema.categories).where(eq(schema.categories.slug, rest.categorySlug)).limit(1); if (!category) throw new TRPCError({ code: "BAD_REQUEST", message: "Unknown category" }); categoryId = category.id; }
    return (await ctx.db.update(schema.products).set({ ...(rest.name !== undefined && { name: rest.name }), ...(rest.description !== undefined && { description: rest.description }), ...(rest.price !== undefined && { price: rest.price.toString() }), ...(rest.comparePrice !== undefined && { comparePrice: rest.comparePrice.toString() }), ...(rest.image !== undefined && { image: rest.image }), ...(rest.categorySlug !== undefined && { categorySlug: rest.categorySlug, categoryId }), ...(rest.whatsappNumber !== undefined && { whatsappNumber: rest.whatsappNumber }), ...(rest.laybyMonths !== undefined && { laybyMonths: rest.laybyMonths }), ...(rest.stock !== undefined && { stock: rest.stock }) }).where(eq(schema.products.id, id)).returning())[0];
  }),
  deleteProduct: protectedProcedure.input(z.object({ id: z.number() })).mutation(async ({ ctx, input }) => {
    const [existing] = await ctx.db.select().from(schema.products).where(eq(schema.products.id, input.id)).limit(1);
    if (!existing) throw new TRPCError({ code: "NOT_FOUND", message: "Product not found" });
    if (existing.vendorId !== ctx.user.id) throw new TRPCError({ code: "FORBIDDEN", message: "You can only delete your own products" });
    await ctx.db.delete(schema.products).where(eq(schema.products.id, input.id));
    return { success: true };
  }),
  salesSummary: protectedProcedure.query(async ({ ctx }) => {
    const myProducts = await ctx.db.select({ id: schema.products.id }).from(schema.products).where(eq(schema.products.vendorId, ctx.user.id));
    const productIds = myProducts.map((p) => p.id);
    if (productIds.length === 0) return { totalRevenue: 0, unitsSold: 0, ordersCount: 0, productCount: 0 };
    const [summary] = await ctx.db.select({ totalRevenue: sql<string>`coalesce(sum(${schema.orderItems.total}), 0)`, unitsSold: sql<string>`coalesce(sum(${schema.orderItems.quantity}), 0)`, ordersCount: sql<string>`count(distinct ${schema.orderItems.orderId})` }).from(schema.orderItems).innerJoin(schema.orders, eq(schema.orders.id, schema.orderItems.orderId)).where(sql`${schema.orderItems.productId} in (${sql.join(productIds.map((id) => sql`${id}`), sql`, `)}) and ${schema.orders.status} in (${sql.join(SALES_STATUSES.map((status) => sql`${status}`), sql`, `)})`);
    return { totalRevenue: Number(summary?.totalRevenue ?? 0), unitsSold: Number(summary?.unitsSold ?? 0), ordersCount: Number(summary?.ordersCount ?? 0), productCount: productIds.length };
  }),
  inventory: protectedProcedure.query(async ({ ctx }) => {
    const rows = await ctx.db.select({ id: schema.products.id, name: schema.products.name, stock: schema.products.stock, price: schema.products.price, categorySlug: schema.products.categorySlug }).from(schema.products).where(eq(schema.products.vendorId, ctx.user.id)).orderBy(schema.products.stock);
    return { totalUnits: rows.reduce((sum, p) => sum + p.stock, 0), lowStock: rows.filter((p) => p.stock <= 5), products: rows };
  }),
  topProducts: protectedProcedure.query(async ({ ctx }) => {
    const rows = await ctx.db.select({ productId: schema.orderItems.productId, productName: schema.orderItems.productName, unitsSold: sql<string>`coalesce(sum(${schema.orderItems.quantity}),0)`, revenue: sql<string>`coalesce(sum(${schema.orderItems.total}),0)` }).from(schema.orderItems).innerJoin(schema.products, eq(schema.products.id, schema.orderItems.productId)).innerJoin(schema.orders, eq(schema.orders.id, schema.orderItems.orderId)).where(sql`${schema.products.vendorId} = ${ctx.user.id} and ${schema.orders.status} in (${sql.join(SALES_STATUSES.map((status) => sql`${status}`), sql`, `)})`).groupBy(schema.orderItems.productId, schema.orderItems.productName).orderBy(desc(sql`sum(${schema.orderItems.total})`)).limit(5);
    return rows.map((p) => ({ ...p, unitsSold: Number(p.unitsSold), revenue: Number(p.revenue) }));
  }),
});