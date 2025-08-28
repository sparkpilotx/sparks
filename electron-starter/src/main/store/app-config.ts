import { z } from 'zod'
import { JsonStore } from './json-store'
import type { LocaleCode } from '@shared/locales'

export type ThemePreference = 'system' | 'light' | 'dark'

export const AppConfigSchema = z.object({
  // Application-wide language
  locale: z.custom<LocaleCode>((val) => typeof val === 'string' && (val as string).length > 0),
  // Database connection string
  dbUrl: z.string().url(),
  // UI theme preference
  theme: z.enum(['system', 'light', 'dark']),
})

export type AppConfig = z.infer<typeof AppConfigSchema>

export const appConfigStore = new JsonStore<AppConfig>({
  fileName: 'app-config.json',
  schema: AppConfigSchema,
  defaults: {
    locale: 'en-US',
    dbUrl: 'postgres://postgres:postgres@localhost:5432',
    theme: 'system',
  },
})
