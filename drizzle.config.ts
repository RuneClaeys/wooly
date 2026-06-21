import 'dotenv/config';
import type { Config } from 'drizzle-kit';

const databaseUrl = process.env.POSTGRES_URL || process.env.DATABASE_URL;

export default {
   schema: './db/schema.ts',
   dialect: 'postgresql',
   dbCredentials: databaseUrl
      ? {
           url: databaseUrl,
        }
      : {
           host: process.env.DB_HOST || 'localhost',
           port: parseInt(process.env.DB_PORT || '5432', 10),
           user: process.env.DB_USER || 'postgres',
           password: process.env.DB_PASSWORD || 'postgres',
           database: process.env.DB_NAME || 'wooly',
           ssl: process.env.DB_SSL === 'true',
        },
   out: './db/migrations',
} satisfies Config;
