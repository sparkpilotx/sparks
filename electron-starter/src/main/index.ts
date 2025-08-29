import { app, BaseWindow, WebContentsView, nativeTheme, Menu, webContents, ipcMain } from 'electron'
import { isObservable, observableToAsyncIterable } from '@trpc/server/observable'
import { appRouter } from './trpc/router'
import type { MenuItemConstructorOptions } from 'electron'
import {
  SUPPORTED_LOCALES,
  type LocaleCode,
  normalizeToSupportedLocale,
  DEFAULT_LOCALE_CODE,
} from '@shared/locales'
import { loadMenuBundle } from './i18n/menu-loader'
import { appConfigStore, type ThemePreference } from './store/app-config'
import { is } from '@electron-toolkit/utils'
import { join } from 'node:path'

// Minimal logs only in dev
if (is.dev) {
  // Reduce Chromium log noise in terminal; keep only errors
  app.commandLine.appendSwitch('log-level', 'error')
  // Silence Electron security warning in development only
  process.env.ELECTRON_DISABLE_SECURITY_WARNINGS = 'true'
}

const openDevToolsOnStartup = process.env.OPEN_DEVTOOLS === 'true'

// Enforce OS-wide singleton instance
const hasSingleInstanceLock = app.requestSingleInstanceLock()

// Keep no global window reference; rely on Electron's window management

async function createMainWindow(): Promise<BaseWindow> {
  const INITIAL_WIDTH = 1200
  const ASPECT_RATIO = 16 / 9
  const INITIAL_HEIGHT = Math.round(INITIAL_WIDTH / ASPECT_RATIO)

  // Apply initial theme from config
  const appCfg = await appConfigStore.read()
  const pref: ThemePreference = appCfg.theme
  nativeTheme.themeSource = pref
  const initialIsDark = nativeTheme.shouldUseDarkColors
  const mainWindow = new BaseWindow({
    width: INITIAL_WIDTH,
    height: INITIAL_HEIGHT,
    minWidth: INITIAL_WIDTH,
    minHeight: INITIAL_HEIGHT,
    show: false,
    autoHideMenuBar: true,
    title: app.getName(),
    backgroundColor: initialIsDark ? '#1e1e1e' : '#ffffff',
    // Hide native title bar completely; we'll render our own
    titleBarStyle: 'hidden',
    // Expose window controls overlay on Windows/Linux
    ...(process.platform !== 'darwin'
      ? {
          titleBarOverlay: {
            color: initialIsDark ? '#1e1e1e' : '#ffffff',
            symbolColor: initialIsDark ? '#ffffff' : '#000000',
            height: 32,
          },
        }
      : {}),
  })

  // Hide macOS traffic lights since we render a fully custom title bar
  if (process.platform === 'darwin') {
    try {
      mainWindow.setWindowButtonVisibility(false)
    } catch {}
  }

  const preloadPath = join(import.meta.dirname, '../preload/index.cjs')

  const view = new WebContentsView({
    webPreferences: {
      // Security best practices per Electron
      contextIsolation: true,
      sandbox: true,
      nodeIntegration: false,
      webviewTag: false,
      preload: preloadPath,
    },
  })

  // Set as the content view (auto-sizes to window)
  mainWindow.setContentView(view)

  // Enforce 16:9 aspect ratio (height follows width)
  mainWindow.setAspectRatio(ASPECT_RATIO)

  // Broadcast initial theme to renderer
  view.webContents.on('did-finish-load', () => {
    try {
      view.webContents.send('app:set-theme', nativeTheme.shouldUseDarkColors ? 'dark' : 'light')
    } catch {}
  })

  // Load renderer then show (attach show after awaiting load to avoid race)
  const devUrl = process.env.ELECTRON_RENDERER_URL || process.env.VITE_DEV_SERVER_URL
  try {
    if (is.dev && devUrl) {
      await view.webContents.loadURL(devUrl)
    } else {
      await view.webContents.loadFile(join(import.meta.dirname, '../renderer/index.html'))
    }
  } catch (err) {
    console.error('Renderer failed to load:', err)
  }
  mainWindow.show()
  mainWindow.focus()
  if (is.dev && openDevToolsOnStartup) {
    try {
      view.webContents.openDevTools({ mode: 'detach' })
    } catch {}
  }

  // Clean up to avoid leaks per BaseWindow docs
  mainWindow.once('closed', () => {
    view.webContents.close()
  })

  return mainWindow
}

