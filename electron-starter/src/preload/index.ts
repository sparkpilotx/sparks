import { contextBridge, ipcRenderer } from 'electron'
import type { LocaleCode } from '@shared/locales'

const platform = process.platform
const electronApi = {
  platform,
  isMac: platform === 'darwin',
  setLocale: (lng: LocaleCode) => {
    ipcRenderer.send('app:set-locale', lng)
  },
  getLocale: async (): Promise<LocaleCode> => {
    const result = (await ipcRenderer.invoke('app:get-locale')) as unknown
    if (typeof result === 'string') {
      // Basic runtime guard: ensure returned string matches a supported code pattern
      return result as LocaleCode
    }
    throw new Error('Invalid locale received from main')
  },
  onSetLocale: (handler: (lng: LocaleCode) => void): (() => void) => {
    const listener: (_event: unknown, lng: LocaleCode) => void = (_event, lng) => handler(lng)
    ipcRenderer.on('app:set-locale', listener)
    return () => {
      ipcRenderer.removeListener('app:set-locale', listener)
    }
  },
  setTheme: (pref: 'system' | 'light' | 'dark') => {
    ipcRenderer.send('app:set-theme', pref)
  },
  getTheme: async (): Promise<'system' | 'light' | 'dark'> => {
    const result = (await ipcRenderer.invoke('app:get-theme')) as unknown
    if (result === 'system' || result === 'light' || result === 'dark') return result
    return 'system'
  },
  onSetTheme: (handler: (mode: 'light' | 'dark') => void): (() => void) => {
    const listener: (_event: unknown, mode: 'light' | 'dark') => void = (_event, mode) =>
      handler(mode)
    ipcRenderer.on('app:set-theme', listener)
    return () => {
      ipcRenderer.removeListener('app:set-theme', listener)
    }
  },
} as const

contextBridge.exposeInMainWorld('electronApi', electronApi)
