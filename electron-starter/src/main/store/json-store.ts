import { app } from 'electron'
import { promises as fs } from 'node:fs'
import { dirname, join } from 'node:path'
import type { ZodType } from 'zod'

export interface JsonStoreOptions<TData> {
  fileName: string
  schema: ZodType<TData>
  defaults: TData
}

/**
 * Minimal JSON store persisted under app.getPath('userData').
 * - Validates on read/write using provided Zod schema
 * - Creates file with defaults if missing
 * - No renderer access; import from main process only
 */
export class JsonStore<TData> {
  private readonly schema: ZodType<TData>
  private readonly defaults: TData
  private readonly filePath: string

  constructor(options: JsonStoreOptions<TData>) {
    if ((process as unknown as { type?: string }).type === 'renderer') {
      throw new Error('JsonStore must only be used in the main process')
    }
    const userDataDir = app.getPath('userData')
    this.filePath = join(userDataDir, options.fileName)
    this.schema = options.schema
    this.defaults = options.defaults
  }

  async read(): Promise<TData> {
    try {
      const raw = await fs.readFile(this.filePath, 'utf8')
      const parsed = JSON.parse(raw) as unknown
      return this.schema.parse(parsed)
    } catch (_err) {
      // If file missing or invalid, write defaults
      const data = this.schema.parse(this.defaults)
      await this.write(data)
      return data
    }
  }

  async write(data: TData): Promise<void> {
    const valid = this.schema.parse(data)
    await this.ensureDir()
    const tmpPath = `${this.filePath}.tmp`
    const json = JSON.stringify(valid, null, 2)
    await fs.writeFile(tmpPath, json, 'utf8')
    await fs.rename(tmpPath, this.filePath)
  }

  async update(mutator: (current: TData) => TData): Promise<TData> {
    const current = await this.read()
    const next = this.schema.parse(mutator(current))
    await this.write(next)
    return next
  }

  private async ensureDir(): Promise<void> {
    await fs.mkdir(dirname(this.filePath), { recursive: true })
  }
}
