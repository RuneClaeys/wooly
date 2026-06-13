import { drizzle } from 'drizzle-orm/node-postgres';
import { Pool } from 'pg';
import * as schema from '~/db/schema';

const globalForDb = globalThis as unknown as {
   connection?: Pool;
};

if (!process.env.POSTGRES_URL) {
   throw new Error('POSTGRES_URL is not configured');
}

export const connection =
   globalForDb.connection ??
   new Pool({
      connectionString: process.env.POSTGRES_URL,
   });

if (process.env.NODE_ENV !== 'production') {
   globalForDb.connection = connection;
}

export const db = drizzle(connection, { schema });
