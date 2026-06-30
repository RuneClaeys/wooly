import { and, asc, desc, eq, inArray, sql } from 'drizzle-orm';
import { z } from 'zod';
import { bingoBoards, bingoCellProgress, bingoCells, parts, projectYarns, projects } from '~/db/schema';
import type { Context } from '../context';
import { protectedProcedure, router } from '../trpc';
import {
   assertBingoBoardOwnership,
   assertBingoCellOwnership,
   assertGoalPartSelectionOwnership,
   assertProjectOwnership,
} from './ownership.guard';

const bingoKindSchema = z.enum(['project_finish', 'parts_count', 'skeins_count', 'free_text']);

const boardSchema = z.object({
   name: z.string().trim().min(1),
   size: z.union([z.literal(3), z.literal(4)]),
   endDate: z.coerce.date(),
});

const cellCreateSchema = z.object({
   boardId: z.number(),
   position: z.number().int().positive(),
   kind: bingoKindSchema,
   label: z.string().trim().optional().nullable(),
   linkedProjectId: z.number().optional().nullable(),
   linkedPartIds: z.array(z.number().int().positive()).optional().nullable(),
   targetValue: z.number().int().positive().optional().nullable(),
});

const cellUpdateSchema = z.object({
   id: z.number(),
   position: z.number().int().positive().optional(),
   kind: bingoKindSchema,
   label: z.string().trim().optional().nullable(),
   linkedProjectId: z.number().optional().nullable(),
   linkedPartIds: z.array(z.number().int().positive()).optional().nullable(),
   targetValue: z.number().int().positive().optional().nullable(),
});

function normalizeCellData(input: {
   kind: z.infer<typeof bingoKindSchema>;
   label?: string | null;
   linkedProjectId?: number | null;
   linkedPartIds?: number[] | null;
   targetValue?: number | null;
}) {
   const label = input.label?.trim() || null;
   const linkedPartIds = Array.from(new Set(input.linkedPartIds ?? []));

   if (input.kind === 'free_text') {
      return {
         label,
         linkedProjectId: null,
         linkedPartIds: null,
         targetValue: null,
      };
   }

   if (input.kind === 'project_finish') {
      return {
         label,
         linkedProjectId: input.linkedProjectId ?? null,
         linkedPartIds: null,
         targetValue: 1,
      };
   }

   if (input.kind === 'parts_count') {
      const hasSpecificParts = linkedPartIds.length > 0;
      return {
         label,
         linkedProjectId: input.linkedProjectId ?? null,
         linkedPartIds: hasSpecificParts ? linkedPartIds : null,
         targetValue: hasSpecificParts ? linkedPartIds.length : (input.targetValue ?? 1),
      };
   }

   return {
      label,
      linkedProjectId: input.linkedProjectId ?? null,
      linkedPartIds: null,
      targetValue: input.targetValue ?? 1,
   };
}

async function getRawTrackedValue(
   ctx: Context,
   kind: z.infer<typeof bingoKindSchema>,
   linkedProjectId?: number | null,
   linkedPartIds?: number[] | null,
) {
   if (!linkedProjectId) return 0;

   if (kind === 'project_finish') {
      const project = await ctx.db.query.projects.findFirst({
         where: and(eq(projects.id, linkedProjectId), eq(projects.userId, ctx.session.user.id)),
      });
      return project?.finished ? 1 : 0;
   }

   if (kind === 'parts_count') {
      if (linkedPartIds?.length) {
         const [row] = await ctx.db
            .select({ value: sql<number>`count(*)::int` })
            .from(parts)
            .where(and(eq(parts.projectId, linkedProjectId), inArray(parts.id, linkedPartIds), eq(parts.completed, true)));

         return row?.value ?? 0;
      }

      const [row] = await ctx.db
         .select({ value: sql<number>`count(*)::int` })
         .from(parts)
         .where(and(eq(parts.projectId, linkedProjectId), eq(parts.completed, true)));

      return row?.value ?? 0;
   }

   if (kind === 'skeins_count') {
      const [row] = await ctx.db
         .select({ value: sql<number>`coalesce(sum(${projectYarns.usedCount}), 0)::int` })
         .from(projectYarns)
         .where(eq(projectYarns.projectId, linkedProjectId));

      return row?.value ?? 0;
   }

   return 0;
}

