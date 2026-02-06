# Portfolio - Enzo Morello

Portfolio professionnel moderne présentant mes projets académiques et personnels. Application React monopage (SPA) avec React Router v6, développée avec Vite 5 et optimisée pour tous les appareils.

## 🚀 Démarrage rapide

### Prérequis

- Node.js 18+ et npm
- Git (optionnel)

### Installation

```bash
# Cloner le dépôt (si applicable)
git clone https://github.com/MalevolentMoksi/P2.01-Portfolio.git
cd P2.01-Portfolio

# Installer les dépendances
npm install

# Lancer le serveur de développement
npm run dev
```

Le site sera accessible à `http://localhost:5173`

## 📦 Scripts disponibles

| Commande | Description |
|----------|-------------|
| `npm run dev` | Lance le serveur de développement Vite avec HMR (Hot Module Replacement) |
| `npm run build` | Construit l'application React pour la production dans `/dist` |
| `npm run preview` | Prévisualise le build de production localement |
| `npm run format` | Formate le code avec Prettier |

## 🏗️ Architecture du projet

### Structure React SPA

```
P2.01-Portfolio/
├── src/
│   ├── main.jsx                    # Point d'entrée React (ReactDOM.render)
│   ├── App.jsx                     # Définition des routes (React Router v6)
│   ├── index.html                  # Template HTML de la SPA
│   │
│   ├── components/                 # Composants React réutilisables
│   │   ├── Layout.jsx             # Layout principal (header/footer + Outlet)
│   │   ├── Footer.jsx             # Composant footer
│   │   └── BackToTopButton.jsx    # Bouton retour en haut
│   │
│   ├── pages/                      # Composants pages (routes)
│   │   ├── Home.jsx               # Page d'accueil
│   │   ├── Projets.jsx            # Liste des projets académiques
│   │   ├── ProjetsPersonnels.jsx  # Projets personnels
│   │   ├── ProjetMEGASAE.jsx      # Détails projet MEGASAE
│   │   ├── ProjetSAE12.jsx        # Détails projet SAE 1.02
│   │   ├── ProjetSAE3.jsx         # Détails projet SAE 3
│   │   ├── ProjetSAE4.jsx         # Détails projet SAE 4
│   │   └── ProjetSAE56.jsx        # Détails projet SAE 5.06
│   │
│   ├── hooks/                      # Hooks React personnalisés
│   │   ├── useDocumentMeta.js     # Hook pour title/meta description (SEO)
│   │   └── usePortfolioModules.js # Hook d'initialisation des modules legacy
│   │
│   ├── scripts/                    # Modules JavaScript legacy (vanilla JS)
│   │   ├── main.js                # Orchestrateur des modules
│   │   ├── music-player.js        # Lecteur audio persistant (localStorage)
│   │   ├── effects.js             # Effets visuels (particles.js, parallaxe)
│   │   ├── ui-enhancements.js     # Animations UI (typing, glitch, etc.)
│   │   └── lightbox.js            # Galerie zoom pour images .zoomable
│   │
│   └── styles/                     # CSS modulaire
│       ├── main.css               # Point d'entrée (@import tous les CSS)
│       ├── _variables.css         # Variables CSS (thème, couleurs)
│       ├── _base.css              # Reset & styles de base
│       ├── _layout.css            # Grilles, conteneurs, responsive
│       ├── _typography.css        # Typographie
│       ├── _effects.css           # Animations et transitions
│       └── components/            # Styles par composant
│           ├── _header.css
│           ├── _footer.css
│           ├── _buttons.css
│           ├── _music-player.css
│           ├── _projects.css
│           └── _personal-projects.css
│
├── public/                         # Assets statiques (copiés tel quel dans dist/)
│   └── assets/
│       ├── images/                # Images (dont drawings/)
│       ├── music/                 # Fichiers audio (.m4a)
│       └── videos/                # Vidéos
│
├── dist/                           # Build de production (généré par Vite)
├── vite.config.js                 # Config Vite (aliases @/, @styles/, etc.)
├── package.json                   # Dépendances (React 18, React Router 6)
└── .prettierrc                    # Configuration Prettier
```

## 🎨 Fonctionnalités principales

