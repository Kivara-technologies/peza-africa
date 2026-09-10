import { router, publicProcedure } from "../trpc.js";
import { schema } from "../../db/index.js";
import { asc, eq } from "drizzle-orm";

export const categoryRouter = router({
  list: publicProcedure.query(({ ctx }) =>
    ctx.db
      .select()
      .from(schema.categories)
      .where(eq(schema.categories.isActive, true))
      .orderBy(asc(schema.categories.sortOrder), asc(schema.categories.name)),
  ),
});