async function installApplicationMenu(currentLocale: LocaleCode): Promise<void> {
  const isMac = process.platform === 'darwin'
  const L = await loadMenuBundle(currentLocale)
  // Broadcast helper inlined at call sites to avoid unused warnings
  const appSubmenuTemplate: MenuItemConstructorOptions[] = [
    { role: 'about' },
    { type: 'separator' },
    { role: 'quit' },
  ]
  const viewSubmenu: MenuItemConstructorOptions[] = [
    ...(is.dev
      ? [
          {
            label: L.reload,
            accelerator: 'CmdOrCtrl+R',
            click: () => {
              const wc = webContents.getFocusedWebContents()
              if (wc && !wc.isDestroyed()) {
                wc.reload()
              }
            },
          },
          {
            label: L.toggleDevTools,
            accelerator: isMac ? 'Alt+Command+I' : 'Ctrl+Shift+I',
            click: () => {
              const wc = webContents.getFocusedWebContents()
              if (wc && !wc.isDestroyed()) {
                wc.toggleDevTools()
              }
            },
          },
        ]
      : []),
    { role: 'togglefullscreen', label: L.toggleFullscreen },
  ]

  const template: MenuItemConstructorOptions[] = [
    ...(isMac
      ? [
          {
            label: app.getName(),
            submenu: appSubmenuTemplate,
          },
        ]
      : []),
    {
      label: L.view,
      submenu: viewSubmenu,
    },
    {
      label: L.language,
      submenu: SUPPORTED_LOCALES.map(
        (loc): MenuItemConstructorOptions => ({
          label: loc.nativeLabel,
          type: 'radio',
          checked: false,
          id: `lang-${loc.code}`,
          click: () => {
            const code = loc.code as LocaleCode
            void (async () => {
              await appConfigStore.update((c) => ({ ...c, locale: code }))
              // Rebuild menu with new locale labels
              installApplicationMenu(code)
              const m = Menu.getApplicationMenu()
              // Update radio checked states
              for (const l of SUPPORTED_LOCALES) {
                const mi = m?.getMenuItemById(`lang-${l.code}`)
                if (mi) mi.checked = l.code === code
              }
              // Broadcast to all renderers
              for (const wc of webContents.getAllWebContents()) {
                if (!wc.isDestroyed()) wc.send('app:set-locale', code)
              }
            })()
          },
        }),
      ),
    },
  ]

  const menu = Menu.buildFromTemplate(template)
  Menu.setApplicationMenu(menu)
}

