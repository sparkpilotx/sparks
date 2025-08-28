import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './globals.css'
import App from './src/app'
import { initI18n, ensureNamespace } from './src/i18n'
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
      <App />
    </StrictMode>,
  )
})
