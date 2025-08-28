import type { LocaleCode } from '@shared/locales'

declare global {
  interface Window {
    electronApi: {
      platform: NodeJS.Platform
      isMac: boolean
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
