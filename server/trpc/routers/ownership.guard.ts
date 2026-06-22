import { TRPCError } from '@trpc/server';
import { and, eq } from 'drizzle-orm';
import { bingoBoards, bingoCells, parts, projectPhotos, projectYarns, projects, yarnColors, yarnTypes, yearGoals } from '~/db/schema';
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

export async function assertYarnTypeOwnership(ctx: Context, yarnTypeId: number) {
   const yarnType = await ctx.db.query.yarnTypes.findFirst({
      where: and(eq(yarnTypes.id, yarnTypeId), eq(yarnTypes.userId, ctx.session.user.id)),
   });

   if (!yarnType) {
      throw new TRPCError({ code: 'NOT_FOUND' });
   }

   return yarnType;
}

export async function assertYarnColorOwnership(ctx: Context, yarnColorId: number) {
   const color = await ctx.db.query.yarnColors.findFirst({ where: eq(yarnColors.id, yarnColorId) });

   if (!color) {
      throw new TRPCError({ code: 'NOT_FOUND' });
   }

   await assertYarnTypeOwnership(ctx, color.yarnTypeId);
   return color;
}

export async function assertProjectYarnOwnership(ctx: Context, usageId: number) {
   const usage = await ctx.db.query.projectYarns.findFirst({ where: eq(projectYarns.id, usageId) });

   if (!usage) {
      throw new TRPCError({ code: 'NOT_FOUND' });
   }

   await assertProjectOwnership(ctx, usage.projectId);
   return usage;
}

// Temporary wrappers during skein -> yarn rollout.
export async function assertYarnSkeinOwnership(ctx: Context, skeinId: number) {
   return assertYarnTypeOwnership(ctx, skeinId);
}

export async function assertProjectSkeinOwnership(ctx: Context, usageId: number) {
   return assertProjectYarnOwnership(ctx, usageId);
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

export async function assertYearGoalOwnership(ctx: Context, goalId: number) {
   const goal = await ctx.db.query.yearGoals.findFirst({
      where: and(eq(yearGoals.id, goalId), eq(yearGoals.userId, ctx.session.user.id)),
   });

   if (!goal) {
      throw new TRPCError({ code: 'NOT_FOUND' });
   }

   return goal;
}
