import { app, BaseWindow, WebContentsView, nativeTheme } from 'electron'
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
  })

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

  app
    .whenReady()
    .then(async () => {
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

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit()
  }
})
