import { asc, desc, eq } from 'drizzle-orm';
import { z } from 'zod';
import { parts, projects } from '~/db/schema';
import { genericSort } from '~/server/helpers/zod.helper';
import { db } from '~/server/services/drizzle.service';
import { protectedProcedure, router } from '../trpc';

function refreshProject(projectId: number) {
   db.update(projects).set({ updatedAt: new Date() }).where(eq(projects.id, projectId)).execute();
}

export const partRouter = router({
   list: protectedProcedure
      .input(
         z.object({
            projectId: z.number(),
            sorting: genericSort,
         })
      )
      .query(({ ctx, input }) => {
         return ctx.db.query.parts.findMany({
            where: eq(parts.projectId, input.projectId),
            orderBy: input.sorting.order === 'asc' ? asc(parts[input.sorting.orderBy]) : desc(parts[input.sorting.orderBy]),
         });
      }),

   create: protectedProcedure
      .input(z.object({ projectId: z.number(), name: z.string(), counter: z.number().optional().default(0) }))
      .mutation(async ({ input, ctx }) => {
         const result = await ctx.db
            .insert(parts)
            .values({ ...input })
            .returning()
            .execute();

         refreshProject(input.projectId);

         return result;
      }),

   delete: protectedProcedure.input(z.number()).mutation(({ input: partId, ctx }) => {
      return ctx.db.delete(parts).where(eq(parts.id, partId)).execute();
   }),

   update: protectedProcedure
      .input(z.object({ id: z.number(), name: z.string().optional().nullable(), counter: z.number() }))
      .mutation(async ({ input, ctx }) => {
         const [result] = await ctx.db
            .update(parts)
            .set({ ...input, updatedAt: new Date() })
            .where(eq(parts.id, input.id))
            .returning()
            .execute();

         refreshProject(result.projectId);

         return result;
      }),
});
