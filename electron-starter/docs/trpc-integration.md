## tRPC Integration (IPC mode)

### Overview

This app integrates tRPC v11 end-to-end over Electron IPC. The main process hosts the tRPC router; the renderer talks to it via safe, explicit IPC handlers (no HTTP server). We support single calls, batching, and subscriptions.

### Packages & Versions

- @trpc/server 11.5.0
- @trpc/client 11.5.0
- @trpc/tanstack-react-query 11.5.0
- @tanstack/react-query 5.x
- superjson 2.2.2

### Architecture

- Main process
  - Declares `appRouter`
  - Handles IPC channels: `trpc:invoke`, `trpc:batchInvoke`, `trpc:subscribe`, `trpc:unsubscribe`
  - Subscriptions accept AsyncIterable (preferred v11) or tRPC Observable
- Preload
  - Exposes safe, typed bridge: `trpcInvoke`, `trpcBatchInvoke`, `trpcSubscribe`
- Renderer
  - Uses `QueryClient` directly for state/cache
  - Calls bridge APIs for RPC; includes batch and subscription showcases

### Main: Router (server)

Router lives in `src/main/trpc/router.ts`. It uses SuperJSON and a v11-preferred async generator for subscriptions.

```12:33:electron-starter/src/main/trpc/router.ts
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
```

### Main: IPC Handlers

Handlers are registered in `src/main/index.ts` after `app.whenReady()`.

```286:324:electron-starter/src/main/index.ts
ipcMain.handle(
  'trpc:invoke',
  async (
    _event,
    req: {
      path: string
      type: 'query' | 'mutation'
      input: unknown
    },
  ) => {
    // resolve caller by path and invoke
  },
)
```

```326:365:electron-starter/src/main/index.ts
ipcMain.handle(
  'trpc:batchInvoke',
  async (_event, ops) => {
    // iterate ops, resolve each path, invoke, collect results
  },
)
```

```367:457:electron-starter/src/main/index.ts
const subscriptionStore = new Map<string, { cancel: () => void }>()
ipcMain.on('trpc:subscribe', (event, req) => {
  // resolves procedure; accepts AsyncIterable or converts Observable via observableToAsyncIterable
  // streams values to 'trpc:subscriptionEvent' (data|error|complete)
})
ipcMain.on('trpc:unsubscribe', (_event, key) => {
  subscriptionStore.get(key)?.cancel()
  subscriptionStore.delete(key)
})
```

Notes:
- Path traversal calls `appRouter.createCaller({})` and safely navigates the proxy to resolve the procedure.
- Subscriptions support both AsyncIterable and tRPC Observable (converted with an AbortController for cancellation).

### Preload: Safe Bridge

`src/preload/index.ts` exposes a minimal, typed surface:

```20:38:electron-starter/src/preload/index.ts
trpcSubscribe: (
  key: string,
  path: string,
  input: unknown,
  handlers: {
    onData: (v: unknown) => void
    onError?: (e: unknown) => void
    onComplete?: () => void
  },
): (() => void) => {
  // wires subscription events and returns an unsubscribe function
}
```

Also available:
- `trpcInvoke({ type, path, input })`
- `trpcBatchInvoke([{ id, type, path, input }, ...])`

### Renderer: Usage Examples

Health query using React Query:

```tsx
import { useQuery } from '@tanstack/react-query'

const { data } = useQuery({
  queryKey: ['health.ping'],
  queryFn: async () =>
    (await window.electronApi.trpcInvoke({ type: 'query', path: 'health.ping', input: undefined })) as string,
})
```

Batch call (query + mutation):

```ts
const res = await window.electronApi.trpcBatchInvoke([
  { id: 'a', type: 'query', path: 'health.ping', input: undefined },
  { id: 'b', type: 'mutation', path: 'example.echo', input: { message: 'hello batch' } },
])
// res.a === 'pong', res.b === { echoed: 'hello batch' }
```

Subscription (ticks):

```ts
const off = window.electronApi.trpcSubscribe('ticks-demo', 'example.ticks', undefined, {
  onData: (v) => console.log('tick', v),
  onError: (e) => console.error(e),
  onComplete: () => console.log('done'),
})
// later
off()
```

See a complete demo in `src/renderer/src/app.tsx`.

### Serialization

- SuperJSON is configured on the server (router) to preserve rich types across the boundary.
- The client/renderer does not set a transformer (not needed for IPC link); values are sent over IPC.

### Error Handling & Cancellation

- Errors are caught in main and surfaced to renderer; per-op failures in batch are returned under the op id `{ error }`.
- Subscriptions cancel with `unsubscribe()`. For Observables, an AbortController is used to break the stream.

### Security Notes

- Context isolation is enabled; the preload only exposes a narrow API.
- No direct `ipcRenderer` is exposed; calls are parameter-validated and path-resolved against the tRPC proxy.
- No network ports are opened (IPC only).

### Dev & Testing

- Start: `npm run dev`
- Build: `npm run build`
- Checks: `npm run check`

### Extending

1) Add a new procedure under `src/main/trpc/router.ts`
2) Call it from renderer via `trpcInvoke` (or add UI hooks using React Query as desired)
3) For streaming endpoints, return an AsyncGenerator (preferred) or a tRPC Observable


