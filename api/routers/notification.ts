import { z } from "zod";
import { router, publicProcedure, protectedProcedure } from "../trpc.js";
import { schema } from "../../db/index.js";
import { and, desc, eq } from "drizzle-orm";

export const notificationRouter = router({
  // publicProcedure (not protected): Header renders this globally, including
  // for signed-out visitors, so it must not throw for them - just return [].
  list: publicProcedure.query(({ ctx }) => {
    if (!ctx.user) return [];
    return ctx.db
      .select()
      .from(schema.notifications)
      .where(eq(schema.notifications.userId, ctx.user.id))
      .orderBy(desc(schema.notifications.createdAt));
  }),

  markRead: protectedProcedure.input(z.object({ id: z.number() })).mutation(async ({ ctx, input }) => {
    await ctx.db
      .update(schema.notifications)
      .set({ read: true })
      .where(and(eq(schema.notifications.id, input.id), eq(schema.notifications.userId, ctx.user.id)));
    return { success: true };
  }),

  markAllRead: protectedProcedure.mutation(async ({ ctx }) => {
    await ctx.db
      .update(schema.notifications)
      .set({ read: true })
      .where(eq(schema.notifications.userId, ctx.user.id));
    return { success: true };
  }),
});
