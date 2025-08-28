import type { LocaleCode } from '@shared/locales'

export interface MenuBundle {
  view: string
  reload: string
  toggleDevTools: string
  toggleFullscreen: string
  language: string
}

export async function loadMenuBundle(locale: LocaleCode): Promise<MenuBundle> {
  const loaders = import.meta.glob('../shared/i18n/locales/*/menu.json', {
    import: 'default',
  }) as Record<string, () => Promise<MenuBundle>>

  const want = `../shared/i18n/locales/${locale}/menu.json`
  const fallback = `../shared/i18n/locales/en-US/menu.json`
  const pick = loaders[want] ?? loaders[fallback]
  return pick()
}
