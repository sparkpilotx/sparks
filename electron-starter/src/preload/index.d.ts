import type { LocaleCode } from '@shared/locales'

declare global {
  interface Window {
    electronApi: {
      platform: NodeJS.Platform
      isMac: boolean
      trpcInvoke: (op: {
        type: 'query' | 'mutation'
        path: string
        input: unknown
      }) => Promise<unknown>
      trpcBatchInvoke: (
        ops: Array<{ id: string; type: 'query' | 'mutation'; path: string; input: unknown }>,
      ) => Promise<Record<string, unknown>>
      trpcSubscribe: (
        key: string,
        path: string,
        input: unknown,
        handlers: {
          onData: (v: unknown) => void
          onError?: (e: unknown) => void
          onComplete?: () => void
        },
      ) => () => void
      setLocale: (lng: LocaleCode) => void
      onSetLocale: (handler: (lng: LocaleCode) => void) => () => void
      getLocale: () => Promise<LocaleCode>
      setTheme: (pref: 'system' | 'light' | 'dark') => void
      getTheme: () => Promise<'system' | 'light' | 'dark'>
      onSetTheme: (handler: (mode: 'light' | 'dark') => void) => () => void
    }
  }
}

export {}
