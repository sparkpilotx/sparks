import i18next, { type i18n } from 'i18next'
import { initReactI18next } from 'react-i18next'
import { loadResourceBundle } from './resources'
import {
  normalizeToSupportedLocale,
  type LocaleCode,
  getAllLocaleCssClasses,
  getLocaleCssClass,
} from '@shared/locales'

function detectInitialLocale(): LocaleCode {
  const navLang = (navigator.languages && navigator.languages[0]) || navigator.language || 'en-US'
  return normalizeToSupportedLocale(navLang)
}

export async function initI18n(): Promise<i18n> {
  // Prefer main-provided persisted locale if available
  const mainLocale = (await window.electronApi.getLocale?.()) as LocaleCode | undefined
  const lng = mainLocale ?? detectInitialLocale()
  document.documentElement.lang = lng
  document.documentElement.classList.remove(...getAllLocaleCssClasses())
  document.documentElement.classList.add(getLocaleCssClass(lng))

  await i18next.use(initReactI18next).init({
    lng,
    fallbackLng: 'en-US',
    defaultNS: 'common',
    ns: ['common'],
    interpolation: { escapeValue: false },
    keySeparator: '.',
    returnEmptyString: false,
  })

  // Lazy-load default namespace for initial language
  const common = await loadResourceBundle(lng, 'common')
  i18next.addResourceBundle(lng, 'common', common, true, true)

  return i18next
}

// Optional helper to load a namespace on demand later
export async function ensureNamespace(lng: LocaleCode, namespace: 'common'): Promise<void> {
  if (i18next.hasResourceBundle(lng, namespace)) return
  const data = await loadResourceBundle(lng, namespace)
  i18next.addResourceBundle(lng, namespace, data, true, true)
}
