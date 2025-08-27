import { app, BaseWindow, WebContentsView, nativeTheme, Menu, webContents } from 'electron'
import type { MenuItemConstructorOptions } from 'electron'
import { is } from '@electron-toolkit/utils'
import { join } from 'node:path'
import { dbConfigStore } from './store/db-config'

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

function installApplicationMenu(): void {
  const isMac = process.platform === 'darwin'
  const appSubmenuTemplate: MenuItemConstructorOptions[] = [
    { role: 'about' },
    { type: 'separator' },
    { role: 'quit' },
  ]
  const viewSubmenu: MenuItemConstructorOptions[] = [
    ...(is.dev
      ? [
          {
            label: 'Reload',
            accelerator: 'CmdOrCtrl+R',
            click: () => {
              const wc = webContents.getFocusedWebContents()
              if (wc && !wc.isDestroyed()) {
                wc.reload()
              }
            },
          },
          {
            label: 'Toggle Developer Tools',
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
    { role: 'togglefullscreen' },
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
      label: 'View',
      submenu: viewSubmenu,
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
      installApplicationMenu()
      // Ensure DB URL exists in userData; creates with defaults if missing
      const dbConfig = await dbConfigStore.read()
      if (is.dev) console.warn('DB URL (userData):', dbConfig.dbUrl)
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