async function upsertProgress(
   ctx: Context,
   input: {
      cellId: number;
      baselineValue?: number;
      currentValue?: number;
      autoCompleted?: boolean;
      manualCompleted?: boolean;
      completedAt?: Date | null;
   },
) {
   const existing = await ctx.db.query.bingoCellProgress.findFirst({ where: eq(bingoCellProgress.cellId, input.cellId) });

   if (existing) {
      await ctx.db
         .update(bingoCellProgress)
         .set({
            baselineValue: input.baselineValue ?? existing.baselineValue,
            currentValue: input.currentValue ?? existing.currentValue,
            autoCompleted: input.autoCompleted ?? existing.autoCompleted,
            manualCompleted: input.manualCompleted ?? existing.manualCompleted,
            completedAt: input.completedAt === undefined ? existing.completedAt : input.completedAt,
            updatedAt: new Date(),
         })
         .where(eq(bingoCellProgress.cellId, input.cellId))
         .execute();
      return;
   }

   await ctx.db
      .insert(bingoCellProgress)
      .values({
         cellId: input.cellId,
         baselineValue: input.baselineValue ?? 0,
         currentValue: input.currentValue ?? 0,
         autoCompleted: input.autoCompleted ?? false,
         manualCompleted: input.manualCompleted ?? false,
         completedAt: input.completedAt ?? null,
      })
      .execute();
}

export async function recomputeBingoBoard(ctx: Context, boardId: number) {
   const board = await assertBingoBoardOwnership(ctx, boardId);

   const rows = await ctx.db
      .select({
         cellId: bingoCells.id,
         kind: bingoCells.kind,
         linkedProjectId: bingoCells.linkedProjectId,
         linkedPartIds: bingoCells.linkedPartIds,
         targetValue: bingoCells.targetValue,
         baselineValue: bingoCellProgress.baselineValue,
         currentValue: bingoCellProgress.currentValue,
         autoCompleted: bingoCellProgress.autoCompleted,
         manualCompleted: bingoCellProgress.manualCompleted,
         completedAt: bingoCellProgress.completedAt,
      })
      .from(bingoCells)
      .leftJoin(bingoCellProgress, eq(bingoCellProgress.cellId, bingoCells.id))
      .where(eq(bingoCells.boardId, boardId))
      .orderBy(asc(bingoCells.position));

   for (const row of rows) {
      const kind = row.kind as z.infer<typeof bingoKindSchema>;
      const target = row.targetValue ?? 1;
      let baseline = row.baselineValue ?? 0;
      let currentValue = row.currentValue ?? 0;
      let autoCompleted = row.autoCompleted ?? false;
      const manualCompleted = row.manualCompleted ?? false;

      if (kind === 'project_finish') {
         const rawValue = await getRawTrackedValue(ctx, kind, row.linkedProjectId, row.linkedPartIds);
         currentValue = rawValue;
         autoCompleted = rawValue >= 1;
      } else if (kind === 'parts_count' || kind === 'skeins_count') {
         const rawValue = await getRawTrackedValue(ctx, kind, row.linkedProjectId, row.linkedPartIds);
         if (kind === 'parts_count' && row.linkedPartIds?.length) {
            baseline = 0;
            currentValue = rawValue;
         } else {
            currentValue = Math.max(0, rawValue - baseline);
         }
         autoCompleted = currentValue >= target;
      } else {
         autoCompleted = false;
      }

      const completed = manualCompleted || autoCompleted;
      const completedAt = completed ? (row.completedAt ?? new Date()) : null;

      await upsertProgress(ctx, {
         cellId: row.cellId,
         baselineValue: baseline,
         currentValue,
         autoCompleted,
         manualCompleted,
         completedAt,
      });
   }

   await ctx.db.update(bingoBoards).set({ updatedAt: new Date() }).where(eq(bingoBoards.id, board.id)).execute();
}

