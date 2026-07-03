import { z } from "zod";
import { router, publicProcedure } from "../trpc";
import { schema } from "../../db";
import { eq } from "drizzle-orm";

export const marketRouter = router({
  list: publicProcedure
    .input(z.object({ category: z.string().optional() }).optional())
    .query(({ ctx, input }) => {
      const category = input?.category;
      return ctx.db
        .select()
        .from(schema.marketPrices)
        .where(category ? eq(schema.marketPrices.category, category) : undefined);
    }),
});
