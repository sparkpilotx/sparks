export interface AppLocale {
  code: string
  label: string
  nativeLabel: string
}

export const SUPPORTED_LOCALES = [
  {
    code: 'en-US',
    label: 'English (US)',
    nativeLabel: 'English (US)',
  },
  {
    code: 'zh-CN',
    label: 'Simplified Chinese',
    nativeLabel: '简体中文',
  },
] as const satisfies readonly AppLocale[]

export type LocaleCode = (typeof SUPPORTED_LOCALES)[number]['code']

export const DEFAULT_LOCALE_CODE: LocaleCode = SUPPORTED_LOCALES[0].code

export function normalizeToSupportedLocale(input: string): LocaleCode {
  const normalized = input.toLowerCase()
  const isTraditional =
    normalized.includes('zh-tw') || normalized.includes('zh-hk') || normalized.includes('zh-mo')
  const isSimplified = normalized.startsWith('zh') && !isTraditional
  const candidate = isSimplified ? 'zh-CN' : 'en-US'
  return (SUPPORTED_LOCALES.find((l) => l.code === candidate)?.code ||
    DEFAULT_LOCALE_CODE) as LocaleCode
}

export function getLocaleCssClass(code: LocaleCode): string {
  return `locale-${code.toLowerCase().replace(/[^a-z0-9]+/g, '-')}`
}

export function getAllLocaleCssClasses(): string[] {
  return SUPPORTED_LOCALES.map((l) => getLocaleCssClass(l.code as LocaleCode))
}
