import { sql } from '@vercel/postgres';

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
   if (!process.env.POSTGRES_URL) {
      throw new Error('POSTGRES_URL is missing. Add it to your environment before running the seeder.');
   }

   await sql`BEGIN`;

   try {
      if (shouldReset) {
         await sql`TRUNCATE TABLE parts, projects, users RESTART IDENTITY CASCADE`;
      }

      for (const user of users) {
         await sql`
            INSERT INTO users (id, first_name, last_name, email, locale)
            VALUES (${user.id}, ${user.firstName}, ${user.lastName}, ${user.email}, ${user.locale})
            ON CONFLICT (id) DO UPDATE
            SET
               first_name = EXCLUDED.first_name,
               last_name = EXCLUDED.last_name,
               email = EXCLUDED.email,
               locale = EXCLUDED.locale
         `;
      }

      const projectIdByKey = new Map();

      for (const project of projects) {
         const existing = await sql`
            SELECT id
            FROM projects
            WHERE name = ${project.name} AND user_id = ${project.userId}
            LIMIT 1
         `;

         if (existing.rows.length > 0) {
            const projectId = existing.rows[0].id;
            projectIdByKey.set(project.key, projectId);

            await sql`
               UPDATE projects
               SET finished = ${project.finished}, updated_at = NOW()
               WHERE id = ${projectId}
            `;

            continue;
         }

         const inserted = await sql`
            INSERT INTO projects (name, finished, user_id)
            VALUES (${project.name}, ${project.finished}, ${project.userId})
            RETURNING id
         `;

         projectIdByKey.set(project.key, inserted.rows[0].id);
      }

      for (const part of parts) {
         const projectId = projectIdByKey.get(part.projectKey);

         if (!projectId) {
            throw new Error(`No project id found for key: ${part.projectKey}`);
         }

         await sql`
            INSERT INTO parts (name, count, project_id)
            VALUES (${part.name}, ${part.counter}, ${projectId})
         `;
      }

      await sql`COMMIT`;

      console.log('Seed completed successfully.');
      console.log(`Users: ${users.length}`);
      console.log(`Projects: ${projects.length}`);
      console.log(`Parts: ${parts.length}`);
      console.log(shouldReset ? 'Mode: reset + seed' : 'Mode: append seed');
   } catch (error) {
      await sql`ROLLBACK`;
      throw error;
   }
}

seed().catch((error) => {
   console.error('Seeding failed.');
   console.error(error);
   process.exit(1);
});
