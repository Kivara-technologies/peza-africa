import { z } from "zod";
import { router, protectedProcedure } from "../trpc.js";
import { schema } from "../../db/index.js";
import { desc, eq, inArray, sql } from "drizzle-orm";
import { TRPCError } from "@trpc/server";

const productInput = z.object({
  name: z.string().min(1, "Product name is required"),
  description: z.string().optional(),
  price: z.number().positive("Price must be greater than 0"),
  comparePrice: z.number().positive().optional(),
  image: z.string().url("Image must be a valid URL"),
  categorySlug: z.string().min(1, "Category is required"),
  whatsappNumber: z.string().optional(),
  laybyMonths: z.number().int().positive().optional(),
  stock: z.number().int().min(0).default(10),
});

export const vendorRouter = router({
  // Products belonging to the signed-in seller.
  myProducts: protectedProcedure.query(({ ctx }) => {
    return ctx.db
      .select()
      .from(schema.products)
      .where(eq(schema.products.vendorId, ctx.user.id))
      .orderBy(desc(schema.products.createdAt));
  }),

  addProduct: protectedProcedure.input(productInput).mutation(async ({ ctx, input }) => {
    const [category] = await ctx.db
      .select()
      .from(schema.categories)
      .where(eq(schema.categories.slug, input.categorySlug))
      .limit(1);

    if (!category) {
      throw new TRPCError({ code: "BAD_REQUEST", message: "Unknown category" });
    }

    const [created] = await ctx.db
      .insert(schema.products)
      .values({
        name: input.name,
        description: input.description ?? null,
        price: input.price.toString(),
        comparePrice: input.comparePrice?.toString() ?? null,
        image: input.image,
        categoryId: category.id,
        categorySlug: input.categorySlug,
        vendorId: ctx.user.id,
        vendor: ctx.user.name ?? "PEZA Seller",
        whatsappNumber: input.whatsappNumber ?? ctx.user.phone ?? null,
        laybyMonths: input.laybyMonths ?? null,
        stock: input.stock,
      })
      .returning();

    return created;
  }),

  updateProduct: protectedProcedure
    .input(productInput.partial().extend({ id: z.number() }))
    .mutation(async ({ ctx, input }) => {
      const { id, ...rest } = input;

      const [existing] = await ctx.db
        .select()
        .from(schema.products)
        .where(eq(schema.products.id, id))
        .limit(1);

      if (!existing) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Product not found" });
      }
      if (existing.vendorId !== ctx.user.id) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "You can only edit your own products",
        });
      }

      let categoryId = existing.categoryId;
      if (rest.categorySlug) {
        const [category] = await ctx.db
          .select()
          .from(schema.categories)
          .where(eq(schema.categories.slug, rest.categorySlug))
          .limit(1);
        if (!category) {
          throw new TRPCError({ code: "BAD_REQUEST", message: "Unknown category" });
        }
        categoryId = category.id;
      }

      const [updated] = await ctx.db
        .update(schema.products)
        .set({
          ...(rest.name !== undefined && { name: rest.name }),
          ...(rest.description !== undefined && { description: rest.description }),
          ...(rest.price !== undefined && { price: rest.price.toString() }),
          ...(rest.comparePrice !== undefined && {
            comparePrice: rest.comparePrice.toString(),
          }),
          ...(rest.image !== undefined && { image: rest.image }),
          ...(rest.categorySlug !== undefined && {
            categorySlug: rest.categorySlug,
            categoryId,
          }),
          ...(rest.whatsappNumber !== undefined && { whatsappNumber: rest.whatsappNumber }),
          ...(rest.laybyMonths !== undefined && { laybyMonths: rest.laybyMonths }),
          ...(rest.stock !== undefined && { stock: rest.stock }),
        })
        .where(eq(schema.products.id, id))
        .returning();

      return updated;
    }),

  deleteProduct: protectedProcedure
    .input(z.object({ id: z.number() }))
    .mutation(async ({ ctx, input }) => {
      const [existing] = await ctx.db
        .select()
        .from(schema.products)
        .where(eq(schema.products.id, input.id))
        .limit(1);

      if (!existing) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Product not found" });
      }
      if (existing.vendorId !== ctx.user.id) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "You can only delete your own products",
        });
      }

      await ctx.db.delete(schema.products).where(eq(schema.products.id, input.id));
      return { success: true };
    }),

  // Revenue summary across this seller's products, derived from real order_items
  // rows (never a made-up number) — zero and empty are honest answers pre-launch.
  salesSummary: protectedProcedure.query(async ({ ctx }) => {
    const myProducts = await ctx.db
      .select({ id: schema.products.id })
      .from(schema.products)
      .where(eq(schema.products.vendorId, ctx.user.id));

    const productIds = myProducts.map((p) => p.id);

    if (productIds.length === 0) {
      return { totalRevenue: 0, unitsSold: 0, ordersCount: 0, productCount: 0 };
    }

    const [summary] = await ctx.db
      .select({
        totalRevenue: sql<string>`coalesce(sum(${schema.orderItems.total}), 0)`,
        unitsSold: sql<string>`coalesce(sum(${schema.orderItems.quantity}), 0)`,
        ordersCount: sql<string>`count(distinct ${schema.orderItems.orderId})`,
      })
      .from(schema.orderItems)
      .where(inArray(schema.orderItems.productId, productIds));

    return {
      totalRevenue: Number(summary?.totalRevenue ?? 0),
      unitsSold: Number(summary?.unitsSold ?? 0),
      ordersCount: Number(summary?.ordersCount ?? 0),
      productCount: productIds.length,
    };
  }),
});
