# Core Tech Stack & Conventions

## Platform
- `electron@37.3.1`
- `@electron-toolkit/utils@4.0.0`

## Language & Types
- `typescript@5.8.3`

## UI & Styling
- `react@19.1.1`
- `tailwindcss@4.1.12`
- `@tailwindcss/vite@4.1.12`
- `class-variance-authority@0.7.1`
- `tailwind-merge@3.3.1`
- `tw-animate-css@1.3.7`

## State & Validation
- `zustand@5.0.8`
- `immer@10.1.1`
- `zod@3.25.67`

## Internationalization (i18n)
- `i18next@23.x` + `react-i18next@14.x` (renderer)
- Single source of truth: JSON under `src/main/shared/i18n/locales/<code>/`
  - `common.json` (renderer UI)
  - `menu.json` (Application Menu labels, loaded in main via `import.meta.glob`)
- Locale owned by main, persisted in `app-config.json`
- Renderer lazy-loads bundles via `import.meta.glob` with `en-US` fallback

## Data Layer
- `prisma@6.14.0`
- `@prisma/client@6.14.0`

## RPC & Data Fetching
- `@trpc/server@11.5.0`
- `@trpc/client@11.5.0`
- `@trpc/tanstack-react-query@11.5.0`
- `superjson@2.2.2`

## Build & Dev Tooling
- `vite@7.1.3`
- `electron-vite@4.0.0`
- `@vitejs/plugin-react@5.0.1`
- `@electron-toolkit/tsconfig@1.0.1`

## Module Format & Runtime Constraints
- **ESM-only** for source and runtime.
- **Exception:** preload bundle may emit **CommonJS** to support `sandbox: true`.
- Do **not** use CommonJS elsewhere at runtime.

## Linting & Formatting
- `eslint@9.34.0`
- `@typescript-eslint/eslint-plugin@8.41.0`
- `@typescript-eslint/parser@8.41.0`
- `prettier@3.6.2`

## Packaging & Distribution
- `electron-builder@26.0.12`