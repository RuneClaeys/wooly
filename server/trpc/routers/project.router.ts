import { eq } from 'drizzle-orm';
import { z } from 'zod';
import { projects } from '~/db/schema';
import { Context } from '../context';
import { protectedProcedure, router } from '../trpc';

function selectUserProjects(ctx: Context, additionalCondition = null) {
   let query = ctx.db.select().from(projects).where(eq(projects.userId, ctx.session.user.id)).$dynamic();

   return query;
}

function selectUserProject(ctx: Context, projectId: number) {
   return selectUserProjects(ctx).where(eq(projects.id, projectId));
}

export const projectRouter = router({
   list: protectedProcedure.query(({ ctx }) => {
      return selectUserProjects(ctx).all();
   }),

   get: protectedProcedure.input(z.number()).query(({ input: projectId, ctx }) => {
      return selectUserProject(ctx, projectId).get();
   }),

   create: protectedProcedure.input(z.object({ name: z.string() })).mutation(({ input, ctx }) => {
      const { lastInsertRowid } = ctx.db.insert(projects).values({ name: input.name, userId: ctx.session.user.id }).run();
      return selectUserProject(ctx, lastInsertRowid as number).get();
   }),

   delete: protectedProcedure.input(z.number()).mutation(({ input: projectId, ctx }) => {
      return ctx.db.delete(projects).where(eq(projects.id, projectId)).run();
   }),
});
