import { router } from '../trpc';
import { bingoRouter } from './bingo.router';
import { partRouter } from './part.router';
import { projectRouter } from './project.router';
import { skeinRouter } from './skein.router';
import { userRouter } from './user.router';
import { yearGoalRouter } from './year-goal.router';
import { yarnRouter } from './yarn.router';

export const appRouter = router({
   bingoRouter,
   projectRouter,
   partRouter,
   skeinRouter,
   yarnRouter,
   userRouter,
   yearGoalRouter,
});

// export type definition of API
export type AppRouter = typeof appRouter;
