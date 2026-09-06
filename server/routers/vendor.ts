import { z } from "zod";
import { router, protectedProcedure } from "../trpc.js";

export const vendorRouter = router({
  profile: protectedProcedure.query(({ ctx }) => ({
    userId: ctx.user.id,
    status: "ready" as const,
  })),
  updateProfile: protectedProcedure
    .input(z.object({ businessName: z.string().trim().min(2).max(120) }))
    .mutation(({ input }) => ({ ...input, updated: true })),
});
