import { router } from '../trpc';
import { partRouter } from './part.router';
import { projectRouter } from './project.router';
import { userRouter } from './user.router';

export const appRouter = router({
   projectRouter,
   partRouter,
   userRouter,
});

// export type definition of API
export type AppRouter = typeof appRouter;
