import { eq } from "drizzle-orm";
import { z } from "zod";
import { projects } from "~/db/schema";
import { publicProcedure, router } from "../trpc";

export const projectRouter = router({
  list: publicProcedure.query(({ ctx }) => {
    return ctx.db.select().from(projects).all();
  }),
  get: publicProcedure.input(z.number()).query(({ input: projectId, ctx }) => {
    return ctx.db
      .select()
      .from(projects)
      .where(eq(projects.id, projectId))
      .get();
  }),
  create: publicProcedure
    .input(z.object({ name: z.string() }))
    .mutation(({ input, ctx }) => {
      const { lastInsertRowid } = ctx.db
        .insert(projects)
        .values({ name: input.name })
        .run();

      return ctx.db
        .select()
        .from(projects)
        .where(eq(projects.id, lastInsertRowid as number))
        .get();
    }),

  delete: publicProcedure
    .input(z.number())
    .mutation(({ input: projectId, ctx }) => {
      return ctx.db.delete(projects).where(eq(projects.id, projectId)).run();
    }),
});
