import { and, desc, eq, sql } from 'drizzle-orm';
import { z } from 'zod';
import { projectYarns, projects, yarnColors, yarnTypes, yearGoalProgress, yearGoals } from '~/db/schema';
import type { Context } from '../context';
import { protectedProcedure, router } from '../trpc';
import { assertProjectOwnership, assertYearGoalOwnership } from './ownership.guard';

const yearGoalKindSchema = z.enum(['projects_count', 'yarn_balls_count', 'specific_project_finish', 'free_challenge']);

const yearGoalCreateSchema = z.object({
   year: z.number().int().min(2000).max(2100),
   kind: yearGoalKindSchema,
   label: z.string().trim().optional().nullable(),
   linkedProjectId: z.number().optional().nullable(),
   targetValue: z.number().int().positive().optional().nullable(),
});

const yearGoalUpdateSchema = z.object({
   id: z.number(),
   year: z.number().int().min(2000).max(2100),
   kind: yearGoalKindSchema,
   label: z.string().trim().optional().nullable(),
   linkedProjectId: z.number().optional().nullable(),
   targetValue: z.number().int().positive().optional().nullable(),
});

function normalizeYearGoalData(input: {
   kind: z.infer<typeof yearGoalKindSchema>;
   label?: string | null;
   linkedProjectId?: number | null;
   targetValue?: number | null;
}) {
   const label = input.label?.trim() || null;

   if (input.kind === 'free_challenge') {
      return {
         label,
         linkedProjectId: null,
         targetValue: null,
      };
   }

   if (input.kind === 'specific_project_finish') {
      return {
         label,
         linkedProjectId: input.linkedProjectId ?? null,
         targetValue: 1,
      };
   }

   return {
      label,
      linkedProjectId: null,
      targetValue: input.targetValue ?? 1,
   };
}

async function getRawTrackedValue(
   ctx: Context,
   kind: z.infer<typeof yearGoalKindSchema>,
   linkedProjectId?: number | null,
): Promise<number> {
   if (kind === 'projects_count') {
      const [row] = await ctx.db
         .select({ value: sql<number>`count(*)::int` })
         .from(projects)
         .where(and(eq(projects.userId, ctx.session.user.id), eq(projects.finished, true)));

      return row?.value ?? 0;
   }

   if (kind === 'yarn_balls_count') {
      const [projectRow] = await ctx.db
         .select({
            value: sql<number>`coalesce(sum(${projectYarns.usedCount}), 0)::int`,
         })
         .from(projectYarns)
         .innerJoin(projects, eq(projects.id, projectYarns.projectId))
         .where(eq(projects.userId, ctx.session.user.id));

      const [manualRow] = await ctx.db
         .select({ value: sql<number>`coalesce(sum(${yarnColors.manualUsedCount}), 0)::int` })
         .from(yarnColors)
         .innerJoin(yarnTypes, eq(yarnTypes.id, yarnColors.yarnTypeId))
         .where(eq(yarnTypes.userId, ctx.session.user.id));

      return (projectRow?.value ?? 0) + (manualRow?.value ?? 0);
   }

   if (kind === 'specific_project_finish' && linkedProjectId) {
      const project = await ctx.db.query.projects.findFirst({
         where: and(eq(projects.id, linkedProjectId), eq(projects.userId, ctx.session.user.id)),
      });

      return project?.finished ? 1 : 0;
   }

   return 0;
}

async function upsertProgress(
   ctx: Context,
   input: {
      goalId: number;
      baselineValue?: number;
      currentValue?: number;
      autoCompleted?: boolean;
      manualCompleted?: boolean;
      completedAt?: Date | null;
   },
) {
   const existing = await ctx.db.query.yearGoalProgress.findFirst({ where: eq(yearGoalProgress.goalId, input.goalId) });

   if (existing) {
      await ctx.db
         .update(yearGoalProgress)
         .set({
            baselineValue: input.baselineValue ?? existing.baselineValue,
            currentValue: input.currentValue ?? existing.currentValue,
            autoCompleted: input.autoCompleted ?? existing.autoCompleted,
            manualCompleted: input.manualCompleted ?? existing.manualCompleted,
            completedAt: input.completedAt === undefined ? existing.completedAt : input.completedAt,
            updatedAt: new Date(),
         })
         .where(eq(yearGoalProgress.goalId, input.goalId))
         .execute();
      return;
   }

   await ctx.db
      .insert(yearGoalProgress)
      .values({
         goalId: input.goalId,
         baselineValue: input.baselineValue ?? 0,
         currentValue: input.currentValue ?? 0,
         autoCompleted: input.autoCompleted ?? false,
         manualCompleted: input.manualCompleted ?? false,
         completedAt: input.completedAt ?? null,
      })
      .execute();
}

