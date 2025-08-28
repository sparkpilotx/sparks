import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './globals.css'
import App from './src/app'
import { initI18n } from './src/i18n'

// Add platform class for CSS adjustments (e.g., macOS traffic lights)
if (window.electronApi.isMac) {
  document.documentElement.classList.add('platform-darwin')
} else {
  document.documentElement.classList.add('platform-other')
}

// Detect locale and set html lang + locale class (support en-US, zh-CN)
const navLang = (navigator.languages && navigator.languages[0]) || navigator.language || 'en-US'
const normalized = navLang.toLowerCase()
const isTraditional =
  normalized.includes('zh-tw') || normalized.includes('zh-hk') || normalized.includes('zh-mo')
const isSimplified = normalized.startsWith('zh') && !isTraditional
const activeLocale = isSimplified ? 'zh-CN' : 'en-US'
document.documentElement.lang = activeLocale
document.documentElement.classList.add(activeLocale === 'zh-CN' ? 'locale-zh-cn' : 'locale-en-us')

void initI18n().then(() => {
  const container = document.getElementById('root')!
  createRoot(container).render(
    <StrictMode>
      <App />
    </StrictMode>,
  )
})
