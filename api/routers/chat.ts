import { z } from "zod";
import { router, protectedProcedure } from "../trpc";
import { schema } from "../../db";
import { and, asc, desc, eq } from "drizzle-orm";

export const chatRouter = router({
  list: protectedProcedure.query(({ ctx }) => {
    return ctx.db
      .select()
      .from(schema.chats)
      .where(eq(schema.chats.userId, ctx.user.id))
      .orderBy(desc(schema.chats.updatedAt));
  }),

  messages: protectedProcedure.input(z.object({ chatId: z.number() })).query(async ({ ctx, input }) => {
    // Ownership check
    const [chat] = await ctx.db
      .select()
      .from(schema.chats)
      .where(and(eq(schema.chats.id, input.chatId), eq(schema.chats.userId, ctx.user.id)))
      .limit(1);
    if (!chat) return [];

    return ctx.db
      .select()
      .from(schema.chatMessages)
      .where(eq(schema.chatMessages.chatId, input.chatId))
      .orderBy(asc(schema.chatMessages.createdAt));
  }),

  send: protectedProcedure
    .input(z.object({ chatId: z.number(), text: z.string().min(1) }))
    .mutation(async ({ ctx, input }) => {
      const [chat] = await ctx.db
        .select()
        .from(schema.chats)
        .where(and(eq(schema.chats.id, input.chatId), eq(schema.chats.userId, ctx.user.id)))
        .limit(1);
      if (!chat) throw new Error("Chat not found");

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