export async function recomputeBingoBoardsForUser(ctx: Context) {
   const boards = await ctx.db.query.bingoBoards.findMany({
      where: eq(bingoBoards.userId, ctx.session.user.id),
      columns: { id: true },
   });

   for (const board of boards) {
      await recomputeBingoBoard(ctx, board.id);
   }
}

async function validatePositionAvailability(ctx: Context, boardId: number, position: number, excludeCellId?: number) {
   const existing = await ctx.db.query.bingoCells.findFirst({
      where: and(eq(bingoCells.boardId, boardId), eq(bingoCells.position, position)),
   });

   if (existing && existing.id !== excludeCellId) {
      throw new Error('Position is already occupied');
   }
}

export const bingoRouter = router({
   listBoards: protectedProcedure.query(async ({ ctx }) => {
      const boards = await ctx.db.query.bingoBoards.findMany({
         where: eq(bingoBoards.userId, ctx.session.user.id),
         orderBy: desc(bingoBoards.updatedAt),
      });

      const boardStats = await Promise.all(
         boards.map(async (board) => {
            const rows = await ctx.db
               .select({
                  total: sql<number>`count(${bingoCells.id})::int`,
                  completed: sql<number>`count(case when (${bingoCellProgress.manualCompleted} = true or ${bingoCellProgress.autoCompleted} = true) then 1 end)::int`,
               })
               .from(bingoCells)
               .leftJoin(bingoCellProgress, eq(bingoCellProgress.cellId, bingoCells.id))
               .where(eq(bingoCells.boardId, board.id));

            return {
               ...board,
               totalCells: rows[0]?.total ?? 0,
               completedCells: rows[0]?.completed ?? 0,
            };
         }),
      );

      return boardStats;
   }),

   getBoard: protectedProcedure.input(z.number()).query(async ({ ctx, input: boardId }) => {
      const board = await assertBingoBoardOwnership(ctx, boardId);

      const cells = await ctx.db
         .select({
            id: bingoCells.id,
            boardId: bingoCells.boardId,
            position: bingoCells.position,
            kind: bingoCells.kind,
            label: bingoCells.label,
            linkedProjectId: bingoCells.linkedProjectId,
            linkedPartIds: bingoCells.linkedPartIds,
            linkedProjectName: projects.name,
            targetValue: bingoCells.targetValue,
            createdAt: bingoCells.createdAt,
            updatedAt: bingoCells.updatedAt,
            progressId: bingoCellProgress.id,
            baselineValue: bingoCellProgress.baselineValue,
            currentValue: bingoCellProgress.currentValue,
            autoCompleted: bingoCellProgress.autoCompleted,
            manualCompleted: bingoCellProgress.manualCompleted,
            completedAt: bingoCellProgress.completedAt,
         })
         .from(bingoCells)
         .leftJoin(bingoCellProgress, eq(bingoCellProgress.cellId, bingoCells.id))
         .leftJoin(projects, eq(projects.id, bingoCells.linkedProjectId))
         .where(eq(bingoCells.boardId, board.id))
         .orderBy(asc(bingoCells.position));

      return { board, cells };
   }),

   createBoard: protectedProcedure.input(boardSchema).mutation(async ({ ctx, input }) => {
      const [board] = await ctx.db
         .insert(bingoBoards)
         .values({
            name: input.name,
            size: input.size,
            endDate: input.endDate,
            userId: ctx.session.user.id,
         })
         .returning()
         .execute();

      return board;
   }),

   updateBoardMeta: protectedProcedure
      .input(
         z.object({
            id: z.number(),
            name: z.string().trim().min(1),
            size: z.union([z.literal(3), z.literal(4)]),
            endDate: z.coerce.date(),
         }),
      )
      .mutation(async ({ ctx, input }) => {
         const board = await assertBingoBoardOwnership(ctx, input.id);
         const maxCells = input.size * input.size;

         const existingCells = await ctx.db
            .select({ count: sql<number>`count(*)::int` })
            .from(bingoCells)
            .where(eq(bingoCells.boardId, board.id));

         if ((existingCells[0]?.count ?? 0) > maxCells) {
            throw new Error('Reduce cells before shrinking board size');
         }

         const [updated] = await ctx.db
            .update(bingoBoards)
            .set({ name: input.name, size: input.size, endDate: input.endDate, updatedAt: new Date() })
            .where(eq(bingoBoards.id, board.id))
            .returning()
            .execute();

         return updated;
      }),

   deleteBoard: protectedProcedure.input(z.number()).mutation(async ({ ctx, input: boardId }) => {
      const board = await assertBingoBoardOwnership(ctx, boardId);

      await ctx.db
         .delete(bingoCellProgress)
         .where(sql`${bingoCellProgress.cellId} in (select ${bingoCells.id} from ${bingoCells} where ${bingoCells.boardId} = ${board.id})`)
         .execute();
      await ctx.db.delete(bingoCells).where(eq(bingoCells.boardId, board.id)).execute();

      return ctx.db.delete(bingoBoards).where(eq(bingoBoards.id, board.id)).execute();
   }),

   createCell: protectedProcedure.input(cellCreateSchema).mutation(async ({ ctx, input }) => {
      const board = await assertBingoBoardOwnership(ctx, input.boardId);
      if (input.position > board.size * board.size) {
         throw new Error('Position is out of bounds');
      }

      await validatePositionAvailability(ctx, board.id, input.position);

      const normalized = normalizeCellData(input);
      if (normalized.linkedProjectId) {
         await assertProjectOwnership(ctx, normalized.linkedProjectId);
      }

      if (input.kind === 'parts_count') {
         if (!normalized.linkedProjectId) {
            throw new Error('Project is required for parts goals');
         }

         if (!normalized.linkedPartIds?.length && !normalized.targetValue) {
            throw new Error('Target is required for amount-based parts goals');
         }

         if (normalized.linkedPartIds?.length) {
            await assertGoalPartSelectionOwnership(ctx, normalized.linkedProjectId, normalized.linkedPartIds);
         }
      }

      const [cell] = await ctx.db
         .insert(bingoCells)
         .values({
            boardId: board.id,
            position: input.position,
            kind: input.kind,
            label: normalized.label,
            linkedProjectId: normalized.linkedProjectId,
            linkedPartIds: normalized.linkedPartIds,
            targetValue: normalized.targetValue,
         })
         .returning()
         .execute();

      if (!cell) {
         throw new Error('Failed to create bingo cell');
      }

      const createdCell = cell!;

      const baseline = await getRawTrackedValue(ctx, input.kind, normalized.linkedProjectId, normalized.linkedPartIds);
      const isSpecificPartsGoal = input.kind === 'parts_count' && Boolean(normalized.linkedPartIds?.length);
      await upsertProgress(ctx, {
         cellId: createdCell.id,
         baselineValue: input.kind === 'skeins_count' || (input.kind === 'parts_count' && !isSpecificPartsGoal) ? baseline : 0,
         currentValue: input.kind === 'project_finish' || isSpecificPartsGoal ? baseline : 0,
      });

      await recomputeBingoBoard(ctx, board.id);
      return createdCell;
   }),

   updateCell: protectedProcedure.input(cellUpdateSchema).mutation(async ({ ctx, input }) => {
      const existingCell = await assertBingoCellOwnership(ctx, input.id);
      const board = await assertBingoBoardOwnership(ctx, existingCell.boardId);

      const nextPosition = input.position ?? existingCell.position;
      if (nextPosition > board.size * board.size) {
         throw new Error('Position is out of bounds');
      }

      await validatePositionAvailability(ctx, board.id, nextPosition, existingCell.id);

      const normalized = normalizeCellData(input);
      if (normalized.linkedProjectId) {
         await assertProjectOwnership(ctx, normalized.linkedProjectId);
      }

      if (input.kind === 'parts_count') {
         if (!normalized.linkedProjectId) {
            throw new Error('Project is required for parts goals');
         }

         if (!normalized.linkedPartIds?.length && !normalized.targetValue) {
            throw new Error('Target is required for amount-based parts goals');
         }

         if (normalized.linkedPartIds?.length) {
            await assertGoalPartSelectionOwnership(ctx, normalized.linkedProjectId, normalized.linkedPartIds);
         }
      }

      const [updatedCell] = await ctx.db
         .update(bingoCells)
         .set({
            position: nextPosition,
            kind: input.kind,
            label: normalized.label,
            linkedProjectId: normalized.linkedProjectId,
            linkedPartIds: normalized.linkedPartIds,
            targetValue: normalized.targetValue,
            updatedAt: new Date(),
         })
         .where(eq(bingoCells.id, existingCell.id))
         .returning()
         .execute();

      if (!updatedCell) {
         throw new Error('Failed to update bingo cell');
      }

      const baseline = await getRawTrackedValue(ctx, input.kind, normalized.linkedProjectId, normalized.linkedPartIds);
      const isSpecificPartsGoal = input.kind === 'parts_count' && Boolean(normalized.linkedPartIds?.length);
      await upsertProgress(ctx, {
         cellId: existingCell.id,
         baselineValue: input.kind === 'skeins_count' || (input.kind === 'parts_count' && !isSpecificPartsGoal) ? baseline : 0,
         currentValue: input.kind === 'project_finish' || isSpecificPartsGoal ? baseline : 0,
         autoCompleted: false,
         manualCompleted: false,
         completedAt: null,
      });

      await recomputeBingoBoard(ctx, board.id);
      return updatedCell;
   }),

   deleteCell: protectedProcedure.input(z.number()).mutation(async ({ ctx, input: cellId }) => {
      const cell = await assertBingoCellOwnership(ctx, cellId);

      await ctx.db.delete(bingoCellProgress).where(eq(bingoCellProgress.cellId, cell.id)).execute();
      const result = await ctx.db.delete(bingoCells).where(eq(bingoCells.id, cell.id)).execute();

      await recomputeBingoBoard(ctx, cell.boardId);
      return result;
   }),

   setManualCompletion: protectedProcedure
      .input(z.object({ cellId: z.number(), completed: z.boolean() }))
      .mutation(async ({ ctx, input }) => {
         const cell = await assertBingoCellOwnership(ctx, input.cellId);
         const progress = await ctx.db.query.bingoCellProgress.findFirst({ where: eq(bingoCellProgress.cellId, cell.id) });

         await upsertProgress(ctx, {
            cellId: cell.id,
            baselineValue: progress?.baselineValue ?? 0,
            currentValue: progress?.currentValue ?? 0,
            autoCompleted: progress?.autoCompleted ?? false,
            manualCompleted: input.completed,
            completedAt: input.completed ? new Date() : null,
         });

         await recomputeBingoBoard(ctx, cell.boardId);
         return { success: true };
      }),

   setManualProgress: protectedProcedure
      .input(z.object({ cellId: z.number(), currentValue: z.number().int().min(0) }))
      .mutation(async ({ ctx, input }) => {
         const cell = await assertBingoCellOwnership(ctx, input.cellId);

         if (cell.kind === 'parts_count' && cell.linkedPartIds?.length) {
            throw new Error('Manual progress is unavailable for specific-part goals');
         }

         const rawValue = await getRawTrackedValue(
            ctx,
            cell.kind as z.infer<typeof bingoKindSchema>,
            cell.linkedProjectId,
            cell.linkedPartIds,
         );
         const nextBaseline = rawValue - input.currentValue;

         await upsertProgress(ctx, {
            cellId: cell.id,
            baselineValue: nextBaseline,
            currentValue: input.currentValue,
         });

         await recomputeBingoBoard(ctx, cell.boardId);
         return { success: true };
      }),

   recomputeBoard: protectedProcedure.input(z.number()).mutation(async ({ ctx, input: boardId }) => {
      await recomputeBingoBoard(ctx, boardId);
      return { success: true };
   }),
});