export async function recomputeYearGoalsForYear(ctx: Context, year: number) {
   const goals = await ctx.db
      .select({
         id: yearGoals.id,
         kind: yearGoals.kind,
         linkedProjectId: yearGoals.linkedProjectId,
         targetValue: yearGoals.targetValue,
         baselineValue: yearGoalProgress.baselineValue,
         currentValue: yearGoalProgress.currentValue,
         autoCompleted: yearGoalProgress.autoCompleted,
         manualCompleted: yearGoalProgress.manualCompleted,
         completedAt: yearGoalProgress.completedAt,
      })
      .from(yearGoals)
      .leftJoin(yearGoalProgress, eq(yearGoalProgress.goalId, yearGoals.id))
      .where(and(eq(yearGoals.userId, ctx.session.user.id), eq(yearGoals.year, year)))
      .orderBy(desc(yearGoals.updatedAt), desc(yearGoals.id));

   for (const goal of goals) {
      const kind = goal.kind as z.infer<typeof yearGoalKindSchema>;
      const target = goal.targetValue ?? 1;
      const baseline = goal.baselineValue ?? 0;
      let currentValue = goal.currentValue ?? 0;
      let autoCompleted = goal.autoCompleted ?? false;
      const manualCompleted = goal.manualCompleted ?? false;

      if (kind === 'specific_project_finish') {
         const rawValue = await getRawTrackedValue(ctx, kind, goal.linkedProjectId);
         currentValue = rawValue;
         autoCompleted = rawValue >= 1;
      } else if (kind === 'projects_count' || kind === 'yarn_balls_count') {
         const rawValue = await getRawTrackedValue(ctx, kind, goal.linkedProjectId);
         currentValue = Math.max(0, rawValue - baseline);
         autoCompleted = currentValue >= target;
      } else {
         autoCompleted = false;
      }

      const completed = manualCompleted || autoCompleted;
      const completedAt = completed ? (goal.completedAt ?? new Date()) : null;

      await upsertProgress(ctx, {
         goalId: goal.id,
         baselineValue: baseline,
         currentValue,
         autoCompleted,
         manualCompleted,
         completedAt,
      });
   }
}

