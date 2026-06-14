import { get } from '@vercel/blob';
import { eq } from 'drizzle-orm';
import { createError, defineEventHandler, setHeader } from 'h3';
import { projectPhotos, users } from '~/db/schema';
import { db } from '~/server/services/drizzle.service';

export default defineEventHandler(async (event) => {
   const projectId = Number.parseInt(event.context.params?.id ?? '', 10);
   const photoId = Number.parseInt(event.context.params?.photoId ?? '', 10);

   if (!Number.isInteger(projectId) || !Number.isInteger(photoId)) {
      throw createError({ statusCode: 400, statusMessage: 'Invalid project or photo id' });
   }

   const session = event.context.session;
   const email = session?.user?.email;

   if (!email) {
      throw createError({ statusCode: 401, statusMessage: 'Unauthorized' });
   }

   const user = await db.query.users.findFirst({ where: eq(users.email, email) });

   if (!user) {
      throw createError({ statusCode: 401, statusMessage: 'Unauthorized' });
   }

   // Verify ownership: photo belongs to project, project belongs to user
   const photo = await db.query.projectPhotos.findFirst({
      where: eq(projectPhotos.id, photoId),
      with: {
         project: true,
      },
   });

   if (!photo || photo.project.userId !== user.id) {
      throw createError({ statusCode: 403, statusMessage: 'Forbidden' });
   }

   try {
      const result = await get(photo.pathname, { access: 'private' });

      if (!result || result.statusCode !== 200) {
         throw new Error(`Failed to fetch photo: status ${result?.statusCode}`);
      }

      setHeader(event, 'Content-Type', result.blob.contentType);
      setHeader(event, 'X-Content-Type-Options', 'nosniff');
      setHeader(event, 'Cache-Control', 'private, no-cache');

      return result.stream;
   } catch (err) {
      console.error('Photo download error:', err);
      throw createError({ statusCode: 500, statusMessage: 'Failed to download photo' });
   }
});
