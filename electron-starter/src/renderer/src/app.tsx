import TitleBar from '@components/layout/title-bar'
import { useQuery } from '@tanstack/react-query'
import { useEffect, useRef, useState } from 'react'
import { trpcClient } from '@lib/trpc'

export default function App(): React.JSX.Element {
  const { data: ping } = useQuery({
    queryKey: ['health.ping'],
    queryFn: () => trpcClient.health.ping.query(),
  })
  // Simple batch showcase
  const [batchResult, setBatchResult] = useState<Record<string, unknown> | null>(null)
  const runBatch = async (): Promise<void> => {
    const results = await window.electronApi.trpcBatchInvoke([
      { id: 'a', type: 'query', path: 'health.ping', input: undefined },
      { id: 'b', type: 'mutation', path: 'example.echo', input: { message: 'hello batch' } },
    ])
    setBatchResult(results)
  }

  // Simple subscription showcase
  const [tick, setTick] = useState<number | null>(null)
  const unsubRef = useRef<null | (() => void)>(null)
  const startSub = (): void => {
    if (unsubRef.current) return
    unsubRef.current = window.electronApi.trpcSubscribe('ticks-demo', 'example.ticks', undefined, {
      onData: (v) => {
        if (typeof v === 'number') setTick(v)
      },
      onError: (e) => {
        console.error('ticks error', e)
      },
      onComplete: () => {
        unsubRef.current = null
      },
    })
  }
  const stopSub = (): void => {
    unsubRef.current?.()
    unsubRef.current = null
  }
  useEffect(() => () => stopSub(), [])
  return (
    <>
      <TitleBar />
      <main className="app-shell">
        <div className="p-4 text-xs opacity-60 space-y-3">
          <div>tRPC health: {ping}</div>
          <div className="flex items-center gap-2">
            <button className="rounded bg-black/10 px-2 py-1" onClick={runBatch}>
              Run batch
            </button>
            <pre className="text-[10px] whitespace-pre-wrap">
              {batchResult ? JSON.stringify(batchResult, null, 2) : '—'}
            </pre>
          </div>
          <div className="flex items-center gap-2">
            <button className="rounded bg-black/10 px-2 py-1" onClick={startSub}>
              Start ticks
            </button>
            <button className="rounded bg-black/10 px-2 py-1" onClick={stopSub}>
              Stop ticks
            </button>
            <span className="text-[10px]">tick: {tick ?? '—'}</span>
          </div>
        </div>
      </main>
    </>
  )
}
