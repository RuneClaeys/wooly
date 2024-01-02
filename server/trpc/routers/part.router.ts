import { eq } from 'drizzle-orm';
import { z } from 'zod';
import { parts } from '~/db/schema';
import { genericSort } from '~/server/helpers/zod.helper';
import { protectedProcedure, router } from '../trpc';

export const partRouter = router({
   list: protectedProcedure
      .input(
         z.object({
            projectId: z.number(),
            sorting: genericSort,
         })
      )
      .query(({ ctx, input }) => {
         return ctx.db.query.parts.findMany({ where: eq(parts.projectId, input.projectId) });
      }),

   create: protectedProcedure
      .input(z.object({ projectId: z.number(), name: z.string(), count: z.number() }))
      .mutation(async ({ input, ctx }) => {
         const { insertId } = await ctx.db
            .insert(parts)
            .values({ ...input })
            .execute();
         return ctx.db.query.parts.findFirst({ where: eq(parts.id, +insertId) });
      }),

   delete: protectedProcedure.input(z.number()).mutation(({ input: partId, ctx }) => {
      return ctx.db.delete(parts).where(eq(parts.id, partId)).execute();
   }),

   update: protectedProcedure
      .input(z.object({ id: z.number(), name: z.string().optional().nullable(), counter: z.number() }))
      .mutation(({ input, ctx }) => {
         return ctx.db
            .update(parts)
            .set({ ...input })
            .where(eq(parts.id, input.id))
            .execute();
      }),
});
