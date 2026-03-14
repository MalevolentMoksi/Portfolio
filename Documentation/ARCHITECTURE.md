# Architecture - Guide Developpeur

Document de reference technique du portfolio.
Etat verifie sur le code source le 2026-03-15.

## Vue d'ensemble

Le projet est une SPA React en TypeScript avec:
- routage React Router v6
- pages lazy-load via Suspense
- modules legacy TypeScript (musique, effets, lightbox, UI)
- i18n FR/EN
- contexte accessibilite persistant
- couche ambient adaptee au mood et au tier de performance
- PWA via vite-plugin-pwa

Schema global:

```text
src/main.tsx
  -> providers globaux (Accessibility, Mood, Toast)
  -> App.tsx
      -> BrowserRouter + Suspense
      -> Layout.tsx (shell partage)
          -> Outlet (pages)
          -> modules legacy via usePortfolioModules()
```

## Core App

### Points d'entree
- src/index.html: template SPA, chargement des scripts CDN (particles.js, jsmediatags), registerSW
- src/main.tsx: bootstrap React + providers
- src/App.tsx: declaration des routes lazy
- src/components/Layout.tsx: header/nav/actions, hero par route, ambient layers, footer

### Routes actuelles
- /
- /projets
- /projets-personnels
- /projet-MEGASAE
- /projet-SAE12
- /projet-SAE3
- /projet-SAE4
- /projet-SAE56
- /projet-SAE3.01
- /about
- /credits
- * (NotFound)

## Structure Source

```text
src/
  components/           # 43 composants TSX (inclut ambient + pet)
    ambient/            # 18 composants
    pet/                # sous-systeme robot
  contexts/             # Accessibility, Mood, ReadingTime, Toast
  data/
  hooks/                # useDocumentMeta, usePortfolioModules, useReadingTimeEstimate
  locales/              # fr.json, en.json
  pages/                # 12 pages routables
  scripts/              # music-player.ts, effects.ts, ui-enhancements.ts, lightbox.ts
  styles/               # 35 fichiers CSS (6 core + 29 component)
  types/
  utils/                # assetPath, discoverMusicTracks, performanceTier, safeStorage
```

## Contextes et Etat Global

- MoodContext.tsx
  - moods: default, hacker, vaporwave, europa, industrial
  - persistance localStorage: portfolio-mood
  - applique body[data-mood="..."]

- AccessibilityContext.tsx
  - noMotion, highContrast, fontSize, dyslexiaFont
  - persistance localStorage
  - applique classes body a11y

- ToastContext.tsx
  - API React + pont global window.showToast pour scripts legacy

- ReadingTimeContext.tsx
  - expose estimation de lecture aux pages

## Modules Legacy et Bridge React

usePortfolioModules.ts gere l'initialisation progressive:
- music-player.ts: instance singleton
- effects.ts: instance singleton
- ui-enhancements.ts: singleton + reinit par changement de route
- lightbox.ts: instancie si elements .zoomable presents

Timing:
- init differee via requestAnimationFrame x2 + attente document/window ready
- suivi de performance (startFpsMonitor) lance une fois

## Systeme Visuel

### Mood + Ambiance
- Mood applique sur body[data-mood]
- AmbientEffects.tsx orchestre plusieurs sous-couches (neons, neige, boids, etc.)
- FooterDiorama.tsx affiche 2 ou 3 mini-dioramas tires aleatoirement d'un pool de 10

### Performance Tier
performanceTier.ts:
- tiers: high | mid | low
- detection sync (hardwareConcurrency + prefers-reduced-motion)
- cache sessionStorage
- monitoring FPS passif pouvant degrader le tier

## Musique

music-player.ts:
- tracks auto-decouvertes via discoverMusicTracks.ts (.m4a et .mp3)
- persistance localStorage:
  - music-currentTrack
  - music-currentTime
  - music-isPaused
  - music-volume
  - music-muted
  - music-retracted
- premiere visite: lecteur en pause par defaut
- throttle sauvegarde currentTime: ~1 ecriture/sec
- metadata ID3 via jsmediatags (CDN)

## i18n

i18n.ts:
- i18next + react-i18next + language detector
- langues supportees: fr, en
- fallback: fr
- detection: localStorage -> navigator -> htmlTag

## Build et Toolchain

- Vite 8 (vite.config.ts)
- TypeScript strict (tsconfig.json)
- React plugin + VitePWA
- root: src
- publicDir: ../public
- outDir: ../dist
- server dev: 3000
- preview: 8080

Scripts utiles:
- npm run dev
- npm run typecheck
- npm run build
- npm run preview

## Ajouter une Page

1. Creer src/pages/NouvellePage.tsx
2. Ajouter import lazy + route dans src/App.tsx
3. Ajouter les entrees de traduction fr/en si necessaire
4. Appeler useDocumentMeta(titre, description)
5. Verifier l'affichage dans Layout (hero, breadcrumbs, etc.)

## Checklist de Validation

- npm run typecheck
- npm run build
- verifier routes et lazy loading
- verifier mode no-motion + contrast + font-size
- verifier traduction FR/EN
- verifier persistance mood et player musique
