import type { LocaleCode } from '@shared/locales'

export type AppI18nResources = {
  common: {
    app: { title: string }
  }
}

export async function loadResourceBundle(
  lng: LocaleCode,
  _namespace: keyof AppI18nResources,
): Promise<Record<string, unknown>> {
  // Single source of truth: load JSON from shared locales under main/shared.
  const loaders = import.meta.glob('../../../main/shared/i18n/locales/*/common.json', {
    import: 'default',
  }) as Record<string, () => Promise<Record<string, unknown>>>
  const want = `../../../main/shared/i18n/locales/${lng}/common.json`
  const fallback = `../../../main/shared/i18n/locales/en-US/common.json`
  const pick = loaders[want] ?? loaders[fallback]
  return pick ? pick() : {}
}
