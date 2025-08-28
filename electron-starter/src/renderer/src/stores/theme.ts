import { create } from 'zustand'

export type ThemePreference = 'system' | 'light' | 'dark'
export type ThemeMode = 'light' | 'dark'

interface ThemeState {
  preference: ThemePreference
  effectiveMode: ThemeMode
  initialized: boolean
  setPreference: (next: ThemePreference) => void
  setEffectiveMode: (mode: ThemeMode) => void
}

const getInitialEffectiveMode = (): ThemeMode =>
  document.documentElement.classList.contains('dark') ? 'dark' : 'light'

export const useThemeStore = create<ThemeState>((set, _get) => ({
  preference: 'system',
  effectiveMode: getInitialEffectiveMode(),
  initialized: false,
  setPreference: (next: ThemePreference) => {
    set({ preference: next })
    try {
      window.electronApi.setTheme?.(next)
    } catch {}
  },
  setEffectiveMode: (mode: ThemeMode) => set({ effectiveMode: mode }),
}))

// Initialize from main process and subscribe to OS/effective changes
let didInit = false
export const ensureThemeStoreInitialized = (): void => {
  if (didInit) return
  didInit = true
  void (async () => {
    try {
      const pref = await window.electronApi.getTheme?.()
      if (pref) useThemeStore.setState({ preference: pref, initialized: true })
      else useThemeStore.setState({ initialized: true })
    } catch {
      useThemeStore.setState({ initialized: true })
    }
  })()
  // Subscribe to effective mode updates from main
  window.electronApi.onSetTheme?.((mode) => {
    useThemeStore.getState().setEffectiveMode(mode)
  })
}
