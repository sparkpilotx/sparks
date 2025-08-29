import { router, procedure } from '../base'

export const healthRouter = router({
  ping: procedure.query(() => 'pong'),
})
