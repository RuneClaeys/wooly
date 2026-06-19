import { and, asc, desc, eq, sql } from 'drizzle-orm';
import { z } from 'zod';
import { projectYarns, projects, yarnColors, yarnTypes } from '~/db/schema';
import { genericSort } from '~/server/helpers/zod.helper';
import type { Context } from '../context';
import { protectedProcedure, router } from '../trpc';
import { recomputeBingoBoardsForUser } from './bingo.router';
import { assertProjectOwnership, assertProjectYarnOwnership, assertYarnColorOwnership, assertYarnTypeOwnership } from './ownership.guard';

async function refreshProject(ctx: Context, projectId: number) {
   await ctx.db
      .update(projects)
      .set({ updatedAt: new Date() })
      .where(and(eq(projects.id, projectId), eq(projects.userId, ctx.session.user.id)))
      .execute();
}

export const skeinRouter = router({
   archiveList: protectedProcedure.query(async ({ ctx }) => {
      const types = await ctx.db.query.yarnTypes.findMany({
         where: eq(yarnTypes.userId, ctx.session.user.id),
         orderBy: asc(yarnTypes.name),
      });

      const colors = await ctx.db
         .select({
            id: yarnColors.id,
            yarnTypeId: yarnColors.yarnTypeId,
            name: yarnColors.name,
            stashCount: yarnColors.stashCount,
            usedCount: sql<number>`coalesce(sum(${projectYarns.usedCount}), 0)::int`,
            lastUsedAt: sql<string | null>`max(${projectYarns.updatedAt})::text`,
         })
         .from(yarnColors)
         .leftJoin(projectYarns, eq(projectYarns.yarnColorId, yarnColors.id))
         .leftJoin(yarnTypes, eq(yarnTypes.id, yarnColors.yarnTypeId))
         .where(eq(yarnTypes.userId, ctx.session.user.id))
         .groupBy(yarnColors.id)
         .orderBy(asc(yarnColors.name));

      const colorsByType = new Map<number, typeof colors>();
      for (const color of colors) {
         const existing = colorsByType.get(color.yarnTypeId) ?? [];
         existing.push(color);
         colorsByType.set(color.yarnTypeId, existing);
      }

      return types.map((type) => {
         const typeColors = colorsByType.get(type.id) ?? [];
         const usedCount = typeColors.reduce((sum, color) => sum + color.usedCount, 0);
         const stashCount = typeColors.reduce((sum, color) => sum + color.stashCount, 0);
         const lastUsedAt = typeColors.reduce<string | null>((latest, color) => {
            if (!color.lastUsedAt) return latest;
            if (!latest) return color.lastUsedAt;

            return new Date(color.lastUsedAt) > new Date(latest) ? color.lastUsedAt : latest;
         }, null);

         return {
            id: type.id,
            name: type.name,
            skeinWeightGrams: type.skeinWeightGrams,
            thicknessMm: type.thicknessMm,
            usedCount,
            stashCount,
            remainingCount: stashCount - usedCount,
            lastUsedAt,
            colors: typeColors.map((color) => ({
               id: color.id,
               name: color.name,
               stashCount: color.stashCount,
               usedCount: color.usedCount,
               remainingCount: color.stashCount - color.usedCount,
            })),
         };
      });
   }),

   typeCreate: protectedProcedure
      .input(
         z.object({
            name: z.string().trim().min(1),
            skeinWeightGrams: z.number().int().min(1).optional().nullable(),
            thicknessMm: z.number().min(0.01).optional().nullable(),
         }),
      )
      .mutation(async ({ ctx, input }) => {
         const existing = await ctx.db.query.yarnTypes.findFirst({
            where: and(eq(yarnTypes.userId, ctx.session.user.id), eq(yarnTypes.name, input.name)),
         });

         if (existing) return existing;

         const [createdType] = await ctx.db
            .insert(yarnTypes)
            .values({
               name: input.name,
               skeinWeightGrams: input.skeinWeightGrams ?? null,
               thicknessMm: input.thicknessMm ?? null,
               userId: ctx.session.user.id,
            })
            .returning()
            .execute();

         return createdType;
      }),

   typeUpdate: protectedProcedure
      .input(
         z.object({
            id: z.number(),
            name: z.string().trim().min(1),
            skeinWeightGrams: z.number().int().min(1).optional().nullable(),
            thicknessMm: z.number().min(0.01).optional().nullable(),
         }),
      )
      .mutation(async ({ ctx, input }) => {
         await assertYarnTypeOwnership(ctx, input.id);
         const [updatedType] = await ctx.db
            .update(yarnTypes)
            .set({
               name: input.name,
               skeinWeightGrams: input.skeinWeightGrams ?? null,
               thicknessMm: input.thicknessMm ?? null,
               updatedAt: new Date(),
            })
            .where(eq(yarnTypes.id, input.id))
            .returning()
            .execute();
         return updatedType;
      }),

   typeDelete: protectedProcedure.input(z.number()).mutation(async ({ ctx, input: yarnTypeId }) => {
      await assertYarnTypeOwnership(ctx, yarnTypeId);

      const colors = await ctx.db.query.yarnColors.findMany({ where: eq(yarnColors.yarnTypeId, yarnTypeId) });
      const colorIds = colors.map((color) => color.id);

      if (colorIds.length > 0) {
         await ctx.db
            .delete(projectYarns)
            .where(sql`${projectYarns.yarnColorId} in ${colorIds}`)
            .execute();
      }

      await ctx.db.delete(yarnColors).where(eq(yarnColors.yarnTypeId, yarnTypeId)).execute();
      await ctx.db.delete(yarnTypes).where(eq(yarnTypes.id, yarnTypeId)).execute();
      await recomputeBingoBoardsForUser(ctx);

      return { success: true };
   }),

   colorCreate: protectedProcedure
      .input(
         z.object({
            yarnTypeId: z.number(),
            name: z.string().trim().min(1),
            stashCount: z.number().int().min(0).optional().default(0),
         }),
      )
      .mutation(async ({ ctx, input }) => {
         await assertYarnTypeOwnership(ctx, input.yarnTypeId);

         const existing = await ctx.db.query.yarnColors.findFirst({
            where: and(eq(yarnColors.yarnTypeId, input.yarnTypeId), eq(yarnColors.name, input.name)),
         });

         if (existing) return existing;

         const [createdColor] = await ctx.db
            .insert(yarnColors)
            .values({
               yarnTypeId: input.yarnTypeId,
               name: input.name,
               stashCount: input.stashCount,
            })
            .returning()
            .execute();

         return createdColor;
      }),

   colorUpdate: protectedProcedure
      .input(
         z.object({
            id: z.number(),
            name: z.string().trim().min(1).optional(),
            stashCount: z.number().int().min(0).optional(),
         }),
      )
      .mutation(async ({ ctx, input }) => {
         await assertYarnColorOwnership(ctx, input.id);

         const [updatedColor] = await ctx.db
            .update(yarnColors)
            .set({
               ...(input.name !== undefined ? { name: input.name } : {}),
               ...(input.stashCount !== undefined ? { stashCount: input.stashCount } : {}),
               updatedAt: new Date(),
            })
            .where(eq(yarnColors.id, input.id))
            .returning()
            .execute();

         return updatedColor;
      }),

   colorDelete: protectedProcedure.input(z.number()).mutation(async ({ ctx, input: yarnColorId }) => {
      await assertYarnColorOwnership(ctx, yarnColorId);

      await ctx.db.delete(projectYarns).where(eq(projectYarns.yarnColorId, yarnColorId)).execute();
      await ctx.db.delete(yarnColors).where(eq(yarnColors.id, yarnColorId)).execute();
      await recomputeBingoBoardsForUser(ctx);

      return { success: true };
   }),

   projectList: protectedProcedure.input(z.object({ projectId: z.number(), sorting: genericSort })).query(async ({ ctx, input }) => {
      await assertProjectOwnership(ctx, input.projectId);

      return ctx.db
         .select({
            id: projectYarns.id,
            projectId: projectYarns.projectId,
            yarnColorId: projectYarns.yarnColorId,
            yarnTypeId: yarnTypes.id,
            yarnTypeName: yarnTypes.name,
            yarnColorName: yarnColors.name,
            usedCount: projectYarns.usedCount,
            createdAt: projectYarns.createdAt,
            updatedAt: projectYarns.updatedAt,
         })
         .from(projectYarns)
         .innerJoin(yarnColors, eq(yarnColors.id, projectYarns.yarnColorId))
         .innerJoin(yarnTypes, eq(yarnTypes.id, yarnColors.yarnTypeId))
         .where(eq(projectYarns.projectId, input.projectId))
         .orderBy(input.sorting.order === 'asc' ? asc(yarnTypes.name) : desc(yarnTypes.name));
   }),

   projectAdd: protectedProcedure
      .input(
         z.object({
            projectId: z.number(),
            yarnColorId: z.number(),
            usedCount: z.number().int().min(0).optional().default(0),
         }),
      )
      .mutation(async ({ ctx, input }) => {
         await assertProjectOwnership(ctx, input.projectId);
         await assertYarnColorOwnership(ctx, input.yarnColorId);

         const [createdUsage] = await ctx.db
            .insert(projectYarns)
            .values({
               projectId: input.projectId,
               yarnColorId: input.yarnColorId,
               usedCount: input.usedCount,
            })
            .returning()
            .execute();

         await refreshProject(ctx, input.projectId);
         await recomputeBingoBoardsForUser(ctx);
         return createdUsage;
      }),

   projectUpdate: protectedProcedure
      .input(z.object({ id: z.number(), yarnColorId: z.number().optional(), usedCount: z.number().int().min(0) }))
      .mutation(async ({ ctx, input }) => {
         const usage = await assertProjectYarnOwnership(ctx, input.id);

         if (input.yarnColorId !== undefined) {
            await assertYarnColorOwnership(ctx, input.yarnColorId);
         }

         const [updatedUsage] = await ctx.db
            .update(projectYarns)
            .set({
               ...(input.yarnColorId !== undefined ? { yarnColorId: input.yarnColorId } : {}),
               usedCount: input.usedCount,
               updatedAt: new Date(),
            })
            .where(eq(projectYarns.id, input.id))
            .returning()
            .execute();

         await refreshProject(ctx, usage.projectId);
         await recomputeBingoBoardsForUser(ctx);
         return updatedUsage;
      }),

   projectRemove: protectedProcedure.input(z.number()).mutation(async ({ ctx, input: usageId }) => {
      const usage = await assertProjectYarnOwnership(ctx, usageId);

      await ctx.db.delete(projectYarns).where(eq(projectYarns.id, usageId)).execute();
      await refreshProject(ctx, usage.projectId);
      await recomputeBingoBoardsForUser(ctx);

      return { success: true };
   }),

   // Compatibility layer: existing UI still calls skein catalog/list APIs.
   catalogList: protectedProcedure.query(async ({ ctx }) => {
      return ctx.db.query.yarnTypes.findMany({
         where: eq(yarnTypes.userId, ctx.session.user.id),
         orderBy: asc(yarnTypes.name),
      });
   }),

   catalogCreate: protectedProcedure.input(z.object({ name: z.string().trim().min(1) })).mutation(async ({ ctx, input }) => {
      const existing = await ctx.db.query.yarnTypes.findFirst({
         where: and(eq(yarnTypes.userId, ctx.session.user.id), eq(yarnTypes.name, input.name)),
      });

      if (existing) return existing;

      const [createdType] = await ctx.db.insert(yarnTypes).values({ name: input.name, userId: ctx.session.user.id }).returning().execute();

      await ctx.db
         .insert(yarnColors)
         .values({
            yarnTypeId: createdType.id,
            name: createdType.name,
            stashCount: 0,
         })
         .execute();

      return createdType;
   }),

   summary: protectedProcedure.query(async ({ ctx }) => {
      return ctx.db
         .select({
            skeinId: yarnTypes.id,
            skeinName: yarnTypes.name,
            projectCount: sql<number>`count(distinct ${projectYarns.projectId})::int`,
            totalCounter: sql<number>`coalesce(sum(${projectYarns.usedCount}), 0)::int`,
         })
         .from(yarnTypes)
         .leftJoin(yarnColors, eq(yarnColors.yarnTypeId, yarnTypes.id))
         .leftJoin(projectYarns, eq(projectYarns.yarnColorId, yarnColors.id))
         .leftJoin(projects, eq(projects.id, projectYarns.projectId))
         .where(eq(yarnTypes.userId, ctx.session.user.id))
         .groupBy(yarnTypes.id, yarnTypes.name)
         .orderBy(asc(yarnTypes.name));
   }),

   list: protectedProcedure.input(z.object({ projectId: z.number(), sorting: genericSort })).query(async ({ ctx, input }) => {
      await assertProjectOwnership(ctx, input.projectId);

      return ctx.db
         .select({
            id: projectYarns.id,
            projectId: projectYarns.projectId,
            skeinId: yarnTypes.id,
            counter: projectYarns.usedCount,
            createdAt: projectYarns.createdAt,
            updatedAt: projectYarns.updatedAt,
            skeinName: yarnTypes.name,
         })
         .from(projectYarns)
         .innerJoin(yarnColors, eq(yarnColors.id, projectYarns.yarnColorId))
         .innerJoin(yarnTypes, eq(yarnTypes.id, yarnColors.yarnTypeId))
         .where(eq(projectYarns.projectId, input.projectId))
         .orderBy(input.sorting.order === 'asc' ? asc(yarnTypes.name) : desc(yarnTypes.name));
   }),

   create: protectedProcedure
      .input(
         z.object({
            projectId: z.number(),
            skeinId: z.number(),
            counter: z.number().optional().default(0),
         }),
      )
      .mutation(async ({ input, ctx }) => {
         await assertProjectOwnership(ctx, input.projectId);
         await assertYarnTypeOwnership(ctx, input.skeinId);

         let selectedColor = await ctx.db.query.yarnColors.findFirst({
            where: eq(yarnColors.yarnTypeId, input.skeinId),
            orderBy: asc(yarnColors.id),
         });

         if (!selectedColor) {
            const type = await assertYarnTypeOwnership(ctx, input.skeinId);
            const [createdColor] = await ctx.db
               .insert(yarnColors)
               .values({ yarnTypeId: type.id, name: type.name, stashCount: 0 })
               .returning()
               .execute();
            selectedColor = createdColor;
         }

         const [createdUsage] = await ctx.db
            .insert(projectYarns)
            .values({
               projectId: input.projectId,
               yarnColorId: selectedColor.id,
               usedCount: input.counter,
            })
            .returning()
            .execute();

         await refreshProject(ctx, input.projectId);
         await recomputeBingoBoardsForUser(ctx);

         return createdUsage;
      }),

   delete: protectedProcedure.input(z.number()).mutation(async ({ input: usageId, ctx }) => {
      const usage = await assertProjectYarnOwnership(ctx, usageId);
      const result = await ctx.db.delete(projectYarns).where(eq(projectYarns.id, usageId)).execute();

      await refreshProject(ctx, usage.projectId);
      await recomputeBingoBoardsForUser(ctx);
      return result;
   }),

   update: protectedProcedure
      .input(z.object({ id: z.number(), skeinId: z.number(), counter: z.number() }))
      .mutation(async ({ input, ctx }) => {
         const usage = await assertProjectYarnOwnership(ctx, input.id);
         await assertYarnTypeOwnership(ctx, input.skeinId);

         let selectedColor = await ctx.db.query.yarnColors.findFirst({
            where: eq(yarnColors.yarnTypeId, input.skeinId),
            orderBy: asc(yarnColors.id),
         });

         if (!selectedColor) {
            const type = await assertYarnTypeOwnership(ctx, input.skeinId);
            const [createdColor] = await ctx.db
               .insert(yarnColors)
               .values({ yarnTypeId: type.id, name: type.name, stashCount: 0 })
               .returning()
               .execute();
            selectedColor = createdColor;
         }

         const result = await ctx.db
            .update(projectYarns)
            .set({ yarnColorId: selectedColor.id, usedCount: input.counter, updatedAt: new Date() })
            .where(eq(projectYarns.id, input.id))
            .execute();

         await refreshProject(ctx, usage.projectId);
         await recomputeBingoBoardsForUser(ctx);
         return result;
      }),
});

export const yarnRouter = skeinRouter;
