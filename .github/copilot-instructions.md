# P2.01 Portfolio - AI Coding Agent Instructions

## Project Overview

Modern student portfolio website (React SPA). **Feb 2026 Architecture**: Single-page React application with React Router v6, legacy JS modules for effects/music, and modular CSS. Features persistent music player, particle effects, interactive UI, responsive gallery with lightbox.

## Critical Architecture: React SPA + Legacy Modules

### Application Core
- **`src/main.jsx`** - React entry point (renders `<App />` to DOM)
- **`src/index.html`** - Single SPA template
- **`src/App.jsx`** - Route definition (BrowserRouter + 8 routes via React Router v6)
- **Routing paths**: `/`, `/projets`, `/projets-personnels`, `/projet-MEGASAE/SAE12/SAE3/SAE4/SAE56`
- **Layout.jsx** - Shared header/footer wrapping all pages via `<Outlet />`

### Components (`src/components/`)
- **`Layout.jsx`** - Main shell: header, footer, `<Outlet />`, initializes legacy modules
- **`Footer.jsx`** - Site footer
- **`BackToTopButton.jsx`** - Scroll-to-top button (appears at scrollY > 300px)
- **`Breadcrumbs.jsx`** - Auto breadcrumb trail from React Router location
- **`HamburgerMenu.jsx`** - Mobile nav drawer
- **`MoodSwitcher.jsx`** - Cycles site colour mood (`data-mood` on `<body>`); reads/writes `MoodContext`
- **`ParticlesButton.jsx`** - Toggles particles.js canvas on/off
- **`PetButton.jsx`** - Interactive robot companion: wanders the page, draggable, HUD with hunger/happiness stats, reactions, floating thought bubbles. localStorage keys: `pet-hunger`, `pet-happiness`, `pet-spawned`.
- **`MiniTerminal.jsx`** - Decorative in-header terminal widget
- **`ContactForm.jsx`** - Formspree-backed contact form
- **`FilterBar.jsx`** - Tag/category filter bar for project listings
- **`Loading.jsx`** - Full-page loading spinner
- **`ProjectPagination.jsx`** - Pagination controls for project lists
#### Ambient Effects (`src/components/ambient/`)
- Collection of lightweight visual components used as page-level ambient layers. Examples include: `AmbientBoids.jsx`, `DigitalRain.jsx`, `EuropaSnowfall.jsx`, `FloatingGeometry.jsx`, `IndustrialNeons.jsx`, `ElectricalGrid.jsx`, `FooterWalkers.jsx`, and more (17+ components). These components render canvas/SVG layers and respect performance-tier detection to avoid heavy rendering on low-end devices.

### Pages Directory (`src/pages/*.jsx`)
12 React components: `Home.jsx`, `Projets.jsx`, `ProjetsPersonnels.jsx`, `ProjetMEGASAE.jsx`, `ProjetSAE12.jsx`, `ProjetSAE3.jsx`, `ProjetSAE301.jsx`, `ProjetSAE4.jsx`, `ProjetSAE56.jsx`, `About.jsx`, `Credits.jsx`, `NotFound.jsx`

### Custom Hooks (`src/hooks/`)
- **`useDocumentMeta(title, description)`** - Updates `<title>` and `<meta description>` per page (SEO)
- **`usePortfolioModules(trackFiles)`** - Lazy-initializes legacy JS modules (music-player, effects, ui-enhancements, lightbox) on route change
- **`useReadingTimeEstimate()`** - Estimates reading time for the current page content

### Contexts (`src/contexts/`)
- **`MoodContext.jsx`** - Provides `{ mood, setMood }` globally; `MoodSwitcher` writes, components can read
- **`ReadingTimeContext.jsx`** - Provides estimated reading time to page components via `ReadingTimeProvider` (wraps `<Outlet />` in Layout)
- **`ToastContext.jsx`** - Provides toast notification API (`showToast`, `hideToast`) used by components and legacy modules; toasts are used for UX feedback and lightweight alerts.

### Utils (`src/utils/`)
- **`assetPath.js`** - `getAssetPath(path)` helper — prepends correct base URL for asset references
- **`discoverMusicTracks.js`** - `discoverMusicTracks()` — returns the list of `.m4a` filenames from `public/assets/music/` at build time; used in `Layout.jsx` instead of a hardcoded array
 - **`performanceTier.js`** - `getPerformanceTier()` returns a performance tier (`low|medium|high`) used to gate heavy ambient effects and particle layers to keep FPS acceptable on low-end devices

