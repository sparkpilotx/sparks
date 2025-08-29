import { initTRPC } from '@trpc/server'
import superjson from 'superjson'
import { z } from 'zod'

const t = initTRPC.create({
  transformer: superjson,
})

export const router = t.router
export const procedure = t.procedure

export const appRouter = router({
  health: router({
    ping: procedure.query(() => 'pong'),
  }),
  example: router({
    echo: procedure.input(z.object({ message: z.string() })).mutation(({ input }) => {
      return { echoed: input.message }
    }),
    // Emits an incrementing counter every 1s (AsyncGenerator, v11 preferred)
    ticks: procedure.subscription(async function* () {
      let i = 0
      try {
        while (true) {
          yield i++
          await new Promise((r) => setTimeout(r, 1000))
        }
      } finally {
        // nothing to cleanup in this simple example
      }
    }),
  }),
})

export type AppRouter = typeof appRouter
