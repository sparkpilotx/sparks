import i18next, { type i18n } from 'i18next'
import { initReactI18next } from 'react-i18next'
import { resources } from './resources'

function detectInitialLocale(): 'en-US' | 'zh-CN' {
  const navLang = (navigator.languages && navigator.languages[0]) || navigator.language || 'en-US'
  const normalized = navLang.toLowerCase()
  const isTraditional =
    normalized.includes('zh-tw') || normalized.includes('zh-hk') || normalized.includes('zh-mo')
  const isSimplified = normalized.startsWith('zh') && !isTraditional
  return isSimplified ? 'zh-CN' : 'en-US'
}

export async function initI18n(): Promise<i18n> {
  const lng = detectInitialLocale()
  document.documentElement.lang = lng
  document.documentElement.classList.add(lng === 'zh-CN' ? 'locale-zh-cn' : 'locale-en-us')

  await i18next.use(initReactI18next).init({
    lng,
    fallbackLng: 'en-US',
    resources,
    defaultNS: 'common',
    ns: ['common'],
    interpolation: { escapeValue: false },
    // Keep simple, deterministic keys
    keySeparator: '.',
    returnEmptyString: false,
  })

  return i18next
}
