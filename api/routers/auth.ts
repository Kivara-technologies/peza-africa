import { router, publicProcedure, protectedProcedure } from "../trpc";

export const authRouter = router({
  me: publicProcedure.query(({ ctx }) => {
    return ctx.user; // null when not authenticated - frontend treats that as logged out
  }),

  // Sessions are stateless Supabase JWTs; actual sign-out happens client-side
  // via supabase.auth.signOut(). This just gives the frontend a mutation to call.
  logout: protectedProcedure.mutation(() => {
    return { success: true };
  }),
});
