# Portfolio - Claude Code Instructions

## Project Overview

Student portfolio website (Enzo Morello) — React SPA with TypeScript, React Router v6, i18n (FR/EN), PWA support, and a rich ambient/mood visual system.

## Commands

```bash
npm run dev          # Dev server (port 3000, HMR)
npm run typecheck    # TypeScript check (no emit)
npm run build        # Build + SEO file generation
npm run preview      # Preview build (port 8080)
npm run test         # Vitest unit tests
npm run test:e2e     # Playwright e2e tests
npm run format       # Prettier (src/**/*.{ts,tsx,css,html})
npm run deploy       # Cloudflare Worker deploy
```

Always run `npm run typecheck` before committing.

## Architecture

### Entry Points
- [src/main.tsx](src/main.tsx) — Bootstrap: `AccessibilityProvider`, `MoodProvider`, `ToastProvider`
- [src/index.html](src/index.html) — SPA template (Vite root, external CDN scripts, SW registration)
- [src/App.tsx](src/App.tsx) — BrowserRouter + lazy routes + Suspense
- [src/components/Layout.tsx](src/components/Layout.tsx) — Shared shell (header, footer, ambient layers, hero config)

### Key Directories
- `src/components/` — UI components (PascalCase.tsx)
- `src/components/ambient/` — 22 ambient visual components + mood-specific SVG commuters
- `src/pages/` — 13 routed pages
- `src/contexts/` — React contexts (Mood, Accessibility, Toast, ReadingTime, PerformanceTier)
- `src/hooks/` — Custom hooks (camelCase.ts)
- `src/scripts/` — Legacy TS modules (music-player, effects, ui-enhancements, lightbox)
- `src/utils/` — Utilities (assetPath, discoverMusicTracks, performanceTier, safeStorage)
- `src/styles/` — CSS modules; `main.css` imports all; 38 files total
- `src/locales/` — `fr.json` (default), `en.json`

### Routes
`/`, `/projets`, `/projets-personnels`, `/projet-MEGASAE`, `/projet-SAE12`, `/projet-SAE3`, `/projet-SAE4`, `/projet-SAE56`, `/projet-SAE3.01`, `/about`, `/credits`, `/informations-legales`, `*`

## Common Patterns

### Add a page route
1. Create `src/pages/ProjetNew.tsx`
2. Lazy import + register route in [src/App.tsx](src/App.tsx)
3. Add card/link in `Projets.tsx` or `ProjetsPersonnels.tsx`
4. Add i18n keys in `src/locales/fr.json` and `src/locales/en.json`
5. Call `useDocumentMeta('Title', 'Description')` in the page

### Per-page SEO
```tsx
import useDocumentMeta from '@/hooks/useDocumentMeta';
useDocumentMeta('Page title', 'Page description');
```

### Mood system
- Applied via `body[data-mood="..."]`
- 6 moods: `default`, `hacker`, `vaporwave`, `europa`, `industrial`, `nightshade`
- Persisted key: `portfolio-mood`

### Legacy module bridge
```tsx
const trackFiles = discoverMusicTracks();
usePortfolioModules(trackFiles);
```

### Asset paths
```tsx
import { assetPath } from '@/utils/assetPath';
// Use absolute public paths: /assets/...
```

## Toolchain
- Vite 8 — `root: src`, `publicDir: ../public`, `outDir: ../dist`
- TypeScript strict mode
- Path alias: `@/` → `src/`
- React 18, React Router v6, Framer Motion, i18next, react-i18next
- Testing: Vitest + Testing Library (unit), Playwright (e2e)
- Node: `^20.19.0 || >=22.12.0`

## Conventions
- Language: French UI copy by default 
- Components: `PascalCase.tsx`
- Hooks/utils/scripts: `camelCase.ts`
- CSS: `_kebab-case.css`
- Prefer path aliases (`@/`) over long relative imports
- Prefer semantic HTML + ARIA
- Prefer SVG icons over emojis in UI

## Windows / Shell Notes
- Shell in this project: **bash** (Git Bash / WSL) — use Unix syntax
- Use forward slashes in file paths: `c:/Users/enzom/...`
- Built-in Grep/Glob tools are preferred over shell commands for file search
