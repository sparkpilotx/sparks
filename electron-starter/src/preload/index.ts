import { contextBridge } from 'electron'

const platform = process.platform
const electronApi = {
  platform,
  isMac: platform === 'darwin',
} as const

contextBridge.exposeInMainWorld('electronApi', electronApi)
