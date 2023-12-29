import { inferAsyncReturnType } from '@trpc/server';
import type { H3Event } from 'h3';
import { db } from '../services/drizzle.service';

export const createContext = (_event: H3Event) => {
   return {
      db,
      session: _event.context.session,
   };
};

export type Context = inferAsyncReturnType<typeof createContext>;
