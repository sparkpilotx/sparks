import { useEffect, useRef, useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { trpcClient } from '@lib/trpc'

export default function TrpcDemo(): React.JSX.Element {
  const { data: ping } = useQuery({
    queryKey: ['health.ping'],
    queryFn: () => trpcClient.health.ping.query(),
  })

  const [batchResult, setBatchResult] = useState<Record<string, unknown> | null>(null)
  const runBatch = async (): Promise<void> => {
    const [p, e] = await Promise.all([
      trpcClient.health.ping.query(),
      trpcClient.example.echo.mutate({ message: 'hello batch' }),
    ])
    setBatchResult({ ping: p, echo: e })
  }

  const [tick, setTick] = useState<number | null>(null)
  const unsubRef = useRef<null | (() => void)>(null)
  const startSub = (): void => {
    if (unsubRef.current) return
    // Use typed subscription via proxy client
    const sub = trpcClient.example.ticks.subscribe(undefined, {
      onData: (v) => {
        if (typeof v === 'number') setTick(v)
      },
      onError: (e) => {
        console.error('ticks error', e)
      },
      onComplete: () => {
        unsubRef.current = null
      },
    } as any)
    unsubRef.current = () => sub.unsubscribe()
  }
  const stopSub = (): void => {
    unsubRef.current?.()
    unsubRef.current = null
  }
  useEffect(() => () => stopSub(), [])

  return (
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
  )
}


