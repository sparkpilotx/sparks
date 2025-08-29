import { initTRPC } from '@trpc/server'
import superjson from 'superjson'
import { healthRouter } from './routers/health'
import { exampleRouter } from './routers/example'

const t = initTRPC.create({
  transformer: superjson,
})

export const router = t.router
export const procedure = t.procedure

export const appRouter = router({
  health: healthRouter,
  example: exampleRouter,
})

export type AppRouter = typeof appRouter
