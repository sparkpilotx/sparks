import { resolve } from 'path'
import { defineConfig, externalizeDepsPlugin } from 'electron-vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

/**
 * Electron-Vite configuration for electron-starter desktop application.
 *
 * This configuration defines build settings for the three main processes:
 * - main: Main Electron process (Node.js environment)
 * - preload: Preload scripts (Node.js environment with limited APIs)
 * - renderer: Renderer process (browser environment with React)
 *
 * @remarks
 * The configuration follows Electron's security model by externalizing Node.js
 * dependencies in main/preload processes and isolating renderer process.
 *
 * @see {@link https://electron-vite.org/guide/} Electron-Vite documentation
 */
export default defineConfig({
  /**
   * Main process configuration (Node.js environment)
   * Handles app lifecycle, window management, and system integration
   */
  main: {
    build: {
      rollupOptions: {
        output: {
          format: 'es',
        },
      },
    },
    resolve: {
      alias: {
        // Shared utilities accessible to main and preload processes
        '@shared': resolve('src/main/shared'),
      },
    },
    plugins: [
      // Externalizes Node.js dependencies to avoid bundling issues
      externalizeDepsPlugin(),
    ],
  },

  /**
   * Preload process configuration (Node.js environment with limited APIs)
   * Provides secure bridge between main and renderer processes
   */
  preload: {
    resolve: {
      alias: {
        // Shared utilities accessible to main and preload processes
        '@shared': resolve('src/main/shared'),
      },
    },
    plugins: [
      // externalizeDepsPlugin() is removed to bundle deps for sandbox
    ],
    build: {
      // Keep existing files when running sequential per-entry builds
      emptyOutDir: false,
      rollupOptions: {
        input: {
          index: resolve('src/preload/index.ts'),
        },
        output: {
          // Preload scripts for sandboxed renderers must not contain ES module syntax.
          // Use 'cjs' so preload works with sandbox: true.
          format: 'cjs',
          entryFileNames: '[name].cjs',
          ...(process.env.PRELOAD_ENTRY
            ? { inlineDynamicImports: true }
            : { manualChunks: () => undefined }),
        },
      },
    },
  },

  /**
   * Renderer process configuration (browser environment)
   * Handles UI rendering with React and TailwindCSS
   */
  renderer: {
    // Development server configuration
    server: {
      host: 'localhost', // Restrict to localhost only for security
      headers: {
        // Dev-only CSP to support Vite HMR while keeping production strict
        'Content-Security-Policy': [
          "default-src 'self'",
          "base-uri 'none'",
          "object-src 'none'",
          "frame-ancestors 'none'",
          "script-src 'self' 'unsafe-eval'",
          "style-src 'self' 'unsafe-inline'",
          "img-src 'self' data: blob:",
          "font-src 'self' data:",
          "connect-src 'self' ws://localhost:* http://localhost:*",
          "form-action 'none'",
          "media-src 'self'",
          "worker-src 'self' blob:",
        ].join('; '),
      },
      proxy: {
        // TODO(proxy): Add API proxy configuration for development | tracking: TBD
      },
    },

    // Production build configuration
    build: {
      rollupOptions: {
        input: {
          index: resolve('src/renderer/index.html'),
        },
      },
    },

    resolve: {
      alias: {
        // Shared utilities accessible across processes
        '@shared': resolve('src/main/shared'),
        // Renderer aliases
        '@components': resolve('src/renderer/src/components'),
        '@hooks': resolve('src/renderer/src/hooks'),
        '@stores': resolve('src/renderer/src/stores'),
      },
    },

    plugins: [
      // React Fast Refresh for development
      react(),
      // TailwindCSS with JIT compilation
      tailwindcss(),
    ],
  },
})
