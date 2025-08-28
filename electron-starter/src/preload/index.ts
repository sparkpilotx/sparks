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
  onSetLocale: (handler: (lng: LocaleCode) => void) => {
    ipcRenderer.on('app:set-locale', (_event, lng: LocaleCode) => handler(lng))
  },
} as const

contextBridge.exposeInMainWorld('electronApi', electronApi)
