import { TRPCError } from '@trpc/server';
import { and, eq } from 'drizzle-orm';
import { bingoBoards, bingoCells, parts, projectPhotos, projectSkeins, projects, yarnSkeins } from '~/db/schema';
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

export async function assertYarnSkeinOwnership(ctx: Context, skeinId: number) {
   const skein = await ctx.db.query.yarnSkeins.findFirst({
      where: and(eq(yarnSkeins.id, skeinId), eq(yarnSkeins.userId, ctx.session.user.id)),
   });

   if (!skein) {
      throw new TRPCError({ code: 'NOT_FOUND' });
   }

   return skein;
}

export async function assertProjectSkeinOwnership(ctx: Context, usageId: number) {
   const usage = await ctx.db.query.projectSkeins.findFirst({ where: eq(projectSkeins.id, usageId) });

   if (!usage) {
      throw new TRPCError({ code: 'NOT_FOUND' });
   }

   await assertProjectOwnership(ctx, usage.projectId);
   return usage;
}

export async function assertProjectPhotoOwnership(ctx: Context, photoId: number) {
   const photo = await ctx.db.query.projectPhotos.findFirst({ where: eq(projectPhotos.id, photoId) });

   if (!photo) {
      throw new TRPCError({ code: 'NOT_FOUND' });
   }

   await assertProjectOwnership(ctx, photo.projectId);
   return photo;
}

export async function assertBingoBoardOwnership(ctx: Context, boardId: number) {
   const board = await ctx.db.query.bingoBoards.findFirst({
      where: and(eq(bingoBoards.id, boardId), eq(bingoBoards.userId, ctx.session.user.id)),
   });

   if (!board) {
      throw new TRPCError({ code: 'NOT_FOUND' });
   }

   return board;
}

export async function assertBingoCellOwnership(ctx: Context, cellId: number) {
   const cell = await ctx.db.query.bingoCells.findFirst({ where: eq(bingoCells.id, cellId) });

   if (!cell) {
      throw new TRPCError({ code: 'NOT_FOUND' });
   }

   await assertBingoBoardOwnership(ctx, cell.boardId);
   return cell;
}
