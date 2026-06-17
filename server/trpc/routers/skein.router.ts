import { and, asc, desc, eq, sql } from 'drizzle-orm';
import { z } from 'zod';
import { projectSkeins, projects, yarnSkeins } from '~/db/schema';
import { genericSort } from '~/server/helpers/zod.helper';
import type { Context } from '../context';
import { protectedProcedure, router } from '../trpc';
import { recomputeBingoBoardsForUser } from './bingo.router';
import { assertProjectOwnership, assertProjectSkeinOwnership, assertYarnSkeinOwnership } from './ownership.guard';

async function refreshProject(ctx: Context, projectId: number) {
   await ctx.db
      .update(projects)
      .set({ updatedAt: new Date() })
      .where(and(eq(projects.id, projectId), eq(projects.userId, ctx.session.user.id)))
      .execute();
}

export const skeinRouter = router({
   catalogList: protectedProcedure.query(async ({ ctx }) => {
      return ctx.db.query.yarnSkeins.findMany({
         where: eq(yarnSkeins.userId, ctx.session.user.id),
         orderBy: asc(yarnSkeins.name),
      });
   }),

   catalogCreate: protectedProcedure.input(z.object({ name: z.string().trim().min(1) })).mutation(async ({ ctx, input }) => {
      const existing = await ctx.db.query.yarnSkeins.findFirst({
         where: and(eq(yarnSkeins.userId, ctx.session.user.id), eq(yarnSkeins.name, input.name)),
      });

      if (existing) return existing;

      const [createdSkein] = await ctx.db
         .insert(yarnSkeins)
         .values({ name: input.name, userId: ctx.session.user.id })
         .returning()
         .execute();

      return createdSkein;
   }),

   summary: protectedProcedure.query(async ({ ctx }) => {
      return ctx.db
         .select({
            skeinId: yarnSkeins.id,
            skeinName: yarnSkeins.name,
            projectCount: sql<number>`count(distinct ${projectSkeins.projectId})::int`,
            totalCounter: sql<number>`coalesce(sum(${projectSkeins.counter}), 0)::int`,
         })
         .from(yarnSkeins)
         .innerJoin(projectSkeins, eq(projectSkeins.skeinId, yarnSkeins.id))
         .innerJoin(projects, eq(projects.id, projectSkeins.projectId))
         .where(eq(yarnSkeins.userId, ctx.session.user.id))
         .groupBy(yarnSkeins.id, yarnSkeins.name)
         .orderBy(asc(yarnSkeins.name));
   }),

   list: protectedProcedure.input(z.object({ projectId: z.number(), sorting: genericSort })).query(async ({ ctx, input }) => {
      await assertProjectOwnership(ctx, input.projectId);

      return ctx.db
         .select({
            id: projectSkeins.id,
            projectId: projectSkeins.projectId,
            skeinId: projectSkeins.skeinId,
            counter: projectSkeins.counter,
            createdAt: projectSkeins.createdAt,
            updatedAt: projectSkeins.updatedAt,
            skeinName: yarnSkeins.name,
         })
         .from(projectSkeins)
         .innerJoin(yarnSkeins, eq(yarnSkeins.id, projectSkeins.skeinId))
         .where(eq(projectSkeins.projectId, input.projectId))
         .orderBy(input.sorting.order === 'asc' ? asc(yarnSkeins.name) : desc(yarnSkeins.name));
   }),

   create: protectedProcedure
      .input(
         z.object({
            projectId: z.number(),
            skeinId: z.number(),
            counter: z.number().optional().default(0),
         }),
      )
      .mutation(async ({ input, ctx }) => {
         await assertProjectOwnership(ctx, input.projectId);
         await assertYarnSkeinOwnership(ctx, input.skeinId);

         const [createdUsage] = await ctx.db
            .insert(projectSkeins)
            .values({ projectId: input.projectId, skeinId: input.skeinId, counter: input.counter })
            .returning()
            .execute();

         await refreshProject(ctx, input.projectId);
         await recomputeBingoBoardsForUser(ctx);

         return createdUsage;
      }),

   delete: protectedProcedure.input(z.number()).mutation(async ({ input: usageId, ctx }) => {
      const usage = await assertProjectSkeinOwnership(ctx, usageId);
      const result = await ctx.db.delete(projectSkeins).where(eq(projectSkeins.id, usageId)).execute();

      await refreshProject(ctx, usage.projectId);
      await recomputeBingoBoardsForUser(ctx);
      return result;
   }),

   update: protectedProcedure
      .input(z.object({ id: z.number(), skeinId: z.number(), counter: z.number() }))
      .mutation(async ({ input, ctx }) => {
         const usage = await assertProjectSkeinOwnership(ctx, input.id);
         await assertYarnSkeinOwnership(ctx, input.skeinId);

         const result = await ctx.db
            .update(projectSkeins)
            .set({ skeinId: input.skeinId, counter: input.counter, updatedAt: new Date() })
            .where(eq(projectSkeins.id, input.id))
            .execute();

         await refreshProject(ctx, usage.projectId);
         await recomputeBingoBoardsForUser(ctx);
         return result;
      }),
});
