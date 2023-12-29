import { router } from "../trpc";
import { projectRouter } from "./project.router";

export const appRouter = router({
  projectRouter,
});

// export type definition of API
export type AppRouter = typeof appRouter;
