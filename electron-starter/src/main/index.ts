import { app, BaseWindow, WebContentsView, nativeTheme, Menu, webContents, ipcMain } from 'electron'
import type { MenuItemConstructorOptions } from 'electron'
import {
  SUPPORTED_LOCALES,
  type LocaleCode,
  normalizeToSupportedLocale,
  DEFAULT_LOCALE_CODE,
} from '@shared/locales'
import { loadMenuBundle } from './i18n/menu-loader'
import { appConfigStore } from './store/app-config'
import { is } from '@electron-toolkit/utils'
import { join } from 'node:path'

// Minimal logs only in dev
if (is.dev) {
  app.commandLine.appendSwitch('enable-logging')
}

// Enforce OS-wide singleton instance
const hasSingleInstanceLock = app.requestSingleInstanceLock()

// Keep no global window reference; rely on Electron's window management

async function createMainWindow(): Promise<BaseWindow> {
  const INITIAL_WIDTH = 1200
  const ASPECT_RATIO = 16 / 9
  const INITIAL_HEIGHT = Math.round(INITIAL_WIDTH / ASPECT_RATIO)

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
  if (is.dev) {
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
      const config = await appConfigStore.read()
      const initialLocale = normalizeToSupportedLocale(config.locale)
      await installApplicationMenu(initialLocale)
      // Reflect checked menu item based on persisted locale
      const menu = Menu.getApplicationMenu()
      const item = menu?.getMenuItemById(`lang-${initialLocale}`)
      if (item) item.checked = true
      for (const wc of webContents.getAllWebContents()) {
        if (!wc.isDestroyed()) wc.send('app:set-locale', initialLocale)
      }

      // Provide current locale to renderers on demand
      ipcMain.handle('app:get-locale', async () => {
        try {
          const cfg = await appConfigStore.read()
          return normalizeToSupportedLocale(cfg.locale)
        } catch {
          return DEFAULT_LOCALE_CODE
        }
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
      // Ensure AppConfig exists in userData; creates with defaults if missing
      const appCfg = await appConfigStore.read()
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
