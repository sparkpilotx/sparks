import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './globals.css'
import App from './src/app'
import { initI18n, ensureNamespace } from './src/i18n'
import { queryClient } from './src/lib/trpc'
import { QueryClientProvider } from '@tanstack/react-query'
import {
  getAllLocaleCssClasses,
  getLocaleCssClass,
  normalizeToSupportedLocale,
  type LocaleCode,
} from '@shared/locales'

// Add platform class for CSS adjustments (e.g., macOS traffic lights)
if (window.electronApi.isMac) {
  document.documentElement.classList.add('platform-darwin')
} else {
  document.documentElement.classList.add('platform-other')
}

// Apply initial theme and subscribe to changes
void (async () => {
  try {
    const pref = await window.electronApi.getTheme?.()
    const mode = pref === 'dark' ? 'dark' : pref === 'light' ? 'light' : undefined
    const html = document.documentElement
    html.classList.toggle('dark', mode ? mode === 'dark' : false)
  } catch {}
})()

window.electronApi.onSetTheme?.((mode) => {
  document.documentElement.classList.toggle('dark', mode === 'dark')
})

void initI18n().then((i18n) => {
  const applyLangToDocument = (lng: LocaleCode): void => {
    const html = document.documentElement
    html.lang = lng
    html.classList.remove(...getAllLocaleCssClasses())
    html.classList.add(getLocaleCssClass(lng))
  }

  i18n.on('languageChanged', applyLangToDocument)

  // Listen to app-level locale change requests via IPC bridge
  window.electronApi.onSetLocale((lng) => {
    const next = normalizeToSupportedLocale(lng)
    if (next !== (i18n.language as LocaleCode)) {
      void (async () => {
        await ensureNamespace(next, 'common')
        await i18n.changeLanguage(next)
      })()
    }
  })

  const container = document.getElementById('root')!
  createRoot(container).render(
    <StrictMode>
      <QueryClientProvider client={queryClient}>
        <App />
      </QueryClientProvider>
    </StrictMode>,
  )
})