### Legacy JavaScript Modules (`src/scripts/`)
These coexist with React, initialized via `usePortfolioModules` hook in `Layout.jsx`:
- **`music-player.js`** - Persistent audio, localStorage state throttling (1 write/sec)
- **`effects.js`** - particles.js integration, parallax, mouse tracking
- **`ui-enhancements.js`** - Typing animation (#main-title), email glitch (.local-part), back-to-top (#back-to-top), video hover
- **`lightbox.js`** - Gallery zoom for `.zoomable` class images

### CSS Modules (`src/styles/`)
- **`main.css`** - Central import that bundles all via `@import`
- **Core**: `_variables.css` (CSS custom properties), `_base.css`, `_layout.css`, `_typography.css`, `_effects.css`
- **Components** (17 files): `_header.css`, `_footer.css`, `_buttons.css`, `_music-player.css`, `_projects.css`, `_personal-projects.css`, `_breadcrumbs.css`, `_contact-form.css`, `_filter-bar.css`, `_hamburger-menu.css`, `_lightbox.css`, `_loading.css`, `_mini-terminal.css`, `_mood-switcher.css`, `_particles-button.css`, `_pet-button.css`, `_project-pagination.css`
- **Dark theme**: Gold accent (#d4af37), CSS variables centralized

### Assets (`public/assets/`)
- Images: `public/assets/images/` + `drawings/` subfolder
- Music: `public/assets/music/` (auto-discovered by `discoverMusicTracks()`)
- Videos: `public/assets/videos/`
- Pet sprites: `public/assets/pet/`

## Key Implementation Patterns

### React + React Router
```jsx
// App.jsx defines routes; Layout.jsx wraps with <Outlet />
// All pages live in src/pages/ and are route components
// Navigation: use React Router <Link> or `useNavigate()` hook
```

### Meta Tags & SEO
```jsx
// Each page calls useDocumentMeta() to set title/description:
import useDocumentMeta from '@/hooks/useDocumentMeta.js';
export default Home = () => {
  useDocumentMeta('Home | Portfolio', 'Student portfolio...');
  return <section>...</section>;
};
```

### Legacy Module Initialization (React Integration)
```jsx
// Layout.jsx initializes legacy JS modules once on mount:
// trackFiles are auto-discovered at build time via discoverMusicTracks()
const trackFiles = discoverMusicTracks();
usePortfolioModules(trackFiles);
// This creates singleton instances (musicPlayerInstance, visualEffectsInstance)
// Modules reinitialize on route change (useEffect in usePortfolioModules)
```

### Header Action Buttons (right slot in `<header>`)
Four interactive widgets live in `.header--actions` inside `Layout.jsx`:
1. **`MoodSwitcher`** — cycles `data-mood` attribute on `<body>` between `default`, `hacker`, `vaporwave`; CSS variables in `_variables.css` respond to each mood
2. **`ParticlesButton`** — toggles the particles.js canvas (`#particles-js`)
3. **`PetButton`** — spawns/recalls the wandering robot; see Pet section below
4. **`MiniTerminal`** — decorative terminal panel

### Pet Subsystem (`src/components/pet/`)
- The pet moved to its own submodule directory and is implemented as a small subsystem of coordinated components and utilities.
- Key files: `PetButton.jsx` (entry & HUD), `WanderingPet.jsx` (movement + RAF loop), `RobotFace.jsx` (SVG face with Framer Motion mouth paths), `ThoughtBubbleQueue.jsx`, `petConstants.js`, `petData.jsx`, plus gameplay widgets like `AchievementsPanel.jsx` and `CatchGame.jsx`.
- **Wandering**: RAF loop, organic steering; cursor magnet/repulsion varies with mood
- **Dragging**: pointer-capture drag; `scared` reaction when moved >4 px, `excited` on release; aggressive drags apply scale + spin (fast drag threshold ~8 px/frame)
- **Stats**: `hunger` + `happiness` (0–100), initialized ~50% (±5%), decay every ~8s while spawned
- **localStorage keys**: `pet-hunger`, `pet-happiness`, `pet-spawned`
- **Reactions**: expressions (`scared`, `excited`, `woozy`, `dizzy`, `eat`, `petted`, `play`) — `woozy` fires on spawn
- **HUD**: click pet (without dragging) opens dialog with mood badge, stat bars, and action buttons (`Feed`, `Câliner`, `Jouer`) with cooldowns
- **Thought bubbles**: SVG icons (`heart`, `star`, `note`, `bolt`, `zzz`, `dots`, `exclaim`) float above the robot via `ThoughtBubbleQueue.jsx`
- **Face**: `RobotFace.jsx` supplies eyes/pupils that follow the cursor and morphing mouth paths; pupils are updated from the parent component
- **Developer API**: `window.petReact(reaction)` and `window.getPetStats()` available in console for quick interactions and debugging

### Mood System
- `MoodContext` provides `{ mood, setMood }` app-wide
- `MoodSwitcher` cycles through moods and writes `data-mood` to `document.body`
- CSS in `_variables.css` (and component files) uses `body[data-mood="hacker"]` / `body[data-mood="vaporwave"]` selectors to retheme accent colors

### Music Player Persistence
- **Class**: `MusicPlayer` - constructor accepts track array
- **localStorage keys**: `music-currentTrack`, `music-currentTime`, `music-isPaused`
- **Throttling**: 1 write/sec max (efficient I/O, not 60/sec)
- **Autoplay**: Starts muted, unmutes on first user interaction (browser compliance)
- **To add tracks**: Pass `['track1.m4a', 'track2.m4a']` to `usePortfolioModules()` in Layout.jsx

### Legacy Effects Module
- **Particles.js**: Gold (#d4af37) configured in `initParticles()`
- **Parallax**: `friction = 1/12`, `depth = 0.06` in `initParallax()`
- **Graceful**: Only initializes if DOM elements exist (no errors if missing)

### UI Enhancements (DOM Targets)
- **Typing animation**: `#main-title h1` (50ms per char)
- **Email glitch**: `.local-part` element (400ms rotation)
- **Back-to-top**: `#back-to-top` button (shows at `scrollY > 300px`)
- **Video hover**: `.hover-play` videos with `.progress` bar

### CSS Architecture
- **Variables**: Centralized in `_variables.css` (`--primary-color: #d4af37`, etc.)
- **Component isolation**: Each `.css` file = one concern (no specificity wars)
- **Responsive**: Mobile-first in `_layout.css` with `@media (min-width: ...)`
- **Import order**: All files imported in `main.css`
- **Cross-browser CSS**: Use PostCSS + Autoprefixer when needed to add vendor prefixes automatically (instead of hand-maintaining prefixes in every file)

## Common Development Tasks

### Adding a New Project Page
1. Create `src/pages/ProjetNEW.jsx` (copy pattern from `ProjetSAE12.jsx`)
2. Import it in `src/App.jsx` and add route: `<Route path="projet-NEW" element={<ProjetNEW />} />`
3. Add card to `Projets.jsx` page listing (or `ProjetsPersonnels.jsx` if personal)
4. Call `useDocumentMeta('Title', 'Description')` in the new page component

### Adding a Music Track
1. Place `.m4a` file in `public/assets/music/filename.m4a`
2. `discoverMusicTracks()` picks it up automatically — no code change needed
3. Player auto-reads ID3 tags for metadata (artist, title, artwork)

### Modifying Styles
- **Global theme**: Edit `src/styles/_variables.css` (CSS custom properties)
- **Page-specific**: Add classes in relevant `components/_page.css` file
- **Component CSS**: Import in JSX if needed: `import '@styles/components/_buttons.css'`
- **Compatibility pass**: If new CSS features may have browser support gaps (e.g. `backdrop-filter`, `user-select`, `appearance`, advanced gradients), ensure PostCSS + Autoprefixer is active before validating on multiple browsers
- Structure prevents cascading conflicts; no `!important` needed

### Debugging Build Issues
- **TypeErrors in React**: Check imports in `src/App.jsx` and pages (route components)
- **Missing styles**: Verify import in `main.css`; check CSS file in `src/styles/`
- **Cross-browser regressions**: Verify `postcss.config.js` includes `autoprefixer` and that `browserslist` is defined in `package.json` when compatibility issues appear on Firefox/Chrome/Safari
- **Legacy module errors**: Check `usePortfolioModules()` in `Layout.jsx` and DOM targets (e.g., `#main-title` exists)
- **Build fails**: Run `npm run build` (HMR in dev hides some errors); test with `npm run preview`
- **Asset 404s**: Verify path in code is `/assets/...` (absolute, not relative)

## Conventions

- **Language**: French content + French code comments
- **File naming**: `PascalCase.jsx` for React components, `camelCase.js` for utilities/hooks, `_kebab-case.css` for styles
- **React patterns**: Functional components + hooks; import from `'react-router-dom'` for navigation
- **Relative imports**: Use module aliases `@/`, `@styles/`, `@assets/` (defined in vite.config.js)
- **Asset paths**: Always absolute (`/assets/images/...`, `/assets/music/...`) in code and HTML
- **Accessibility**: Use semantic HTML (`<header>`, `<main>`, `<article>`), `aria-` attributes where needed
- **Icons**: Prefer custom SVG icons over emojis for UI elements. Define reusable SVG components/objects at module level (e.g., `EFFECT_ICONS` in `ParticlesButton.jsx`). Pass SVG elements to `showToast()` via the `icon` option instead of embedding emojis in text strings.

## Testing Workflow

1. **Development**: `npm run dev` → http://localhost:3000 with HMR (changes auto-reload)
2. **Build test**: `npm run build` → Check `/dist/` folder contains `index.html` and assets
3. **Production preview**: `npm run preview` → Run production build locally, verify routes and assets load
4. **Key tests**:
   - Music player persists across page navigation
   - Meta tags change per page (check DevTools `<head>`)
   - Legacy effects (particles, typing, glitch) appear on first page load
   - Images in `/assets/images/` load (check Network tab for 404s)
   - Mobile responsive: test at 375px, 1024px widths

## Critical Files Reference

| File | Purpose |
|------|---------|
| [vite.config.js](vite.config.js) | Vite 5 build config, path aliases (`@`, `@styles`, `@hooks`, `@pages`, `@contexts`, `@utils`, `@data`, etc.), React plugin |
| [src/App.jsx](src/App.jsx) | React Router orchestrator - defines routes and lazy pages |
| [src/components/Layout.jsx](src/components/Layout.jsx) | Shared header/footer, initializes legacy modules, wraps pages via `<Outlet />` |
| [src/components/pet/PetButton.jsx](src/components/pet/PetButton.jsx) | Entry to the pet subsystem (HUD + spawn control) |
| [src/components/MoodSwitcher.jsx](src/components/MoodSwitcher.jsx) | Cycles site mood; writes `data-mood` on `<body>` |
| [src/contexts/MoodContext.jsx](src/contexts/MoodContext.jsx) | Global mood state provider |
| [src/contexts/ToastContext.jsx](src/contexts/ToastContext.jsx) | Toast API used by UI and legacy modules |
| [src/contexts/ReadingTimeContext.jsx](src/contexts/ReadingTimeContext.jsx) | Reading time provider (wraps `<Outlet />` in Layout) |
| [src/utils/discoverMusicTracks.js](src/utils/discoverMusicTracks.js) | Auto-discovers `.m4a` files — no hardcoded track list needed |
| [src/utils/performanceTier.js](src/utils/performanceTier.js) | Performance tier detection to gate heavy ambient effects |
| [src/hooks/useDocumentMeta.js](src/hooks/useDocumentMeta.js) | Hook for per-page SEO (title, description) |
| [src/hooks/usePortfolioModules.js](src/hooks/usePortfolioModules.js) | Hook for lazy-loading legacy JS modules (music, effects, UI) |
| [src/components/ambient/AmbientBoids.jsx](src/components/ambient/AmbientBoids.jsx) | Example ambient component (see `src/components/ambient/` for more) |
| [src/components/pet/WanderingPet.jsx](src/components/pet/WanderingPet.jsx) | Pet movement + steering implementation |
| [src/styles/_variables.css](src/styles/_variables.css) | CSS custom properties (colors, spacing, theme, mood overrides) |
| [src/styles/main.css](src/styles/main.css) | Central CSS import aggregator |
| [package.json](package.json) | React 18, React Router 6, Vite 5, Framer Motion dependencies |
