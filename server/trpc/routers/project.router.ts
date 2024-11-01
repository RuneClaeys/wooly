import { and, asc, desc, eq } from 'drizzle-orm';
import { z } from 'zod';
import { projects } from '~/db/schema';
import { genericSort } from '~/server/helpers/zod.helper';
import { protectedProcedure, router } from '../trpc';
import { partRouter } from './part.router';

export const projectRouter = router({
   partRouter,

   list: protectedProcedure.input(z.object({ finished: z.boolean().default(false), query: genericSort })).query(({ ctx, input }) => {
      const { finished, query } = input;

      return ctx.db.query.projects.findMany({
         where: and(eq(projects.userId, ctx.session.user.id), eq(projects.finished, finished)),
         orderBy: query?.order === 'asc' ? asc(projects[query.orderBy]) : desc(projects[query.orderBy]),
      });
   }),

   get: protectedProcedure.input(z.number()).query(({ input: projectId, ctx }) => {
      return ctx.db.query.projects.findFirst({ where: eq(projects.id, projectId) });
   }),

   create: protectedProcedure
      .input(
         z.object({
            name: z.string().trim().min(1, { message: 'The name is required' }),
            finished: z.boolean().optional().default(false),
         })
      )
      .mutation(async ({ input, ctx }) => {
         return await ctx.db
            .insert(projects)
            .values({ name: input.name, userId: ctx.session.user.id, finished: input.finished })
            .returning()
            .execute();
      }),

   update: protectedProcedure
      .input(
         z.object({
            id: z.number(),
            name: z.string().trim().min(1, { message: 'The name is required' }),
            finished: z.boolean().optional(),
         })
      )
      .mutation(async ({ input, ctx }) => {
         const [result] = await ctx.db
            .update(projects)
            .set({ name: input.name, finished: input.finished, updatedAt: new Date() })
            .where(eq(projects.id, input.id))
            .returning()
            .execute();
         return result;
      }),

   delete: protectedProcedure.input(z.number()).mutation(({ input: projectId, ctx }) => {
      return ctx.db.delete(projects).where(eq(projects.id, projectId)).execute();
   }),
});
