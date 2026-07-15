import { z } from "zod";
import { router, publicProcedure } from "../trpc";
import { schema } from "../../db";
import { eq, desc } from "drizzle-orm";

export const supplierRouter = router({
  list: publicProcedure
    .input(z.object({ category: z.string().optional() }).optional())
    .query(({ ctx, input }) => {
      const category = input?.category;
      return ctx.db
        .select()
        .from(schema.suppliers)
        .where(category && category !== "All" ? eq(schema.suppliers.category, category) : undefined)
        .orderBy(desc(schema.suppliers.rating));
    }),
});
