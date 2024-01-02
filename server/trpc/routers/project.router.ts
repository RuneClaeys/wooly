import { asc, desc, eq } from 'drizzle-orm';
import { z } from 'zod';
import { projects } from '~/db/schema';
import { genericSort } from '~/server/helpers/zod.helper';
import { protectedProcedure, router } from '../trpc';
import { partRouter } from './part.router';

export const projectRouter = router({
   partRouter,

   list: protectedProcedure.input(genericSort).query(({ ctx, input }) => {
      return ctx.db.query.projects.findMany({
         with: { parts: true },
         where: eq(projects.userId, ctx.session.user.id),
         orderBy: input?.order === 'asc' ? asc(projects[input?.orderBy ?? 'name']) : desc(projects[input?.orderBy ?? 'name']),
      });
   }),

   get: protectedProcedure.input(z.number()).query(({ input: projectId, ctx }) => {
      return ctx.db.query.projects.findFirst({ where: eq(projects.id, projectId), with: { parts: true } });
   }),

   create: protectedProcedure
      .input(z.object({ name: z.string().trim().min(1, { message: 'The name is required' }) }))
      .mutation(async ({ input, ctx }) => {
         const { insertId } = await ctx.db.insert(projects).values({ name: input.name, userId: ctx.session.user.id }).execute();
         return ctx.db.query.projects.findFirst({ where: eq(projects.id, +insertId), with: { parts: true } });
      }),

   delete: protectedProcedure.input(z.number()).mutation(({ input: projectId, ctx }) => {
      return ctx.db.delete(projects).where(eq(projects.id, projectId)).execute();
   }),
});
