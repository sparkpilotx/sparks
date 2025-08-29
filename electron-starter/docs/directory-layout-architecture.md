# Directory Layout Architecture

This section defines how the codebase is structured and the responsibilities of each layer.  
The goal is to keep concerns well separated, enforce safe communication between processes,  
and ensure the code remains maintainable and scalable as the project grows.

## High-Level Structure

- `src/`
  - `main/` : application lifecycle & window management (Electron main process)
    - `shared/` : platform-agnostic code shared across main, preload, and renderer
      - `i18n/` : single-source translations (locales/<code>/*.json)
    - `i18n/` : main-only i18n helpers
    - `index.ts` : entry for Electron main process
    - `trpc/` : tRPC server layer exposing typed procedures to the renderer via IPC
      - `router.ts` : defines `appRouter` (queries/mutations/subscriptions) consumed over IPC

  - `preload/` : secure bridge between main and renderer (contextIsolation + contextBridge)
    - `index.d.ts` : preload type definitions
    - `index.ts` : preload script entry

  - `renderer/` : UI layer (React + Tailwind, runs in browser context)
    - `index.html` : HTML template
    - `index.tsx` : renderer entry point
    - `src/`
      - `globals.css` : global styling baseline
      - `components/`
        - `ui/` : reusable UI primitives
        - `layout/` : layout components (navigation, shell, etc.)
      - `hooks/` : React hooks (custom logic like useTheme, useShortcut)
      - `store/` : state management (e.g., zustand slices, context)
      - `lib/` : renderer-side utilities (helpers, constants)
        - `cn.ts` : className composition (clsx + tailwind-merge)
        - `trpc.ts` : QueryClient setup for data caching (tRPC used via 
        preload bridge)
      - `i18n/` : renderer i18n bootstrap (init, resources loader, types)
      - `services/` : API calls or IPC-based services
      - `app.tsx` : root React component
- `package.json` : project metadata and scripts
- `package-lock.json` : exact dependency lockfile
- `electron.vite.config.ts` : Vite + Electron build configuration
- `electron-builder.yml` : Electron Builder packaging configuration
- `eslint.config.mjs` : ESLint v9 flat configuration
- `tsconfig.json` : base TypeScript configuration
- `tsconfig.node.json` : Node/Electron main process TypeScript configuration
- `tsconfig.web.json` : renderer/web TypeScript configuration
- `.prettierrc.json` : Prettier configuration
- `.prettierignore` : Prettier ignore patterns

## Other Conventions
- Filenames **kebab-case**.