import 'dotenv/config';
import type { Config } from 'drizzle-kit';

export default {
   schema: './db/schema.ts',
   dbCredentials: {
      uri: process.env.PLANETSCALE_DATABASE_URL as string,
   },
   driver: 'mysql2',
} satisfies Config;
