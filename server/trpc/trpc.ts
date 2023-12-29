/**
 * This is your entry point to setup the root configuration for tRPC on the server.
 * - `initTRPC` should only be used once per app.
 * - We export only the functionality that we use so we can enforce which base procedures should be used
 *
 * Learn how to create protected base procedures and other things below:
 * @see https://trpc.io/docs/v10/router
 * @see https://trpc.io/docs/v10/procedures
 */
import { TRPCError, initTRPC } from '@trpc/server';
import { eq } from 'drizzle-orm';
import { users } from '~/db/schema';
import { Context } from '~/server/trpc/context';
import { db } from '../services/drizzle.service';

const t = initTRPC.context<Context>().create();

/**
 * Authentication middleware
 **/
const authMiddleware = t.middleware(({ ctx, next }) => {
   if (!ctx.session || !ctx.session.user) {
      throw new TRPCError({ code: 'UNAUTHORIZED' });
   }

   const user = db.select().from(users).where(eq(users.email, ctx.session.user.email!)).get();

   if (!user) {
      throw new TRPCError({ code: 'UNAUTHORIZED' });
   }

   return next({
      ctx: {
         session: { ...ctx.session, user },
      },
   });
});

export const publicProcedure = t.procedure;
export const protectedProcedure = t.procedure.use(authMiddleware);

export const router = t.router;
export const middleware = t.middleware;
