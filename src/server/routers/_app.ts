/**
 * This file contains the root router of your tRPC-backend
 */
import { publicProcedure, router } from '../trpc';
import { roomRouter } from './room';

export const appRouter = router({
  healthcheck: publicProcedure.query(() => 'yay!'),

  room: roomRouter,
});

export type AppRouter = typeof appRouter;
