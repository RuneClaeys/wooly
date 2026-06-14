import { TRPCError } from '@trpc/server';
import { and, eq } from 'drizzle-orm';
import { parts, projectPhotos, projects } from '~/db/schema';
import type { Context } from '../context';

export async function assertProjectOwnership(ctx: Context, projectId: number) {
   const project = await ctx.db.query.projects.findFirst({
      where: and(eq(projects.id, projectId), eq(projects.userId, ctx.session.user.id)),
   });

   if (!project) {
      throw new TRPCError({ code: 'NOT_FOUND' });
   }

   return project;
}

export async function assertPartOwnership(ctx: Context, partId: number) {
   const part = await ctx.db.query.parts.findFirst({ where: eq(parts.id, partId) });

   if (!part) {
      throw new TRPCError({ code: 'NOT_FOUND' });
   }

   await assertProjectOwnership(ctx, part.projectId);
   return part;
}

export async function assertProjectPhotoOwnership(ctx: Context, photoId: number) {
   const photo = await ctx.db.query.projectPhotos.findFirst({ where: eq(projectPhotos.id, photoId) });

   if (!photo) {
      throw new TRPCError({ code: 'NOT_FOUND' });
   }

   await assertProjectOwnership(ctx, photo.projectId);
   return photo;
}