// Prefer whenReady().then() per Electron guidance
if (!hasSingleInstanceLock) {
  app.quit()
} else {
  // Focus existing window on secondary launches
  app.on('second-instance', () => {
    const [existingWindow] = BaseWindow.getAllWindows()
    if (existingWindow) {
      if (existingWindow.isMinimized()) existingWindow.restore()
      existingWindow.show()
      existingWindow.focus()
    } else {
      void createMainWindow()
    }
  })

  // macOS: handle file and URL opens early to avoid missing events
  app.on('open-file', (event, path) => {
    event.preventDefault()
    const [existingWindow] = BaseWindow.getAllWindows()
    if (existingWindow) {
      existingWindow.show()
      existingWindow.focus()
    }
    if (is.dev) console.warn('open-file:', path)
  })
  app.on('open-url', (event, url) => {
    event.preventDefault()
    const [existingWindow] = BaseWindow.getAllWindows()
    if (existingWindow) {
      existingWindow.show()
      existingWindow.focus()
    }
    if (is.dev) console.warn('open-url:', url)
  })

  // Only register when we are the primary instance
  app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') {
      app.quit()
    }
  })

  app
    .whenReady()
    .then(async () => {
      // Initialize app locale from persisted config or system
      const appCfg = await appConfigStore.read()
      const initialLocale = normalizeToSupportedLocale(appCfg.locale)
      await installApplicationMenu(initialLocale)
      // Reflect checked menu item based on persisted locale
      const menu = Menu.getApplicationMenu()
      const item = menu?.getMenuItemById(`lang-${initialLocale}`)
      if (item) item.checked = true
      for (const wc of webContents.getAllWebContents()) {
        if (!wc.isDestroyed()) wc.send('app:set-locale', initialLocale)
      }

      // Provide current settings to renderers on demand
      ipcMain.handle('app:get-locale', async () => {
        try {
          const appCfg = await appConfigStore.read()
          return normalizeToSupportedLocale(appCfg.locale)
        } catch {
          return DEFAULT_LOCALE_CODE
        }
      })

      ipcMain.handle('app:get-theme', async () => {
        try {
          const appCfg = await appConfigStore.read()
          return appCfg.theme
        } catch {
          return 'system'
        }
      })

      // tRPC over IPC: route through resolveHTTPResponse to reuse internals
      ipcMain.handle(
        'trpc:invoke',
        async (
          _event,
          req: {
            path: string
            type: 'query' | 'mutation'
            input: unknown
          },
        ) => {
          try {
            const caller = appRouter.createCaller({})
            const getProp = (target: unknown, key: string): unknown => {
              if (target !== null && (typeof target === 'object' || typeof target === 'function')) {
                const rec = target as Record<string, unknown>
                return rec[key]
              }
              return undefined
            }
            const keys = req.path.split('.')
            let node: unknown = caller
            for (const key of keys) {
              const next = getProp(node, key)
              if (typeof next === 'undefined') {
                throw new Error(`Invalid procedure path: ${req.path}`)
              }
              node = next
            }
            if (typeof node !== 'function') throw new Error(`Invalid procedure path: ${req.path}`)
            const invoke = node as (input: unknown) => Promise<unknown> | unknown
            const data = await invoke(req.input)
            return data
          } catch (err: unknown) {
            const message = err instanceof Error ? err.message : 'Unknown error'
            throw new Error(`tRPC IPC invoke failed for ${req.path}: ${message}`)
          }
        },
      )

      // Batch invoke multiple operations in a single IPC roundtrip
      ipcMain.handle(
        'trpc:batchInvoke',
        async (
          _event,
          ops: Array<{
            id: string
            path: string
            type: 'query' | 'mutation'
            input: unknown
          }>,
        ) => {
          const caller = appRouter.createCaller({})
          const getProp = (target: unknown, key: string): unknown => {
            if (target !== null && (typeof target === 'object' || typeof target === 'function')) {
              const rec = target as Record<string, unknown>
              return rec[key]
            }
            return undefined
          }
          const results: Record<string, unknown> = {}
          for (const op of ops) {
            try {
              const keys = op.path.split('.')
              let node: unknown = caller
              for (const key of keys) {
                const next = getProp(node, key)
                if (typeof next === 'undefined')
                  throw new Error(`Invalid procedure path: ${op.path}`)
                node = next
              }
              if (typeof node !== 'function') throw new Error(`Invalid procedure path: ${op.path}`)
              const invoke = node as (input: unknown) => Promise<unknown> | unknown
              results[op.id] = await invoke(op.input)
            } catch (err: unknown) {
              results[op.id] = { error: err instanceof Error ? err.message : 'Unknown error' }
            }
          }
          return results
        },
      )

      // Simple subscription store for async generators
      const subscriptionStore = new Map<string, { cancel: () => void }>()
      ipcMain.on('trpc:subscribe', (event, req: { key: string; path: string; input: unknown }) => {
        void (async () => {
          const caller = appRouter.createCaller({})
          const getProp = (target: unknown, key: string): unknown => {
            if (target !== null && (typeof target === 'object' || typeof target === 'function')) {
              const rec = target as Record<string, unknown>
              return rec[key]
            }
            return undefined
          }
          try {
            let node: unknown = caller
            for (const part of req.path.split('.')) {
              const next = getProp(node, part)
              if (typeof next === 'undefined')
                throw new Error(`Invalid procedure path: ${req.path}`)
              node = next
            }
            if (typeof node !== 'function') throw new Error(`Invalid procedure path: ${req.path}`)
            const invoke = node as (
              input: unknown,
            ) => AsyncIterable<unknown> | Promise<AsyncIterable<unknown>> | unknown
            const maybe = invoke(req.input)
            const isThenable = (v: unknown): v is Promise<unknown> =>
              typeof v === 'object' && v !== null && 'then' in (v as object)
            const resolvedRaw: unknown = isThenable(maybe) ? await maybe : maybe
            let ac: AbortController | null = null
            let iterable: AsyncIterable<unknown>
            if (isObservable(resolvedRaw)) {
              ac = new AbortController()
              iterable = observableToAsyncIterable(resolvedRaw, ac.signal)
            } else {
              iterable = resolvedRaw as AsyncIterable<unknown>
            }
            const hasAsyncIter =
              typeof (iterable as { [Symbol.asyncIterator]?: unknown })[Symbol.asyncIterator] ===
              'function'
            if (!hasAsyncIter) {
              throw new Error('Subscription did not return an AsyncIterable or Observable')
            }
            const iterator = (iterable as AsyncIterable<unknown>)[Symbol.asyncIterator]()
            let cancelled = false
            ;(async () => {
              try {
                while (!cancelled) {
                  const step: IteratorResult<unknown> = await iterator.next()
                  const done: boolean = step.done === true
                  const value: unknown = step.value
                  if (done) break
                  if (!event.sender.isDestroyed())
                    event.sender.send('trpc:subscriptionEvent', {
                      key: req.key,
                      type: 'data',
                      data: value,
                    })
                }
                if (!event.sender.isDestroyed())
                  event.sender.send('trpc:subscriptionEvent', { key: req.key, type: 'complete' })
              } catch (error: unknown) {
                if (!event.sender.isDestroyed())
                  event.sender.send('trpc:subscriptionEvent', {
                    key: req.key,
                    type: 'error',
                    error: error instanceof Error ? error.message : 'Unknown error',
                  })
              } finally {
                subscriptionStore.delete(req.key)
              }
            })().catch(() => {})
            subscriptionStore.set(req.key, {
              cancel: () => {
                cancelled = true
                try {
                  ac?.abort()
                } catch {}
                void iterator.return?.()
              },
            })
          } catch (err: unknown) {
            if (!event.sender.isDestroyed())
              event.sender.send('trpc:subscriptionEvent', {
                key: req.key,
                type: 'error',
                error: err instanceof Error ? err.message : 'Unknown error',
              })
          }
        })()
      })

      ipcMain.on('trpc:unsubscribe', (_event, key: string) => {
        const sub = subscriptionStore.get(key)
        try {
          sub?.cancel()
        } finally {
          subscriptionStore.delete(key)
        }
      })

      // Follow OS appearance when preference is 'system'
      nativeTheme.on('updated', () => {
        void appConfigStore
          .read()
          .then(({ theme }) => {
            if (theme === 'system') {
              const mode = nativeTheme.shouldUseDarkColors ? 'dark' : 'light'
              for (const wc of webContents.getAllWebContents()) {
                if (!wc.isDestroyed()) wc.send('app:set-theme', mode)
              }
            }
          })
          .catch(() => {})
      })

      // Forward renderer-initiated locale changes: persist + broadcast
      ipcMain.on('app:set-locale', (_event, lng: LocaleCode) => {
        void (async () => {
          const next = normalizeToSupportedLocale(lng)
          await appConfigStore.update((c) => ({ ...c, locale: next }))
          await installApplicationMenu(next)
          const menu2 = Menu.getApplicationMenu()
          for (const loc of SUPPORTED_LOCALES) {
            const mi = menu2?.getMenuItemById(`lang-${loc.code}`)
            if (mi) mi.checked = loc.code === next
          }
          for (const wc of webContents.getAllWebContents()) {
            if (!wc.isDestroyed()) wc.send('app:set-locale', next)
          }
        })()
      })

      ipcMain.on('app:set-theme', (_event, pref: ThemePreference) => {
        void (async () => {
          await appConfigStore.update((c) => ({ ...c, theme: pref }))
          nativeTheme.themeSource = pref
          for (const wc of webContents.getAllWebContents()) {
            if (!wc.isDestroyed())
              wc.send('app:set-theme', nativeTheme.shouldUseDarkColors ? 'dark' : 'light')
          }
        })()
      })
      // Ensure AppConfig exists in userData; creates with defaults if missing
      if (is.dev) console.warn('DB URL (userData):', appCfg.dbUrl)
      await createMainWindow()

      app.on('activate', () => {
        if (BaseWindow.getAllWindows().length === 0) {
          void createMainWindow()
        }
      })
    })
    .catch((err) => {
      console.error('app.whenReady() failed:', err)
    })
}
