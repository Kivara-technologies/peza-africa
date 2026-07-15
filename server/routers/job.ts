import { z } from "zod";
import { router, publicProcedure, protectedProcedure } from "../trpc.js";
import { schema } from "../../db/index.js";
import { and, desc, eq } from "drizzle-orm";

export const jobRouter = router({
  list: publicProcedure
    .input(z.object({ category: z.string().optional() }).optional())
    .query(({ ctx, input }) => {
      const category = input?.category;
      return ctx.db
        .select()
        .from(schema.jobs)
        .where(category ? eq(schema.jobs.category, category) : undefined)
        .orderBy(desc(schema.jobs.urgent), desc(schema.jobs.postedAt));
    }),

  applyToJob: protectedProcedure
    .input(z.object({ jobId: z.number(), coverLetter: z.string().optional() }))
    .mutation(async ({ ctx, input }) => {
      const [existing] = await ctx.db
        .select()
        .from(schema.jobApplications)
        .where(
          and(eq(schema.jobApplications.jobId, input.jobId), eq(schema.jobApplications.userId, ctx.user.id)),
        )
        .limit(1);
      if (existing) return existing;

      const [application] = await ctx.db
        .insert(schema.jobApplications)
        .values({
          jobId: input.jobId,
          userId: ctx.user.id,
          coverLetter: input.coverLetter ?? null,
        })
        .returning();
      return application;
    }),
});
