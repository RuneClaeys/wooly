import { eq } from 'drizzle-orm';
import { z } from 'zod';
import { users } from '~/db/schema';
import { protectedProcedure, router } from '../trpc';

export const userRouter = router({
   me: protectedProcedure.query(({ ctx }) => {
      return ctx.session.user;
   }),

   updateLocale: protectedProcedure.input(z.enum(['en', 'nl'])).mutation(async ({ ctx, input }) => {
      await ctx.db.update(users).set({ locale: input }).where(eq(users.id, ctx.session.user.id)).execute();
   }),
});
