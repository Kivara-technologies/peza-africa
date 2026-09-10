import { z } from "zod";
import { router, publicProcedure, protectedProcedure, invalidateProfileCache } from "../trpc.js";
import { schema } from "../../db/index.js";
import { eq } from "drizzle-orm";

const optionalText = (max = 500) => z.string().trim().max(max).optional();
const optionalUrl = (max: number) => z.preprocess(
  (value) => value === "" ? undefined : value,
  z.string().trim().url().max(max).optional(),
);

export const authRouter = router({
  me: publicProcedure.query(({ ctx }) => ctx.user),

  updateProfile: protectedProcedure
    .input(z.object({
      name: z.string().trim().min(1).max(120).optional(),
      phone: z.string().trim().max(40).optional(),
      avatarUrl: optionalUrl(1000),
      address: optionalText(300),
      city: optionalText(100),
      country: optionalText(100),
      businessName: optionalText(160),
      businessType: optionalText(100),
      businessDescription: optionalText(1000),
      website: optionalUrl(500),
      preferredLanguage: z.enum(["en", "bem", "nya"]).optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      const [updated] = await ctx.db.update(schema.profiles).set({
        ...(input.name !== undefined && { name: input.name }),
        ...(input.phone !== undefined && { phone: input.phone }),
        ...(input.avatarUrl !== undefined && { avatarUrl: input.avatarUrl }),
        ...(input.address !== undefined && { address: input.address }),
        ...(input.city !== undefined && { city: input.city }),
        ...(input.country !== undefined && { country: input.country }),
        ...(input.businessName !== undefined && { businessName: input.businessName }),
        ...(input.businessType !== undefined && { businessType: input.businessType }),
        ...(input.businessDescription !== undefined && { businessDescription: input.businessDescription }),
        ...(input.website !== undefined && { website: input.website }),
        ...(input.preferredLanguage !== undefined && { preferredLanguage: input.preferredLanguage }),
      }).where(eq(schema.profiles.id, ctx.user.id)).returning();
      if (!updated) throw new Error("Profile could not be saved");
      invalidateProfileCache(ctx.user.id);
      return updated;
    }),

  logout: protectedProcedure.mutation(() => ({ success: true })),
});
