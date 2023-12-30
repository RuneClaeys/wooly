import { connect } from '@planetscale/database';
import { drizzle } from 'drizzle-orm/planetscale-serverless';
import * as schema from '~/db/schema';

export const connection = connect({
   url: process.env.PLANETSCALE_DATABASE_URL,
});

export const db = drizzle(connection, { schema });
