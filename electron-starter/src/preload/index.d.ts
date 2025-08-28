import type { LocaleCode } from '@shared/locales'

declare global {
  interface Window {
    electronApi: {
      platform: NodeJS.Platform
      isMac: boolean
      setLocale: (lng: LocaleCode) => void
      onSetLocale: (handler: (lng: LocaleCode) => void) => void
      getLocale: () => Promise<LocaleCode>
    }
  }
}

export {}
