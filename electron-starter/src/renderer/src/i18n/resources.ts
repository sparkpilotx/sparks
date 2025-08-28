import type { LocaleCode } from '@shared/locales'

export const resources = {
  'en-US': {
    common: () => import('./locales/en-US/common.json'),
  },
  'zh-CN': {
    common: () => import('./locales/zh-CN/common.json'),
  },
} as const

export type AppI18nResources = {
  common: {
    app: { title: string }
  }
}

export async function loadResourceBundle(
  lng: LocaleCode,
  namespace: keyof AppI18nResources,
): Promise<Record<string, unknown>> {
  const loader = (resources as Record<string, Record<string, () => Promise<unknown>>>)[lng]?.[
    namespace as string
  ]
  if (!loader) return {}
  // JSON dynamic imports may be wrapped as { default: ... } depending on bundler configuration.
  // Support both shapes to remain portable across Vite/Rollup settings.
  const mod = (await loader()) as { default?: Record<string, unknown> } | Record<string, unknown>
  const data =
    (mod as { default?: Record<string, unknown> }).default ?? (mod as Record<string, unknown>)
  return data
}
