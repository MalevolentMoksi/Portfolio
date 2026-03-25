# Portfolio - Enzo Morello

Portfolio professionnel moderne présentant mes projets académiques et personnels.
Application React monopage (SPA), en TypeScript, avec React Router v6, Vite 8, modules legacy, i18n FR/EN, système d'accessibilité, et ambiance visuelle dynamique.

## Démarrage rapide

### Prérequis

- Node.js `^20.19.0` ou `>=22.12.0` (voir `engines` dans `package.json`)
- npm
- Git (optionnel)

### Installation

```bash
git clone https://github.com/MalevolentMoksi/Portfolio.git
cd Portfolio
npm install
npm run dev
```

Le serveur de dev démarre sur `http://localhost:3000`.

## Scripts disponibles

| Commande | Description |
|----------|-------------|
| `npm run dev` | Lance Vite en développement (HMR) |
| `npm run typecheck` | Vérifie le typage TypeScript (`tsc --noEmit`) |
| `npm run build` | Build de production dans `dist/` + génération de `sitemap.xml` dans `dist/` |
| `npm run preview` | Prévisualise le build de production sur `http://localhost:8080` |
| `npm run format` | Formate `src/**/*.{ts,tsx,css,html}` avec Prettier |
| `npm run seo:generate` | Génère `dist/sitemap.xml` |
| `npm run seo:generate:public` | Génère `public/sitemap.xml` (mise à jour versionnée) |
| `npm run test` | Lance les tests automatisés Node (`node --test`) |

## Stack actuelle

- React 18 + React Router v6 (routes lazy-loadées via `Suspense`)
- TypeScript strict (`strict: true` dans `tsconfig.json`)
- Vite 8 (`root: src`, sortie dans `dist/`)
- Framer Motion 12 (animations avancées du pet/robot)
- i18next + react-i18next + language detector (FR/EN)
- CSS modulaire (38 fichiers CSS au total) + PostCSS + Autoprefixer
- Vite PWA (`vite-plugin-pwa`) + `registerSW.js`

## Architecture du projet

### Organisation générale

```text
src/
  main.tsx                    # Entrée React + providers globaux
  App.tsx                     # Routes + lazy loading
  index.html                  # Template SPA (root Vite)

  components/                 # 47+ composants React (dont ambient + pet)
    ambient/                  # 18 composants d'ambiance
    pet/                      # Sous-système robot interactif

  pages/                      # 13 pages routées
  contexts/                   # Mood, Toast, ReadingTime, Accessibility
  hooks/                      # useDocumentMeta, usePortfolioModules, etc.
  scripts/                    # Modules legacy TypeScript (music/effects/ui/lightbox)
  utils/                      # assetPath, discoverMusicTracks, performanceTier...
  locales/                    # fr.json / en.json
  styles/                     # Core + components (CSS modulaire)
```

### Routes actuelles

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
- `/informations-legales`
- `*` (NotFound)

### Providers globaux (main.tsx)

L'application est enveloppée par :

1. `AccessibilityProvider`
2. `MoodProvider`
3. `ToastProvider`

## Fonctionnalités clés

### Modules legacy intégrés au cycle React

`usePortfolioModules()` initialise :

- `music-player.ts`
- `effects.ts`
- `ui-enhancements.ts`
- `lightbox.ts`

Les instances principales (musique, effets, UI) sont conservées et réutilisées entre navigations pour éviter les ré-initialisations coûteuses.

### Lecteur audio persistant

- Découverte automatique des pistes `.m4a` et `.mp3` via `discoverMusicTracks()`
- Métadonnées ID3 lues par `jsmediatags` (import dynamique npm)
- État persistant (`track`, `time`, `paused`, `volume`, `muted`, `retracted`) en localStorage
- Throttle d'écriture de la position à ~1 écriture/seconde
- Première visite : lecteur en pause par défaut

### Système de thèmes (moods)

6 moods disponibles :

- `default`
- `hacker`
- `vaporwave`
- `europa`
- `industrial`
- `nightshade`

Le mood est stocké en localStorage (`portfolio-mood`) et appliqué sur `body[data-mood]`.

### Accessibilité

Panneau dédié dans le header avec persistance :

- Désactivation animations (`noMotion`)
- Contraste renforcé
- Taille de police (`normal`, `lg`, `xl`)
- Police dyslexie

### Internationalisation

- Langues : français (`fr`) et anglais (`en`)
- Détection via localStorage, navigateur, balise HTML
- Bouton de langue dans le header

### Ambiance visuelle et performance

- Couche ambiante décorative (`AmbientEffects`, `FooterDiorama`, etc.)
- Détection de tier de performance (`high`, `mid`, `low`)
- Monitoring FPS passif pour dégrader automatiquement les effets si nécessaire
- Respect de `prefers-reduced-motion`

## Formulaire de contact (Formspree)

Composant : `src/components/ContactForm.tsx`

- Endpoint via `VITE_FORMSPREE_ENDPOINT`
- Fallback intégré si variable absente
- Honeypot anti-bot + délai minimal de soumission
- Validation côté client (nom, email, message)

### Configuration recommandée

```bash
# Windows PowerShell
Copy-Item .env.example .env
```

Puis dans `.env` :

```env
VITE_FORMSPREE_ENDPOINT=https://formspree.io/f/votre_form_id
```

## Déploiement

### Build local

```bash
npm run typecheck
npm run build
npm run preview
```

### Sitemap

- Génération automatique pendant `npm run build` via `npm run seo:generate`.
- Sortie par défaut dans `dist/` pour éviter les modifications involontaires des fichiers versionnés.
- URL de base configurable avec `SITE_URL` (ou `VITE_SITE_URL`).
- Valeur par défaut : `https://moksi.studio`.

Exemple (PowerShell) :

```powershell
$env:SITE_URL="https://moksi.studio"
npm run seo:generate
```

Pour mettre à jour explicitement le fichier versionné dans `public/` :

```powershell
npm run seo:generate:public
```

### GitHub Pages (CI)

Workflow : `.github/workflows/deploy-pages.yml`

- Node 22.12.0
- `npm ci`
- `npm run typecheck`
- `npm run build`
- Copie `dist/index.html` vers `dist/404.html` pour fallback SPA
- Déploiement via `actions/deploy-pages`

### Netlify / Vercel

Le projet contient :

- `netlify.toml` (build + redirect SPA)
- `vercel.json` (rewrites SPA + cache des assets)


## Conventions de code

- Composants React : `PascalCase.tsx`
- Hooks / utils : `camelCase.ts`
- Styles : `_kebab-case.css`
- Aliases : `@`, `@styles`, `@scripts`, `@components`, `@assets`, `@hooks`, `@pages`, `@contexts`, `@utils`, `@data`
- Assets frontend : chemins absolus `/assets/...`

## Dépannage rapide

### Le build échoue

1. Lancer `npm run typecheck` pour isoler les erreurs TS.
2. Relancer `npm run build`.
3. Vérifier imports/typage dans les fichiers `.ts`/`.tsx` concernés.

### Les routes ne fonctionnent pas en production

Vérifier qu'un fallback SPA vers `index.html` est actif.
Le projet est déjà configuré pour cela sur GitHub Pages, Netlify et Vercel.

### Les assets retournent 404

Utiliser des chemins absolus depuis `public/` :

- Correct : `/assets/images/...`
- Incorrect : `../assets/images/...`

## Licence

Projet sous licence MIT.

## Auteur

Enzo Morello

- GitHub : https://github.com/MalevolentMoksi
- GitLab : https://gricad-gitlab.univ-grenoble-alpes.fr/morelloe

---

Dernière mise à jour : Mars 2026
