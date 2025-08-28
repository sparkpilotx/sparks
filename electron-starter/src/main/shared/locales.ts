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
  const normalized = input.trim()
  // Exact match?
  const exact = SUPPORTED_LOCALES.find((l) => l.code === normalized)?.code
  if (exact) return exact as LocaleCode
  // Match by base language (prefix before '-') e.g., 'en', 'zh'
  const base = normalized.split('-')[0]
  const byBase = SUPPORTED_LOCALES.find((l) => l.code.split('-')[0] === base)?.code
  if (byBase) return byBase as LocaleCode
  // Fallback to default
  return DEFAULT_LOCALE_CODE
}

export function getLocaleCssClass(code: LocaleCode): string {
  return `locale-${code.toLowerCase().replace(/[^a-z0-9]+/g, '-')}`
}

export function getAllLocaleCssClasses(): string[] {
  return SUPPORTED_LOCALES.map((l) => getLocaleCssClass(l.code as LocaleCode))
}