### Architecture React + Modules Legacy
- **React SPA** : Application monopage avec React Router v6 pour navigation fluide
- **Hooks personnalisés** : `useDocumentMeta()` pour SEO dynamique, `usePortfolioModules()` pour intégration legacy
- **Lazy loading** : Modules JS vanilla initialisés à la demande via hooks React
- **State management** : Singleton instances persistantes pour musique et effets

### Lecteur de musique persistant
- **État localStorage** : Sauvegarde piste, temps, état pause/lecture (throttling 1 write/sec)
- **Métadonnées ID3** : Lecture automatique des tags (artiste, titre, pochette)
- **Autoplay intelligent** : Démarre muet, unmute au premier clic (conformité navigateurs)
- **Navigation persistante** : Le lecteur survit aux changements de route React

### Effets visuels (Modules Legacy)
- **Particules animées** : particles.js avec thème doré (#d4af37)
- **Parallaxe souris** : Friction 1/12, depth 0.06 (optimisé, pas de lag)
- **Typing animation** : `#main-title` avec 50ms par caractère
- **Email glitch** : Effet rotation 400ms sur `.local-part`
- **Lightbox** : Zoom galerie sur images `.zoomable`

### SEO & Performance
- **Meta tags dynamiques** : Title et description par page via `useDocumentMeta()`
- **Code splitting** : Modules chargés on-demand
- **Asset optimization** : Images/vidéos dans `/public/assets/` (Vite optimise)
- **Responsive images** : Formats adaptatifs selon breakpoints

### Accessibilité
- **ARIA** : Labels et rôles sur composants interactifs
- **Navigation clavier** : Focus visible, tabindex appropriés
- **Contraste WCAG AA** : Thème dark avec accent doré (#d4af37)
- **Reduced motion** : Respect `prefers-reduced-motion`

### Responsive Design
- **Mobile-first** : CSS mobile par défaut, media queries pour desktop
- **Breakpoints** : 375px, 768px, 1024px, 1440px
- **Touch-friendly** : Zones de clic 44×44px min

## 🛠️ Technologies utilisées

### Core Stack
- **React 18** : Bibliothèque UI avec functional components + hooks
- **React Router v6** : Navigation SPA (BrowserRouter, 8 routes)
- **Vite 5.0** : Build tool rapide (HMR, ES modules natifs)

### Styling
- **CSS natif** : Architecture modulaire avec `@import`
- **CSS Custom Properties** : Thème centralisé dans `_variables.css`
- **Mobile-first** : Media queries progressives

### JavaScript
- **ES Modules** : Import/export natifs
- **Legacy integration** : Modules vanilla JS cohabitant avec React
- **Libraries** :
  - `particles.js` - Système de particules
  - `jsmediatags` - Lecture métadonnées audio ID3

## 🎯 Conventions de code

### React / JSX
- **Composants** : Functional components avec hooks (`useState`, `useEffect`, etc.)
- **Nomenclature** : `PascalCase` pour composants (`Home.jsx`, `Layout.jsx`)
- **Props** : Destructuration en paramètre (`({ title, children }) => ...`)
- **Imports** : Utiliser les aliases Vite (`@/`, `@styles/`, `@assets/`)
- **Navigation** : `<Link>` de React Router (pas `<a href>`)

### CSS
- **Architecture modulaire** : Un fichier par concern (`_header.css`, `_footer.css`)
- **Variables CSS** : Centralisées dans `:root` de `_variables.css`
- **Nomenclature BEM** : `.block__element--modifier` pour composants complexes
- **Mobile-first** : Styles de base pour mobile, `@media (min-width: ...)` pour desktop
- **Pas de `!important`** : Architecture prévient les conflits de spécificité

### JavaScript (Modules Legacy)
- **ES Modules** : `export class`, `import { ... } from`
- **Classes** : Architecture OOP pour `MusicPlayer`, `VisualEffects`
- **Singleton pattern** : Instances globales (`musicPlayerInstance`, `visualEffectsInstance`)
- **Graceful degradation** : Vérifier existence DOM avant initialisation
- **JSDoc** : Documenter méthodes publiques

### Hooks personnalisés
```jsx
// useDocumentMeta.js - SEO par page
import useDocumentMeta from '@/hooks/useDocumentMeta.js';

export default function Home() {
  useDocumentMeta('Accueil | Portfolio', 'Portfolio professionnel...');
  return <section>...</section>;
}
```

```jsx
// usePortfolioModules.js - Initialisation modules legacy
import { usePortfolioModules } from '@/hooks/usePortfolioModules.js';

export default function Layout() {
  const trackFiles = ['deepstone.m4a', 'browser.m4a', 'wildriver.m4a'];
  usePortfolioModules(trackFiles); // Init music, effects, UI, lightbox
  return <Outlet />;
}
```

### Assets
- **Chemins absolus** : Toujours `/assets/images/...` (pas `../assets`)
- **Organisation** : Images dans `images/`, musique dans `music/`, vidéos dans `videos/`
- **Formats optimisés** : WebP pour images, M4A pour audio
- **Alt text** : Obligatoire sur toutes les `<img>`

## 📱 Support des navigateurs

- **Chrome/Edge** 90+ (support ES2020, CSS Custom Properties)
- **Firefox** 88+
- **Safari** 14+ (iOS 14+)
- **Mobile** : iOS Safari, Chrome Android (responsive testé 375px-1440px)

## 🔧 Tâches de développement courantes

### Ajouter un nouveau projet

#### 1. Créer le composant page
```jsx
// src/pages/ProjetNEW.jsx
import useDocumentMeta from '@/hooks/useDocumentMeta.js';

export default function ProjetNEW() {
  useDocumentMeta('Projet NEW | Portfolio', 'Description du projet...');
  
  return (
    <main className="project-detail">
      <article>
        <h1>Titre du Projet</h1>
        {/* Contenu ici */}
      </article>
    </main>
  );
}
```

#### 2. Ajouter la route dans App.jsx
```jsx
// src/App.jsx
import ProjetNEW from '@/pages/ProjetNEW.jsx';

// Dans <Routes>
<Route path="projet-NEW" element={<ProjetNEW />} />
```

#### 3. Créer la carte dans la liste
```jsx
// Dans src/pages/Projets.jsx (ou ProjetsPersonnels.jsx)
<Link to="/projet-NEW" className="project-card">
  <img src="/assets/images/projet-new.jpg" alt="Projet NEW" />
  <h3>Titre du Projet</h3>
  <p>Description courte</p>
</Link>
```

### Ajouter une piste musicale

#### 1. Placer le fichier audio
```
public/assets/music/nouvelle-track.m4a
```

#### 2. Mettre à jour Layout.jsx
```jsx
// src/components/Layout.jsx
const trackFiles = [
  'deepstone.m4a',
  'browser.m4a',
  'wildriver.m4a',
  'nouvelle-track.m4a'  // ← Ajouter ici
];
usePortfolioModules(trackFiles);
```

Le lecteur lira automatiquement les métadonnées ID3 (artiste, titre, pochette).

### Modifier les styles

#### Global (thème, couleurs)
```css
/* src/styles/_variables.css */
:root {
  --primary-color: #d4af37;    /* Changer couleur accent */
  --spacing-unit: 1rem;         /* Modifier espacement */
  --transition-speed: 0.3s;     /* Vitesse animations */
}
```

#### Composant spécifique
```css
/* src/styles/components/_buttons.css */
.btn-primary {
  background: var(--primary-color);
  /* Styles supplémentaires */
}
```

Pas besoin d'importer dans JSX, tout est centralisé dans `main.css`.

### Déboguer un problème de module legacy

Si `TypeError: Cannot read property 'init' of undefined` :
```jsx
// Vérifier dans src/hooks/usePortfolioModules.js
useEffect(() => {
  // Modules initialisés ici
}, [location.pathname]); // Réinit sur changement de route
```

Vérifier que les cibles DOM existent :
```javascript
// src/scripts/ui-enhancements.js
const mainTitle = document.querySelector('#main-title h1');
if (mainTitle) {
  // Typing animation
}
```

## 🚀 Déploiement

### Build de production

```bash
npm run build
```

Génère le dossier `dist/` avec :
- `index.html` (point d'entrée)
- `assets/` (JS/CSS bundlés + hash)
- `assets/images/`, `assets/music/`, `assets/videos/` (copiés depuis `public/`)

### GitHub Pages

1. **Configurer le repo GitHub** :
   - Settings → Pages → Source: GitHub Actions

2. **Créer `.github/workflows/deploy.yml`** :
```yaml
name: Deploy to GitHub Pages

on:
  push:
    branches: [main]

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: 18
      - run: npm ci
      - run: npm run build
      - uses: peaceiris/actions-gh-pages@v3
        with:
          github_token: ${{ secrets.GITHUB_TOKEN }}
          publish_dir: ./dist
```

3. **Pousser sur main** → déploiement automatique

### Autres plateformes

Le build statique fonctionne sur :
- **Netlify** : Drag & drop `/dist/`, ou link GitHub repo
- **Vercel** : Import repo, détection auto Vite
- **Cloudflare Pages** : Build command `npm run build`, output `dist/`
- **AWS S3 + CloudFront** : Upload `/dist/` vers bucket S3

## 🐛 Résolution de problèmes

### Le lecteur de musique ne démarre pas automatiquement

**Normal** : Les navigateurs bloquent l'autoplay audio. Le lecteur :
1. Démarre en mode muet au chargement
2. Attend une interaction utilisateur (clic)
3. Unmute automatiquement après premier clic

**Vérifier** : Console DevTools pour erreurs `NotAllowedError: play() failed`

### Images/vidéos ne chargent pas (404)

**Cause** : Chemin incorrect
```jsx
// ❌ Mauvais (chemins relatifs)
<img src="../assets/images/photo.jpg" />

// ✅ Correct (absolu depuis public/)
<img src="/assets/images/photo.jpg" />
```

**Vérifier** : Network tab DevTools → Vérifier URL complète de la requête

### Erreur "Cannot read property of undefined" dans modules legacy

**Cause** : Cible DOM n'existe pas quand module s'initialise

**Solution** : Ajouter vérification dans `src/scripts/ui-enhancements.js` :
```javascript
const element = document.querySelector('#target');
if (element) {
  // Logique ici
}
```

### Hot Module Replacement (HMR) ne fonctionne pas

**Solution** :
```bash
# Redémarrer le serveur Vite
npm run dev
```

Si problème persiste :
```bash
# Nettoyer cache et node_modules
rm -rf node_modules .vite dist
npm install
npm run dev
```

### Build échoue avec erreur TypeScript/ESLint

**Cause** : Import manquant ou typo dans JSX

**Solution** :
```bash
# Vérifier les erreurs détaillées
npm run build

# Chercher dans output pour :
# - Missing import statements
# - Undefined variables
# - Syntax errors in JSX
```

**Erreur fréquente** : Import de composant sans extension `.jsx`
```jsx
// ❌ Mauvais
import Home from '@/pages/Home';

// ✅ Correct
import Home from '@/pages/Home.jsx';
```

### Styles CSS ne s'appliquent pas

**Cause 1** : Fichier CSS non importé dans `main.css`
```css
/* src/styles/main.css */
@import './_variables.css';
@import './components/_new-style.css'; /* ← Ajouter ici */
```

**Cause 2** : Spécificité CSS trop faible
```css
/* ❌ Spécificité trop faible */
.btn { color: red; }

/* ✅ Spécificité adaptée */
header .btn-primary { color: red; }
```

**Debug** : DevTools → Elements → Computed → Voir styles appliqués

### Routes React Router ne fonctionnent pas en production

**Cause** : Serveur web ne redirige pas toutes les routes vers `index.html`

**Solution Netlify** : Créer `public/_redirects` :
```
/*    /index.html   200
```

**Solution Vercel** : Créer `vercel.json` :
```json
{
  "rewrites": [{ "source": "/(.*)", "destination": "/" }]
}
```

**Solution Apache** : `.htaccess` :
```apache
<IfModule mod_rewrite.c>
  RewriteEngine On
  RewriteBase /
  RewriteRule ^index\.html$ - [L]
  RewriteCond %{REQUEST_FILENAME} !-f
  RewriteCond %{REQUEST_FILENAME} !-d
  RewriteRule . /index.html [L]
</IfModule>
```

## 📄 Licence

Ce projet est sous licence MIT.

## 👤 Auteur

**Enzo Morello**
- GitHub: [@MalevolentMoksi](https://github.com/MalevolentMoksi)
- GitLab: [morelloe](https://gricad-gitlab.univ-grenoble-alpes.fr/morelloe)

---

*Dernière mise à jour : Février 2026*
