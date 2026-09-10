import { z } from "zod";
import { router, publicProcedure } from "../trpc.js";
import { schema } from "../../db/index.js";
import { and, asc, desc, eq, ilike, or } from "drizzle-orm";

export const productRouter = router({
  list: publicProcedure
    .input(
      z.object({
        category: z.string().optional(),
        search: z.string().optional(),
        sort: z.enum(["newest", "price-asc", "price-desc", "rating"]).default("newest"),
        // Optional pagination — defaults preserve today's behavior for any
        // caller that doesn't pass these, just with a sane upper bound
        // instead of an unbounded "return the whole catalog" query.
        limit: z.number().int().min(1).max(200).default(100),
        offset: z.number().int().min(0).default(0),
      }),
    )
    .query(async ({ ctx, input }) => {
      const conditions = [];
      if (input.category) {
        conditions.push(eq(schema.products.categorySlug, input.category));
      }
      if (input.search) {
        conditions.push(
          or(
            ilike(schema.products.name, `%${input.search}%`),
            ilike(schema.products.description, `%${input.search}%`),
          ),
        );
      }

      const orderBy =
        input.sort === "price-asc"
          ? asc(schema.products.price)
          : input.sort === "price-desc"
            ? desc(schema.products.price)
            : input.sort === "rating"
              ? desc(schema.products.rating)
              : desc(schema.products.createdAt);

      return ctx.db
        .select()
        .from(schema.products)
        .where(conditions.length ? and(...conditions) : undefined)
        .orderBy(orderBy)
        .limit(input.limit)
        .offset(input.offset);
    }),

  byId: publicProcedure.input(z.object({ id: z.number() })).query(async ({ ctx, input }) => {
    const [product] = await ctx.db
      .select()
      .from(schema.products)
      .where(eq(schema.products.id, input.id))
      .limit(1);
    return product ?? null;
  }),

  featured: publicProcedure.query(({ ctx }) => {
    return ctx.db
      .select()
      .from(schema.products)
      .where(eq(schema.products.featured, true))
      .orderBy(desc(schema.products.createdAt))
      .limit(20);
  }),

  deals: publicProcedure.query(({ ctx }) => {
    return ctx.db
      .select()
      .from(schema.products)
      .where(eq(schema.products.isDeal, true))
      .orderBy(desc(schema.products.createdAt))
      .limit(20);
  }),
});
