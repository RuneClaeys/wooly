import { and, asc, desc, eq } from 'drizzle-orm';
import { z } from 'zod';
import { projects } from '~/db/schema';
import { genericSort } from '~/server/helpers/zod.helper';
import { protectedProcedure, router } from '../trpc';
import { assertProjectOwnership } from './ownership.guard';

export const projectRouter = router({
   list: protectedProcedure.input(z.object({ finished: z.boolean().default(false), query: genericSort })).query(({ ctx, input }) => {
      const { finished, query } = input;
      return ctx.db.query.projects.findMany({
         where: and(eq(projects.userId, ctx.session.user.id), eq(projects.finished, finished)),
         orderBy: query?.order === 'asc' ? asc(projects[query.orderBy]) : desc(projects[query.orderBy]),
      });
   }),

   get: protectedProcedure.input(z.number()).query(({ input: projectId, ctx }) => assertProjectOwnership(ctx, projectId)),

   create: protectedProcedure
      .input(
         z.object({
            name: z.string().trim().min(1, { message: 'The name is required' }),
            finished: z.boolean().optional().default(false),
         }),
      )
      .mutation(async ({ input, ctx }) => {
         const [createdProject] = await ctx.db
            .insert(projects)
            .values({ name: input.name, userId: ctx.session.user.id, finished: input.finished })
            .returning()
            .execute();
         return createdProject;
      }),

   update: protectedProcedure
      .input(
         z.object({
            id: z.number(),
            name: z.string().trim().min(1, { message: 'The name is required' }),
            finished: z.boolean().optional(),
         }),
      )
      .mutation(async ({ input, ctx }) => {
         await assertProjectOwnership(ctx, input.id);

         await ctx.db
            .update(projects)
            .set({ name: input.name, finished: input.finished, updatedAt: new Date() })
            .where(and(eq(projects.id, input.id), eq(projects.userId, ctx.session.user.id)))
            .execute();

         return ctx.db.query.projects.findFirst({
            where: and(eq(projects.id, input.id), eq(projects.userId, ctx.session.user.id)),
         });
      }),

   delete: protectedProcedure.input(z.number()).mutation(async ({ input: projectId, ctx }) => {
      await assertProjectOwnership(ctx, projectId);
      return ctx.db
         .delete(projects)
         .where(and(eq(projects.id, projectId), eq(projects.userId, ctx.session.user.id)))
         .execute();
   }),
});