export const yearGoalRouter = router({
   listGoals: protectedProcedure.input(z.object({ year: z.number().int() })).query(async ({ ctx, input }) => {
      await recomputeYearGoalsForYear(ctx, input.year);

      return ctx.db
         .select({
            id: yearGoals.id,
            year: yearGoals.year,
            kind: yearGoals.kind,
            label: yearGoals.label,
            linkedProjectId: yearGoals.linkedProjectId,
            linkedProjectName: projects.name,
            targetValue: yearGoals.targetValue,
            createdAt: yearGoals.createdAt,
            updatedAt: yearGoals.updatedAt,
            baselineValue: yearGoalProgress.baselineValue,
            currentValue: yearGoalProgress.currentValue,
            autoCompleted: yearGoalProgress.autoCompleted,
            manualCompleted: yearGoalProgress.manualCompleted,
            completedAt: yearGoalProgress.completedAt,
         })
         .from(yearGoals)
         .leftJoin(yearGoalProgress, eq(yearGoalProgress.goalId, yearGoals.id))
         .leftJoin(projects, eq(projects.id, yearGoals.linkedProjectId))
         .where(and(eq(yearGoals.userId, ctx.session.user.id), eq(yearGoals.year, input.year)))
         .orderBy(desc(yearGoals.updatedAt), desc(yearGoals.id));
   }),

   createGoal: protectedProcedure.input(yearGoalCreateSchema).mutation(async ({ ctx, input }) => {
      const normalized = normalizeYearGoalData(input);

      if (normalized.linkedProjectId) {
         await assertProjectOwnership(ctx, normalized.linkedProjectId);
      }

      const [goal] = await ctx.db
         .insert(yearGoals)
         .values({
            year: input.year,
            kind: input.kind,
            label: normalized.label,
            linkedProjectId: normalized.linkedProjectId,
            targetValue: normalized.targetValue,
            userId: ctx.session.user.id,
         })
         .returning()
         .execute();

      const baseline = await getRawTrackedValue(ctx, input.kind, normalized.linkedProjectId);
      await upsertProgress(ctx, {
         goalId: goal.id,
         baselineValue: input.kind === 'projects_count' || input.kind === 'yarn_balls_count' ? baseline : 0,
         currentValue: input.kind === 'specific_project_finish' ? baseline : 0,
      });

      await recomputeYearGoalsForYear(ctx, input.year);
      return goal;
   }),

   updateGoal: protectedProcedure.input(yearGoalUpdateSchema).mutation(async ({ ctx, input }) => {
      const existingGoal = await assertYearGoalOwnership(ctx, input.id);
      const normalized = normalizeYearGoalData(input);

      if (normalized.linkedProjectId) {
         await assertProjectOwnership(ctx, normalized.linkedProjectId);
      }

      const [updatedGoal] = await ctx.db
         .update(yearGoals)
         .set({
            year: input.year,
            kind: input.kind,
            label: normalized.label,
            linkedProjectId: normalized.linkedProjectId,
            targetValue: normalized.targetValue,
            updatedAt: new Date(),
         })
         .where(eq(yearGoals.id, existingGoal.id))
         .returning()
         .execute();

      const baseline = await getRawTrackedValue(ctx, input.kind, normalized.linkedProjectId);
      await upsertProgress(ctx, {
         goalId: existingGoal.id,
         baselineValue: input.kind === 'projects_count' || input.kind === 'yarn_balls_count' ? baseline : 0,
         currentValue: input.kind === 'specific_project_finish' ? baseline : 0,
         autoCompleted: false,
         manualCompleted: false,
         completedAt: null,
      });

      await recomputeYearGoalsForYear(ctx, input.year);
      return updatedGoal;
   }),

   deleteGoal: protectedProcedure.input(z.number()).mutation(async ({ ctx, input: goalId }) => {
      const goal = await assertYearGoalOwnership(ctx, goalId);

      await ctx.db.delete(yearGoalProgress).where(eq(yearGoalProgress.goalId, goal.id)).execute();
      await ctx.db.delete(yearGoals).where(eq(yearGoals.id, goal.id)).execute();

      return { success: true };
   }),

   setManualCompletion: protectedProcedure
      .input(z.object({ goalId: z.number(), completed: z.boolean() }))
      .mutation(async ({ ctx, input }) => {
         const goal = await assertYearGoalOwnership(ctx, input.goalId);
         const progress = await ctx.db.query.yearGoalProgress.findFirst({ where: eq(yearGoalProgress.goalId, goal.id) });

         await upsertProgress(ctx, {
            goalId: goal.id,
            baselineValue: progress?.baselineValue ?? 0,
            currentValue: progress?.currentValue ?? 0,
            autoCompleted: progress?.autoCompleted ?? false,
            manualCompleted: input.completed,
            completedAt: input.completed ? new Date() : null,
         });

         await recomputeYearGoalsForYear(ctx, goal.year);
         return { success: true };
      }),

   setManualProgress: protectedProcedure
      .input(z.object({ goalId: z.number(), currentValue: z.number().int().min(0) }))
      .mutation(async ({ ctx, input }) => {
         const goal = await assertYearGoalOwnership(ctx, input.goalId);

         const rawValue = await getRawTrackedValue(ctx, goal.kind as z.infer<typeof yearGoalKindSchema>, goal.linkedProjectId);
         const nextBaseline = rawValue - input.currentValue;

         await upsertProgress(ctx, {
            goalId: goal.id,
            baselineValue: nextBaseline,
            currentValue: input.currentValue,
         });

         await recomputeYearGoalsForYear(ctx, goal.year);
         return { success: true };
      }),

   recomputeYear: protectedProcedure.input(z.number()).mutation(async ({ ctx, input: year }) => {
      await recomputeYearGoalsForYear(ctx, year);
      return { success: true };
   }),

   yearSummary: protectedProcedure.query(async ({ ctx }) => {
      const rows = await ctx.db
         .select({
            year: yearGoals.year,
            total: sql<number>`count(${yearGoals.id})::int`,
            completed: sql<number>`count(case when (${yearGoalProgress.manualCompleted} = true or ${yearGoalProgress.autoCompleted} = true) then 1 end)::int`,
         })
         .from(yearGoals)
         .leftJoin(yearGoalProgress, eq(yearGoalProgress.goalId, yearGoals.id))
         .where(eq(yearGoals.userId, ctx.session.user.id))
         .groupBy(yearGoals.year)
         .orderBy(desc(yearGoals.year));

      return rows;
   }),

   yearOptions: protectedProcedure.query(async ({ ctx }) => {
      const [row] = await ctx.db
         .select({ minYear: sql<number | null>`min(${yearGoals.year})::int`, maxYear: sql<number | null>`max(${yearGoals.year})::int` })
         .from(yearGoals)
         .where(eq(yearGoals.userId, ctx.session.user.id));

      const currentYear = new Date().getFullYear();
      const from = Math.min(row?.minYear ?? currentYear, currentYear - 1);
      const to = Math.max(row?.maxYear ?? currentYear, currentYear + 1);
      const years: number[] = [];

      for (let year = from; year <= to; year += 1) {
         years.push(year);
      }

      return years.sort((a, b) => b - a);
   }),
});
