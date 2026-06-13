import 'dotenv/config';
import { Pool } from 'pg';

const pool = new Pool({
   host: process.env.DB_HOST || 'localhost',
   port: parseInt(process.env.DB_PORT || '5432'),
   user: process.env.DB_USER || 'wooly_user',
   password: process.env.DB_PASSWORD || 'wooly_password',
   database: process.env.DB_NAME || 'wooly',
   ssl: false,
});

async function query(text, params) {
   const client = await pool.connect();
   try {
      return await client.query(text, params);
   } finally {
      client.release();
   }
}

const shouldReset = !process.argv.includes('--append');

const users = [
   {
      id: 'seed-user-alex',
      firstName: 'Alex',
      lastName: 'Morgan',
      email: 'alex@example.local',
      locale: 'en',
   },
   {
      id: 'seed-user-noor',
      firstName: 'Noor',
      lastName: 'de Vries',
      email: 'noor@example.local',
      locale: 'nl',
   },
];

const projects = [
   { key: 'blanket', name: 'Merino Winter Blanket', finished: false, userId: 'seed-user-alex' },
   { key: 'beanie', name: 'Weekend Beanie', finished: false, userId: 'seed-user-alex' },
   { key: 'shawl', name: 'Sunrise Shawl', finished: true, userId: 'seed-user-alex' },
   { key: 'sweater', name: 'Autumn Sweater', finished: false, userId: 'seed-user-noor' },
   { key: 'socks', name: 'Striped Socks', finished: true, userId: 'seed-user-noor' },
];

const parts = [
   { projectKey: 'blanket', name: 'Rows completed', counter: 18 },
   { projectKey: 'blanket', name: 'Squares blocked', counter: 6 },
   { projectKey: 'blanket', name: 'Ends woven', counter: 11 },
   { projectKey: 'beanie', name: 'Ribbing rounds', counter: 9 },
   { projectKey: 'beanie', name: 'Body rounds', counter: 24 },
   { projectKey: 'beanie', name: 'Decrease rounds', counter: 5 },
   { projectKey: 'shawl', name: 'Main repeats', counter: 42 },
   { projectKey: 'shawl', name: 'Border repeats', counter: 16 },
   { projectKey: 'sweater', name: 'Back panel rows', counter: 27 },
   { projectKey: 'sweater', name: 'Sleeve one rows', counter: 12 },
   { projectKey: 'sweater', name: 'Sleeve two rows', counter: 8 },
   { projectKey: 'socks', name: 'Pair one cuff rounds', counter: 14 },
   { projectKey: 'socks', name: 'Pair one foot rounds', counter: 22 },
];

async function seed() {
   const client = await pool.connect();
   
   try {
      await client.query('BEGIN');

      if (shouldReset) {
         await client.query('TRUNCATE TABLE parts, projects, users RESTART IDENTITY CASCADE');
      }

      for (const user of users) {
         await client.query(
            `INSERT INTO users (id, first_name, last_name, email, locale)
             VALUES ($1, $2, $3, $4, $5)
             ON CONFLICT (id) DO UPDATE
             SET first_name = EXCLUDED.first_name, last_name = EXCLUDED.last_name, email = EXCLUDED.email, locale = EXCLUDED.locale`,
            [user.id, user.firstName, user.lastName, user.email, user.locale]
         );
      }

      const projectIdByKey = new Map();

      for (const project of projects) {
         const existing = await client.query(
            'SELECT id FROM projects WHERE name = $1 AND user_id = $2 LIMIT 1',
            [project.name, project.userId]
         );

         if (existing.rows.length > 0) {
            const projectId = existing.rows[0].id;
            projectIdByKey.set(project.key, projectId);

            await client.query(
               'UPDATE projects SET finished = $1, updated_at = NOW() WHERE id = $2',
               [project.finished, projectId]
            );

            continue;
         }

         const inserted = await client.query(
            'INSERT INTO projects (name, finished, user_id) VALUES ($1, $2, $3) RETURNING id',
            [project.name, project.finished, project.userId]
         );

         projectIdByKey.set(project.key, inserted.rows[0].id);
      }

      for (const part of parts) {
         const projectId = projectIdByKey.get(part.projectKey);

         if (!projectId) {
            throw new Error(`No project id found for key: ${part.projectKey}`);
         }

         await client.query(
            'INSERT INTO parts (name, count, project_id) VALUES ($1, $2, $3)',
            [part.name, part.counter, projectId]
         );
      }

      await client.query('COMMIT');

      console.log('Seed completed successfully.');
      console.log(`Users: ${users.length}`);
      console.log(`Projects: ${projects.length}`);
      console.log(`Parts: ${parts.length}`);
      console.log(shouldReset ? 'Mode: reset + seed' : 'Mode: append seed');
   } catch (error) {
      await client.query('ROLLBACK');
      throw error;
   } finally {
      client.release();
      await pool.end();
   }
}

seed().catch((error) => {
   console.error('Seeding failed.');
   console.error(error);
   process.exit(1);
});
