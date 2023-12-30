import { inferAsyncReturnType } from '@trpc/server';
import type { H3Event } from 'h3';
import { Session } from 'next-auth';
import { SelectUser } from '~/db/schema';
import { db } from '../services/drizzle.service';

declare module 'h3' {
   interface H3EventContext {
      session: Session & { user: SelectUser };
   }
}

export const createContext = (_event: H3Event) => {
   return {
      db,
      session: _event.context.session,
      t: _event.context.t,
   };
};

export type Context = inferAsyncReturnType<typeof createContext>;
