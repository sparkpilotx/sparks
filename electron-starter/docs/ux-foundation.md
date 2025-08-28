## UX Foundation (Tailwind v4 + Shadcn-style)

This document defines the uniform native UX foundation for the Electron app. It captures the stack, version-pinned docs, global tokens, dark mode model, component patterns, and usage guidelines.

### Goals
- Establish a consistent, native-feeling UI with a minimal but extensible system
- Follow Shadcn-style principles with Tailwind v4 tokens and utilities
- Keep components accessible, themable, and easy to compose

## Stack and versions
- Tailwind v4 core: `tailwindcss@4.1.12` — docs: `https://tailwindcss.com/docs`, v4 post: `https://tailwindcss.com/blog/tailwindcss-v4`
- Tailwind Vite plugin: `@tailwindcss/vite@4.1.11` — `https://github.com/tailwindlabs/tailwindcss/tree/master/packages/@tailwindcss/vite`
- Utilities: `class-variance-authority@0.7.1` (`https://cva.style/docs`), `tailwind-merge@3.3.1` (`https://github.com/dcastil/tailwind-merge`), `clsx@2.1.1` (`https://github.com/lukeed/clsx`)
- UI primitives/icons: `@radix-ui/react-slot@1.2.3` (`https://www.radix-ui.com/primitives/docs/utilities/slot`), `lucide-react@0.541.0` (`https://lucide.dev/guide/packages/lucide-react`)
- Helpers: `react-resizable-panels@3.0.4`, `tw-animate-css@1.3.6`
- App stack: `react@19`, `react-dom@19`, `i18next@25`, `react-i18next@15`, `zustand@5`, `zod@3`

## Design principles
- Tokens-first: centralize colors, radii, fonts via Tailwind v4 `@theme`
- CSS-first: prefer utilities and component classes over bespoke CSS
- Accessible by default: focus rings, ARIA roles, keyboard support
- Deterministic visuals: selection states derive from React state, not library internals
- Desktop-native feel: respect platform conventions, avoid overly webby chrome

## Global tokens and layers
- Tokens and layers live in `src/renderer/globals.css`
  - `@theme`: defines light/dark color roles, radius, fonts
  - `@layer base`: sets `html, body, #root` to `bg-background text-foreground font-sans`, antialiasing, borders
  - `@layer components`: app shell, `titlebar`, `card`, `dialog-*`, `tooltip-content`, layout (`sidebar`, `main-content`), forms
  - `@layer utilities`: e.g., `.ring-focus`

### Examples (classes)
- Titlebar: `.titlebar` (transparent) + bottom border: `border-b border-border`
- Drag regions: `.app-drag`, `.app-no-drag`
- Card: `.card`, `.card__header`, `.card__title`, `.card__content`, `.card__footer`
- Dialog: `.dialog-overlay`, `.dialog-content`
- Tooltip: `.tooltip-content`
- Forms: `.form-group`, `.form-label`, `.form-message`

## Dark mode model
- Global toggle via `html.dark` class
- Persisted preference: `system | light | dark`
- Follows OS when set to `system`

### Implementation
- Main process (`src/main/index.ts`)
  - Loads theme from app config (`src/main/store/app-config.ts`)
  - Sets `nativeTheme.themeSource` and broadcasts changes
  - Listens to OS theme via `nativeTheme.on('updated')`
- Preload (`src/preload/index.ts` and `index.d.ts`)
  - Exposes `getTheme`, `setTheme`, `onSetTheme`
- Renderer entry (`src/renderer/index.tsx`)
  - Applies/removes `document.documentElement.classList.toggle('dark')`
  - Subscribes to theme change events from main

## Component patterns
- Theme control (tri-state) in `src/renderer/src/components/layout/title-bar.tsx`
  - ARIA `radiogroup` with three `button[role="radio"]`: System, Light, Dark
  - Visual state reflects user preference only (no implicit OS-highlight)
  - Uses tokenized utilities: `bg-primary`, `text-primary-foreground`, subtle hover states
- Global patterns in `globals.css` (see above)

## Reusable variants (CVA)
- `src/renderer/src/lib/variants.ts`
  - `buttonVariants`: variants = default | destructive | outline | secondary | ghost | link; sizes = default | sm | lg | icon | icon-sm
  - `toggleVariants`: variants = default | outline | ghost | subtle; sizes = default | sm | lg | icon | icon-sm; `selected: boolean`
  - `inputVariants`: sizes = default | sm | lg

### Usage
```tsx
import { buttonVariants, toggleVariants } from '@lib/variants'

<button className={buttonVariants({ variant: 'outline', size: 'sm' })}>
  Action
</button>

<button className={toggleVariants({ size: 'icon-sm', selected: true })}>
  T
</button>
```

## CSP and dev ergonomics
- Dev CSP adjusted in `electron.vite.config.ts` for Vite HMR and React preamble (adds `'unsafe-inline'` + strips meta CSP in dev)
- Security warnings silenced only in dev; production CSP remains strict

## Conventions
- Prefer token roles over raw colors
- Prefer `variants.ts` for shared component styles
- Avoid relying on library-specific `data-*` states for selection visuals when not needed
- Keep hover/active/focus feedback subtle and consistent

## Checklist
- Tokens render correctly in light and dark
- Titlebar is border-separated (no background), toolbar controls are borderless
- Theme preference persists and reacts to OS changes when set to `system`
- Buttons/inputs use CVA variants
- No ESLint/TS errors; Prettier formatted

## Future work
- Add documented spacing/typography scales (8pt system)
- Compose more primitives (Tabs, Tooltip triggers, Toolbar groups)
- Provide examples for forms, lists, and resizable layouts
