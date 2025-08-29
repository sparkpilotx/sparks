import { router } from './base'
import { healthRouter } from './routers/health'
import { exampleRouter } from './routers/example'

export const appRouter = router({
  health: healthRouter,
  example: exampleRouter,
})

export type AppRouter = typeof appRouter
