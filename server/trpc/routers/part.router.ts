import { and, asc, desc, eq } from 'drizzle-orm';
import { z } from 'zod';
import { parts, projects } from '~/db/schema';
import { genericSort } from '~/server/helpers/zod.helper';
import type { Context } from '../context';
import { protectedProcedure, router } from '../trpc';
import { assertPartOwnership, assertProjectOwnership } from './ownership.guard';

async function refreshProject(ctx: Context, projectId: number) {
   await ctx.db
      .update(projects)
      .set({ updatedAt: new Date() })
      .where(and(eq(projects.id, projectId), eq(projects.userId, ctx.session.user.id)))
      .execute();
}

export const partRouter = router({
   list: protectedProcedure
      .input(
         z.object({
            projectId: z.number(),
            sorting: genericSort,
         }),
      )
      .query(async ({ ctx, input }) => {
         await assertProjectOwnership(ctx, input.projectId);

         return ctx.db.query.parts.findMany({
            where: eq(parts.projectId, input.projectId),
            orderBy: input.sorting.order === 'asc' ? asc(parts[input.sorting.orderBy]) : desc(parts[input.sorting.orderBy]),
         });
      }),

   create: protectedProcedure
      .input(z.object({ projectId: z.number(), name: z.string(), counter: z.number().optional().default(0) }))
      .mutation(async ({ input, ctx }) => {
         await assertProjectOwnership(ctx, input.projectId);

         const { insertId } = await ctx.db
            .insert(parts)
            .values({ ...input })
            .execute();

         await refreshProject(ctx, input.projectId);

         return ctx.db.query.parts.findFirst({ where: eq(parts.id, +insertId) });
      }),

   delete: protectedProcedure.input(z.number()).mutation(async ({ input: partId, ctx }) => {
      const part = await assertPartOwnership(ctx, partId);
      const result = await ctx.db.delete(parts).where(eq(parts.id, partId)).execute();

      await refreshProject(ctx, part.projectId);
      return result;
   }),

   update: protectedProcedure
      .input(z.object({ id: z.number(), name: z.string().optional().nullable(), counter: z.number() }))
      .mutation(async ({ input, ctx }) => {
         const part = await assertPartOwnership(ctx, input.id);

         const result = await ctx.db
            .update(parts)
            .set({ name: input.name, counter: input.counter, updatedAt: new Date() })
            .where(eq(parts.id, input.id))
            .execute();

         await refreshProject(ctx, part.projectId);
         return result;
      }),
});
