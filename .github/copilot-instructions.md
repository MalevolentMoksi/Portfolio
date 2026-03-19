# P2.01 Portfolio - AI Coding Agent Instructions

## Project Overview

Modern student portfolio website built as a React SPA.
Current architecture (2026): TypeScript React app with React Router v6, legacy TypeScript modules for music/effects/lightbox/UI enhancements, modular CSS, i18n (FR/EN), accessibility controls, and PWA support.

## Critical Architecture: TypeScript SPA + Legacy Modules

### Application Core
- `src/main.tsx` - React entry point and global providers (`AccessibilityProvider`, `MoodProvider`, `ToastProvider`)
- `src/index.html` - SPA template (Vite root file, external scripts, service-worker registration)
- `src/App.tsx` - BrowserRouter + lazy routes + Suspense fallback
- `src/components/Layout.tsx` - Shared shell (header/footer/background), ambient layers, route-configured hero/meta

### Current Route Paths
- `/`
- `/projets`
- `/projets-personnels`
- `/projet-MEGASAE`
- `/projet-SAE12`
- `/projet-SAE3`
- `/projet-SAE4`
- `/projet-SAE56`
- `/projet-SAE3.01`
- `/about`
- `/credits`
- `*` (NotFound)

### Components (`src/components/`)
Main UI includes:
- `Layout.tsx` (shell + header + actions + ambient + footer)
- `Footer.tsx`, `BackToTopButton.tsx`, `Breadcrumbs.tsx`, `HamburgerMenu.tsx`
- `LanguageButton.tsx` (FR/EN switch)
- `AccessibilityButton.tsx` (no-motion, contrast, font-size, dyslexia font)
- `MoodSwitcher.tsx`, `ParticlesButton.tsx`, `MiniTerminal.tsx`
- `ContactForm.tsx`, `FilterBar.tsx`, `ProjectPagination.tsx`, `Loading.tsx`, `SnakeGame.tsx`, etc.
- `pet/PetButton.tsx` (entry point for pet subsystem)

### Ambient Components (`src/components/ambient/`)
18 components, including:
- `AmbientEffects.tsx` (orchestrator)
- `FooterDiorama.tsx`
- `AmbientBoids.tsx`, `DigitalRain.tsx`, `EuropaSnowfall.tsx`, `IndustrialNeons.tsx`, `ElectricalGrid.tsx`, etc.

### Pages (`src/pages/`)
12 routed pages:
- `Home.tsx`, `Projets.tsx`, `ProjetsPersonnels.tsx`
- `ProjetMEGASAE.tsx`, `ProjetSAE12.tsx`, `ProjetSAE3.tsx`, `ProjetSAE301.tsx`, `ProjetSAE4.tsx`, `ProjetSAE56.tsx`
- `About.tsx`, `Credits.tsx`, `NotFound.tsx`

### Contexts (`src/contexts/`)
- `MoodContext.tsx` - visual mood state (`default`, `hacker`, `vaporwave`, `europa`, `industrial`)
- `ReadingTimeContext.tsx` - reading-time provider
- `ToastContext.tsx` - toast API (`showToast`) + global bridge for legacy scripts
- `AccessibilityContext.tsx` - persisted a11y settings

### Hooks (`src/hooks/`)
- `useDocumentMeta.ts` - sets page `<title>` + meta description
- `usePortfolioModules.ts` - lazy/controlled init of legacy modules
- `useReadingTimeEstimate.ts` - reading-time estimation

### Utilities (`src/utils/`)
- `assetPath.ts` - base-aware asset path helper
- `discoverMusicTracks.ts` - auto-discovers `.m4a` and `.mp3` from `public/assets/music/`
- `performanceTier.ts` - performance tier + optional FPS-based degradation
- `safeStorage.ts` - safe local/session storage wrappers

### Legacy Modules (`src/scripts/`)
- `music-player.ts` - persistent audio player + ID3 metadata + keyboard shortcuts
- `effects.ts` - particles + parallax + mood/perf adaptation
- `ui-enhancements.ts` - typing effect, email glitch, footer clock, video hover, back-to-top
- `lightbox.ts` - zoomable image lightbox + keyboard navigation/focus trap

### Styles (`src/styles/`)
- `main.css` imports all CSS modules
- Core: `_variables.css`, `_base.css`, `_layout.css`, `_typography.css`, `_effects.css`
- Components: 29 files in `src/styles/components/`
- Total CSS files: 35

## Toolchain and Build Details

- Vite 8 (`vite.config.ts`)
- React plugin + Vite PWA plugin
- `root: src`, `publicDir: ../public`, `outDir: ../dist`
- TypeScript strict mode (`tsconfig.json`)
- Node engines: `^20.19.0 || >=22.12.0`
- Build target: ES2020 + browser targets configured in Vite

## Key Implementation Patterns

### Routing + Layout
```tsx
// App.tsx: lazy pages + shared Layout route
<Routes>
  <Route element={<Layout />}>
    <Route index element={<Home />} />
    ...
  </Route>
  <Route path="*" element={<NotFound />} />
</Routes>
```

### Per-page SEO
```tsx
import useDocumentMeta from '@/hooks/useDocumentMeta';

useDocumentMeta('Page title', 'Page description');
```

