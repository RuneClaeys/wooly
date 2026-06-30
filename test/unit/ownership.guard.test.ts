import { TRPCError } from '@trpc/server';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import {
   assertBingoBoardOwnership,
   assertBingoCellOwnership,
   assertPartOwnership,
   assertProjectOwnership,
   assertProjectPhotoOwnership,
   assertProjectYarnOwnership,
   assertYarnColorOwnership,
   assertYarnTypeOwnership,
   assertYearGoalOwnership,
} from '~/server/trpc/routers/ownership.guard';

const SESSION_USER_ID = 'user-1';

/**
 * Builds a fake tRPC Context whose `db.query.<table>.findFirst` calls are vi.fn() mocks.
 * The guard implementation only ever reads `ctx.db.query.<table>.findFirst(...)` and
 * `ctx.session.user.id`, so this shape mirrors the real call surface exactly.
 */
function createCtx() {
   const tables = [
      'projects',
      'parts',
      'yarnTypes',
      'yarnColors',
      'projectYarns',
      'projectPhotos',
      'bingoBoards',
      'bingoCells',
      'yearGoals',
   ] as const;

   const query = Object.fromEntries(tables.map((table) => [table, { findFirst: vi.fn() }])) as Record<
      (typeof tables)[number],
      { findFirst: ReturnType<typeof vi.fn> }
   >;

   const ctx = {
      db: { query },
      session: { user: { id: SESSION_USER_ID } },
   };

   return ctx as unknown as Parameters<typeof assertProjectOwnership>[0] & { db: { query: typeof query } };
}

async function expectNotFound(promise: Promise<unknown>) {
   await expect(promise).rejects.toBeInstanceOf(TRPCError);
   await expect(promise).rejects.toMatchObject({ code: 'NOT_FOUND' });
}

