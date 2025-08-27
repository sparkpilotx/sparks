import { z } from 'zod'
import { JsonStore } from './json-store'

export const DbConfigSchema = z.object({
  dbUrl: z.string().url(),
})

export type DbConfig = z.infer<typeof DbConfigSchema>

export const dbConfigStore = new JsonStore<DbConfig>({
  fileName: 'db-config.json',
  schema: DbConfigSchema,
  defaults: {
    dbUrl: 'postgres://postgres:postgres@localhost:5432',
  },
})
