import 'dotenv/config';
import pg from 'pg';

const { Client } = pg;

function getDbConfig() {
   const databaseUrl = process.env.POSTGRES_URL || process.env.DATABASE_URL;

   if (databaseUrl) {
      return { connectionString: databaseUrl };
   }

   return {
      host: process.env.DB_HOST || 'localhost',
      port: Number(process.env.DB_PORT || 5432),
      user: process.env.DB_USER || 'postgres',
      password: process.env.DB_PASSWORD || 'postgres',
      database: process.env.DB_NAME || 'wooly',
      ssl: process.env.DB_SSL === 'true',
   };
}

async function run() {
   const client = new Client(getDbConfig());
   await client.connect();

   try {
      await client.query('BEGIN');

      const deleteOrphanParts = await client.query(`
         DELETE FROM parts p
         WHERE NOT EXISTS (
            SELECT 1
            FROM projects pr
            WHERE pr.id = p.project_id
         )
      `);

      const deleteOrphanProjectPhotos = await client.query(`
         DELETE FROM project_photos ph
         WHERE NOT EXISTS (
            SELECT 1
            FROM projects pr
            WHERE pr.id = ph.project_id
         )
      `);

      const deleteOrphanProjectYarns = await client.query(`
         DELETE FROM project_yarns py
         WHERE NOT EXISTS (
            SELECT 1
            FROM projects pr
            WHERE pr.id = py.project_id
         )
      `);

      const nullOrphanBingoLinkedProjects = await client.query(`
         UPDATE bingo_cells bc
         SET linked_project_id = NULL
         WHERE linked_project_id IS NOT NULL
           AND NOT EXISTS (
              SELECT 1
              FROM projects pr
              WHERE pr.id = bc.linked_project_id
           )
      `);

      const nullOrphanYearGoalsLinkedProjects = await client.query(`
         UPDATE year_goals yg
         SET linked_project_id = NULL
         WHERE linked_project_id IS NOT NULL
           AND NOT EXISTS (
              SELECT 1
              FROM projects pr
              WHERE pr.id = yg.linked_project_id
           )
      `);

      await client.query('COMMIT');

      console.log(
         JSON.stringify(
            {
               repaired: {
                  deletedOrphanParts: deleteOrphanParts.rowCount,
                  deletedOrphanProjectPhotos: deleteOrphanProjectPhotos.rowCount,
                  deletedOrphanProjectYarns: deleteOrphanProjectYarns.rowCount,
                  nulledBingoLinkedProjectId: nullOrphanBingoLinkedProjects.rowCount,
                  nulledYearGoalsLinkedProjectId: nullOrphanYearGoalsLinkedProjects.rowCount,
               },
            },
            null,
            2,
         ),
      );
   } catch (error) {
      await client.query('ROLLBACK');
      throw error;
   } finally {
      await client.end();
   }
}

run().catch((error) => {
   console.error('FK orphan repair failed');
   console.error(error);
   process.exit(1);
});
