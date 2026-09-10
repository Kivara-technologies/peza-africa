import { z } from "zod";
import { TRPCError } from "@trpc/server";
import { router, protectedProcedure } from "../trpc.js";
import { schema } from "../../db/index.js";
import { and, desc, eq, lt } from "drizzle-orm";

export const chatRouter = router({
  list: protectedProcedure.query(({ ctx }) => {
    return ctx.db
      .select()
      .from(schema.chats)
      .where(eq(schema.chats.userId, ctx.user.id))
      .orderBy(desc(schema.chats.updatedAt));
  }),

  // Cursor-paginated on createdAt: pass the oldest message id/timestamp
  // you've already loaded as `before` to fetch the next page back. Without
  // this, a long-running conversation loaded its entire history on every
  // open.
  messages: protectedProcedure
    .input(z.object({ chatId: z.number(), before: z.date().optional(), limit: z.number().int().min(1).max(100).default(50) }))
    .query(async ({ ctx, input }) => {
      // Ownership check
      const [chat] = await ctx.db
        .select()
        .from(schema.chats)
        .where(and(eq(schema.chats.id, input.chatId), eq(schema.chats.userId, ctx.user.id)))
        .limit(1);
      if (!chat) return [];

      const rows = await ctx.db
        .select()
        .from(schema.chatMessages)
        .where(
          input.before
            ? and(eq(schema.chatMessages.chatId, input.chatId), lt(schema.chatMessages.createdAt, input.before))
            : eq(schema.chatMessages.chatId, input.chatId),
        )
        .orderBy(desc(schema.chatMessages.createdAt))
        .limit(input.limit);

      // Return in ascending (oldest-first) order for display, same as before.
      return rows.reverse();
    }),

  send: protectedProcedure
    .input(z.object({ chatId: z.number(), text: z.string().min(1) }))
    .mutation(async ({ ctx, input }) => {
      const [chat] = await ctx.db
        .select()
        .from(schema.chats)
        .where(and(eq(schema.chats.id, input.chatId), eq(schema.chats.userId, ctx.user.id)))
        .limit(1);
      if (!chat) throw new TRPCError({ code: "NOT_FOUND", message: "Chat not found" });

      // NOTE (reply path): every message is currently written with
      // isOutgoing: true — this is a store-and-never-answered chat, there
      // is no code path that ever writes an incoming reply. Fixing that is
      // a product/design decision (who or what replies, and how) rather
      // than a bug fix, so it's intentionally left alone here — flagging
      // it rather than guessing at a reply mechanism.
      const [message] = await ctx.db
        .insert(schema.chatMessages)
        .values({ chatId: input.chatId, text: input.text, isOutgoing: true })
        .returning();

      await ctx.db
        .update(schema.chats)
        .set({ lastMsg: input.text, updatedAt: new Date() })
        .where(eq(schema.chats.id, input.chatId));

      return message;
    }),
});
