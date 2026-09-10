import { z } from "zod";
import { router, publicProcedure, protectedProcedure, invalidateProfileCache } from "../trpc.js";
import { schema } from "../../db/index.js";
import { eq } from "drizzle-orm";

export const authRouter = router({
  me: publicProcedure.query(({ ctx }) => {
    return ctx.user; // null when not authenticated - frontend treats that as logged out
  }),

  updateProfile: protectedProcedure
    .input(
      z.object({
        name: z.string().min(1).optional(),
        phone: z.string().min(1).optional(),
        preferredLanguage: z.enum(["en", "bem", "nya"]).optional(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const [updated] = await ctx.db
        .update(schema.profiles)
        .set({
          ...(input.name !== undefined && { name: input.name }),
          ...(input.phone !== undefined && { phone: input.phone }),
          ...(input.preferredLanguage !== undefined && { preferredLanguage: input.preferredLanguage }),
        })
        .where(eq(schema.profiles.id, ctx.user.id))
        .returning();
      invalidateProfileCache(ctx.user.id);
      return updated;
    }),

  // Sessions are stateless Supabase JWTs; actual sign-out happens client-side
  // via supabase.auth.signOut(). This just gives the frontend a mutation to call.
  logout: protectedProcedure.mutation(() => {
    return { success: true };
  }),
});
