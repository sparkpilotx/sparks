import { contextBridge } from 'electron'

const electronApi = {} as const

contextBridge.exposeInMainWorld('electronApi', electronApi)