describe('ownership.guard', () => {
   let ctx: ReturnType<typeof createCtx>;

   beforeEach(() => {
      ctx = createCtx();
   });

   describe('assertProjectOwnership', () => {
      it('resolves with the project when it is owned by the session user', async () => {
         const project = { id: 10, userId: SESSION_USER_ID };
         ctx.db.query.projects.findFirst.mockResolvedValue(project);

         await expect(assertProjectOwnership(ctx, 10)).resolves.toBe(project);
         expect(ctx.db.query.projects.findFirst).toHaveBeenCalledOnce();
      });

      it('throws NOT_FOUND when no matching owned project exists', async () => {
         ctx.db.query.projects.findFirst.mockResolvedValue(undefined);

         await expectNotFound(assertProjectOwnership(ctx, 999));
      });
   });

   describe('assertPartOwnership', () => {
      it('resolves with the part when its project is owned by the session user', async () => {
         const part = { id: 5, projectId: 10 };
         ctx.db.query.parts.findFirst.mockResolvedValue(part);
         ctx.db.query.projects.findFirst.mockResolvedValue({ id: 10, userId: SESSION_USER_ID });

         await expect(assertPartOwnership(ctx, 5)).resolves.toBe(part);
         expect(ctx.db.query.parts.findFirst).toHaveBeenCalledOnce();
         expect(ctx.db.query.projects.findFirst).toHaveBeenCalledOnce();
      });

      it('throws NOT_FOUND when the part does not exist', async () => {
         ctx.db.query.parts.findFirst.mockResolvedValue(undefined);

         await expectNotFound(assertPartOwnership(ctx, 404));
         expect(ctx.db.query.projects.findFirst).not.toHaveBeenCalled();
      });

      it('throws NOT_FOUND when the part exists but its project is not owned', async () => {
         ctx.db.query.parts.findFirst.mockResolvedValue({ id: 5, projectId: 77 });
         ctx.db.query.projects.findFirst.mockResolvedValue(undefined);

         await expectNotFound(assertPartOwnership(ctx, 5));
      });
   });

   describe('assertYarnTypeOwnership', () => {
      it('resolves when owned', async () => {
         const yarnType = { id: 1, userId: SESSION_USER_ID };
         ctx.db.query.yarnTypes.findFirst.mockResolvedValue(yarnType);

         await expect(assertYarnTypeOwnership(ctx, 1)).resolves.toBe(yarnType);
      });

      it('throws NOT_FOUND when not owned', async () => {
         ctx.db.query.yarnTypes.findFirst.mockResolvedValue(undefined);

         await expectNotFound(assertYarnTypeOwnership(ctx, 1));
      });
   });

   describe('assertYarnColorOwnership', () => {
      it('resolves when the parent yarn type is owned', async () => {
         const color = { id: 2, yarnTypeId: 1 };
         ctx.db.query.yarnColors.findFirst.mockResolvedValue(color);
         ctx.db.query.yarnTypes.findFirst.mockResolvedValue({ id: 1, userId: SESSION_USER_ID });

         await expect(assertYarnColorOwnership(ctx, 2)).resolves.toBe(color);
      });

      it('throws NOT_FOUND when the color is missing', async () => {
         ctx.db.query.yarnColors.findFirst.mockResolvedValue(undefined);

         await expectNotFound(assertYarnColorOwnership(ctx, 2));
         expect(ctx.db.query.yarnTypes.findFirst).not.toHaveBeenCalled();
      });

      it('throws NOT_FOUND when the parent yarn type is not owned', async () => {
         ctx.db.query.yarnColors.findFirst.mockResolvedValue({ id: 2, yarnTypeId: 9 });
         ctx.db.query.yarnTypes.findFirst.mockResolvedValue(undefined);

         await expectNotFound(assertYarnColorOwnership(ctx, 2));
      });
   });

   describe('assertProjectYarnOwnership', () => {
      it('resolves when the parent project is owned', async () => {
         const usage = { id: 3, projectId: 10 };
         ctx.db.query.projectYarns.findFirst.mockResolvedValue(usage);
         ctx.db.query.projects.findFirst.mockResolvedValue({ id: 10, userId: SESSION_USER_ID });

         await expect(assertProjectYarnOwnership(ctx, 3)).resolves.toBe(usage);
      });

      it('throws NOT_FOUND when the usage is missing', async () => {
         ctx.db.query.projectYarns.findFirst.mockResolvedValue(undefined);

         await expectNotFound(assertProjectYarnOwnership(ctx, 3));
      });
   });

   describe('assertProjectPhotoOwnership', () => {
      it('resolves when the parent project is owned', async () => {
         const photo = { id: 4, projectId: 10 };
         ctx.db.query.projectPhotos.findFirst.mockResolvedValue(photo);
         ctx.db.query.projects.findFirst.mockResolvedValue({ id: 10, userId: SESSION_USER_ID });

         await expect(assertProjectPhotoOwnership(ctx, 4)).resolves.toBe(photo);
      });

      it('throws NOT_FOUND when the parent project is not owned', async () => {
         ctx.db.query.projectPhotos.findFirst.mockResolvedValue({ id: 4, projectId: 88 });
         ctx.db.query.projects.findFirst.mockResolvedValue(undefined);

         await expectNotFound(assertProjectPhotoOwnership(ctx, 4));
      });
   });

   describe('assertBingoBoardOwnership', () => {
      it('resolves when owned', async () => {
         const board = { id: 6, userId: SESSION_USER_ID };
         ctx.db.query.bingoBoards.findFirst.mockResolvedValue(board);

         await expect(assertBingoBoardOwnership(ctx, 6)).resolves.toBe(board);
      });

      it('throws NOT_FOUND when not owned', async () => {
         ctx.db.query.bingoBoards.findFirst.mockResolvedValue(undefined);

         await expectNotFound(assertBingoBoardOwnership(ctx, 6));
      });
   });

   describe('assertBingoCellOwnership', () => {
      it('resolves when the parent board is owned', async () => {
         const cell = { id: 7, boardId: 6 };
         ctx.db.query.bingoCells.findFirst.mockResolvedValue(cell);
         ctx.db.query.bingoBoards.findFirst.mockResolvedValue({ id: 6, userId: SESSION_USER_ID });

         await expect(assertBingoCellOwnership(ctx, 7)).resolves.toBe(cell);
      });

      it('throws NOT_FOUND when the parent board is not owned', async () => {
         ctx.db.query.bingoCells.findFirst.mockResolvedValue({ id: 7, boardId: 6 });
         ctx.db.query.bingoBoards.findFirst.mockResolvedValue(undefined);

         await expectNotFound(assertBingoCellOwnership(ctx, 7));
      });
   });

   describe('assertYearGoalOwnership', () => {
      it('resolves when owned', async () => {
         const goal = { id: 8, userId: SESSION_USER_ID };
         ctx.db.query.yearGoals.findFirst.mockResolvedValue(goal);

         await expect(assertYearGoalOwnership(ctx, 8)).resolves.toBe(goal);
      });

      it('throws NOT_FOUND when not owned', async () => {
         ctx.db.query.yearGoals.findFirst.mockResolvedValue(undefined);

         await expectNotFound(assertYearGoalOwnership(ctx, 8));
      });
   });
});
