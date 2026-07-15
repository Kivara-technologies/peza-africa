import { router, publicProcedure } from "../trpc.js";
import { schema } from "../../db.js";
import { asc } from "drizzle-orm";

export const categoryRouter = router({
  list: publicProcedure.query(({ ctx }) => {
    return ctx.db.select().from(schema.categories).orderBy(asc(schema.categories.name));
  }),
});
