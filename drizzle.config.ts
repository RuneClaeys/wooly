import type { Config } from 'drizzle-kit';

export default {
   schema: './db/schema.ts',
   dbCredentials: {
      connectionString: process.env.POSTGRES_URL as string,
   },
   out: './db/migrations',
   driver: 'pg',
} satisfies Config;
