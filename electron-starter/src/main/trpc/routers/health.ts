import { router, procedure } from '../router'

export const healthRouter = router({
  ping: procedure.query(() => 'pong'),
})