### Legacy Module Bridge
```tsx
const trackFiles = discoverMusicTracks();
usePortfolioModules(trackFiles);
```

### Mood System
- Mood is applied via `body[data-mood="..."]`
- Persisted key: `portfolio-mood`
- `MoodSwitcher` cycles across 5 moods

### Music Player Persistence
Main localStorage keys:
- `music-currentTrack`
- `music-currentTime`
- `music-isPaused`
- `music-volume`
- `music-muted`
- `music-retracted`

Notes:
- First visit defaults to paused
- Position writes are throttled (~1 write/sec)
- ID3 metadata uses `jsmediatags` loaded from CDN

### Pet Subsystem (`src/components/pet/`)
- Main entry: `PetButton.tsx`
- Movement/drag: `WanderingPet.tsx`
- Face animation: `RobotFace.tsx` (Framer Motion)
- Thought bubbles: `ThoughtBubbleQueue.tsx`
- Constants/helpers: `petConstants.ts`, `petData.tsx`
- Includes achievements and catch mini-game
- Debug helpers available on `window`: `petReact`, `getPetStats`

## Conventions

- Language: French UI copy by default, English translation available
- React components: `PascalCase.tsx`
- Hooks/utils/scripts: `camelCase.ts`
- CSS files: `_kebab-case.css`
- Prefer path aliases over long relative imports
- Use absolute public asset paths in UI (`/assets/...`)
- Prefer semantic HTML + ARIA where relevant
- Prefer SVG icons over emojis for UI iconography

## Windows Development Environment

### CRLF Line Endings (CRITICAL)
All source files must use **CRLF (Windows) line endings**, not LF. This is required for proper tooling operation.

**Why**: Replace tools on Windows expect CRLF. LF files show confusing diffs like `+0 -418` (appears to replace entire file) and can cause edits to fail.

**To convert a file to CRLF**:
```powershell
$f = "path/to/file.ts"
$c = [System.IO.File]::ReadAllText($f)
[System.IO.File]::WriteAllText($f, ($c -replace "`n", "`r`n"), [System.Text.Encoding]::UTF8)
```

### PowerShell CLI Alternatives
On Windows, use PowerShell cmdlets instead of Unix-style tools:
- **Instead of `rg` (ripgrep)**: Use `Select-String -Path "**/*.ts" -Pattern "pattern"`
- **Instead of `ls`**: Use `Get-ChildItem` or `Get-ChildItem -Recurse -Filter "*.ts"`
- **File discovery**: Use `Get-ChildItem -Path "src" -Recurse -Filter "*.tsx"`
- **Text search in file**: `Select-String -Path "file.ts" -Pattern "text"`

Example:
```powershell
# Find all TypeScript files with a specific pattern
Get-ChildItem -Path "src" -Recurse -Filter "*.ts" | Select-String -Pattern "useEffect" | Select-Object Path, LineNumber, Line
```

### File Path Conventions
- Prefer **forward slashes** (`/`) in paths instead of backslashes (`\`)
- Use forward slashes in absolute paths passed to tools: `c:/Users/enzom/Documents/.../file.ts`
- Avoids escaping issues and ensures cross-platform compatibility

## Common Development Tasks

### Add a new page route
1. Create `src/pages/ProjetNew.tsx`
2. Lazy import and register route in `src/App.tsx`
3. Add card/link in `Projets.tsx` or `ProjetsPersonnels.tsx`
4. Add i18n keys in `src/locales/fr.json` and `src/locales/en.json`
5. Set page meta with `useDocumentMeta`

### Add music tracks
1. Add `.m4a` or `.mp3` files in `public/assets/music/`
2. No code change required (`discoverMusicTracks()` handles discovery)

### Update styles
- Global variables: `src/styles/_variables.css`
- Component-specific rules: `src/styles/components/...`
- Keep imports centralized in `src/styles/main.css`

## Testing Workflow

1. `npm run dev` (local dev, HMR, port 3000)
2. `npm run typecheck`
3. `npm run build`
4. `npm run preview` (port 8080)

Key checks:
- Route transitions and hero config in `Layout.tsx`
- Mood switch updates visual system and favicon
- Music player persists state across route changes
- Accessibility toggles affect visuals/typography as expected
- FR/EN translations resolve correctly
- Build output and SPA fallback behavior in production

## Deployment

### GitHub Pages
Workflow file: `.github/workflows/deploy-pages.yml`
- Installs dependencies
- Runs typecheck + build
- Creates `dist/404.html` fallback
- Deploys Pages artifact


## Critical File Reference

| File | Purpose |
|------|---------|
| `vite.config.ts` | Vite + aliases + PWA + build settings |
| `src/main.tsx` | App bootstrap and global providers |
| `src/App.tsx` | Router orchestration and lazy routes |
| `src/components/Layout.tsx` | Shared shell, header actions, ambient layers |
| `src/hooks/usePortfolioModules.ts` | Legacy module initialization bridge |
| `src/scripts/music-player.ts` | Persistent audio player |
| `src/scripts/effects.ts` | Particles/parallax/mood effects |
| `src/contexts/AccessibilityContext.tsx` | Accessibility state and body class application |
| `src/contexts/MoodContext.tsx` | Mood cycling + persistence |
| `src/locales/fr.json` | French translations |
| `src/locales/en.json` | English translations |
