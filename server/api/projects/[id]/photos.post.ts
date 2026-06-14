import { put } from '@vercel/blob';
import { and, eq } from 'drizzle-orm';
import { createError, defineEventHandler, readMultipartFormData } from 'h3';
import { projectPhotos, projects, users } from '~/db/schema';
import { db } from '~/server/services/drizzle.service';

const MAX_PHOTO_SIZE_BYTES = 10 * 1024 * 1024;

function sanitizeFileName(name: string) {
   return name.replace(/[^a-zA-Z0-9._-]+/g, '-').replace(/-+/g, '-').replace(/^-|-$/g, '');
}

export default defineEventHandler(async (event) => {
   const projectId = Number.parseInt(event.context.params?.id ?? '', 10);

   if (!Number.isInteger(projectId)) {
      throw createError({ statusCode: 400, statusMessage: 'Invalid project id' });
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

   const project = await db.query.projects.findFirst({
      where: and(eq(projects.id, projectId), eq(projects.userId, user.id)),
   });

   if (!project) {
      throw createError({ statusCode: 404, statusMessage: 'Project not found' });
   }

   const parts = await readMultipartFormData(event);
   const filePart = parts?.find((part) => part.name === 'file');

   if (!filePart || !filePart.filename || !filePart.type || !filePart.data) {
      throw createError({ statusCode: 400, statusMessage: 'Photo file is required' });
   }

   if (!filePart.type.startsWith('image/')) {
      throw createError({ statusCode: 400, statusMessage: 'Only image uploads are allowed' });
   }

   const buffer = Buffer.isBuffer(filePart.data) ? filePart.data : Buffer.from(filePart.data);

   if (buffer.length > MAX_PHOTO_SIZE_BYTES) {
      throw createError({ statusCode: 400, statusMessage: 'Photo must be 10 MB or smaller' });
   }

   const safeName = sanitizeFileName(filePart.filename || 'photo');
   const pathname = `projects/${projectId}/${Date.now()}-${safeName || 'photo'}`;

   const blob = await put(pathname, buffer, {
      access: 'private',
      contentType: filePart.type,
      token: process.env.BLOB_READ_WRITE_TOKEN,
      addRandomSuffix: true,
   });

   const [createdPhoto] = await db
      .insert(projectPhotos)
      .values({
         projectId,
         name: filePart.filename,
         url: blob.url,
         pathname: blob.pathname,
         contentType: filePart.type,
         size: buffer.length,
      })
      .returning()
      .execute();

   await db.update(projects).set({ updatedAt: new Date() }).where(eq(projects.id, projectId)).execute();

   return createdPhoto;
});
