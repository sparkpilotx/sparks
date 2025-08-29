import { router, procedure } from '../router'
import { z } from 'zod'

export const exampleRouter = router({
  echo: procedure.input(z.object({ message: z.string() })).mutation(({ input }) => {
    return { echoed: input.message }
  }),
  ticks: procedure.subscription(async function* () {
    let i = 0
    while (true) {
      yield i++
      await new Promise((r) => setTimeout(r, 1000))
    }
  }),
})


