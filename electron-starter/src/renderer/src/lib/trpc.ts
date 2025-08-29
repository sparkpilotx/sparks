import { createTRPCProxyClient, type TRPCLink } from '@trpc/client'
import type { AppRouter } from '../../../main/trpc/router'
import { QueryClient } from '@tanstack/react-query'
import { observable } from '@trpc/server/observable'

function createIpcLink(): TRPCLink<AppRouter> {
  return () => {
    return (opts) =>
      observable((observer) => {
        const { path, input, type } = opts.op
        if (type === 'subscription') {
          const key = `sub-${Math.random().toString(36).slice(2)}`
          const off = window.electronApi.trpcSubscribe(key, path, input, {
            onData: (data) => observer.next?.({ result: { type: 'data', data } }),
            onError: (e) => observer.error?.(e as unknown as never),
            onComplete: () => observer.complete?.(),
          })
          return () => off()
        }
        ;(async () => {
          try {
            const data = await window.electronApi.trpcInvoke({ type, path, input })
            observer.next?.({ result: { type: 'data', data } })
            observer.complete?.()
          } catch (e) {
            observer.error?.(e as unknown as never)
          }
        })()
        return () => {}
      })
  }
}

export const trpcClient = createTRPCProxyClient<AppRouter>({
  links: [createIpcLink()],
})

export const queryClient = new QueryClient()
