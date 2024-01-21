import { router } from '../trpc';
import { projectRouter } from './project.router';
import { userRouter } from './user.router';

export const appRouter = router({
   projectRouter,
   userRouter,
});

// export type definition of API
export type AppRouter = typeof appRouter;
