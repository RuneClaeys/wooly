import 'dotenv/config';
import type { Config } from 'drizzle-kit';

export default {
   schema: './db/schema.ts',
   dialect: 'postgresql',
   dbCredentials: {
      uri: process.env.PLANETSCALE_DATABASE_URL as string,
   },
   out: './db/migrations',
} satisfies Config;
