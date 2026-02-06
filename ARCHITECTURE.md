# 🏗️ Architecture - Guide Développeur

## Vue d'ensemble

**Portfolio** est une Single Page Application (SPA) React avec routing côté client. La migration de **Vite multi-page HTML → React SPA** est complète.

```
App.jsx (Orchestrateur de routes)
├── Layout (Wrapper commun: header, footer)
│   ├── Home (Accueil / index)
│   ├── Projets (Liste projets académiques)
│   ├── ProjetsPersonnels (Galerie personnelle)
│   └── ProjetXXX (Pages détail: MEGASAE, SAE12, SAE3, SAE4, SAE56)
```

---

## 📦 Architecture des Fichiers

### Point d'Entrée
```
src/index.html          ← Template unique pour la SPA
src/main.jsx            ← Initialisation React/Vite
```

### Routage & Pages
- **src/App.jsx** - Définition des routes (React Router v6)
- **src/pages/*.jsx** - 8 pages (Home, Projets, ProjetXXX, ProjetsPersonnels)

### Composants Réutilisables
```
src/components/
├── Layout.jsx           ← Structure globale (outlet pour pages)
├── BackToTopButton.jsx  ← Bouton remontée
└── Footer.jsx           ← Pied de page
```

### Hooks Personnalisés
```
src/hooks/
├── useDocumentMeta.js        ← Gère `<title>`, `<meta description>`
└── usePortfolioModules.js    ← Loaders pour particles.js, musique player, etc.
```

### Styling
```
src/styles/
├── main.css                 ← Import central (regroupe tout)
├── _variables.css           ← CSS custom props (couleurs, spacing)
├── _base.css, _layout.css, _typography.css
├── _effects.css             ← Animations, transitions
└── components/              ← Modulaires par composant
    ├── _header.css
    ├── _footer.css
    ├── _buttons.css
    ├── _music-player.css
    ├── _projects.css
    └── _personal-projects.css
```

### Assets
```
public/assets/
├── images/              ← Projets, screenshots, favicon
├── music/               ← deepstone.m4a, browser.m4a, wildriver.m4a
└── videos/              ← Vidéos de démo
```

---

## 🚀 Points Clés d'Implémentation

### 1. Routage (React Router v6)
```jsx
// App.jsx
<BrowserRouter>
  <Routes>
    <Route element={<Layout />}>
      <Route index element={<Home />} />
      <Route path="projets" element={<Projets />} />
      <Route path="projet-MEGASAE" element={<ProjetMEGASAE />} />
      {/* ... autres routes */}
    </Route>
  </Routes>
</BrowserRouter>
```

**Chemins :**
- `/` → Accueil
- `/projets` → Liste projets académiques
- `/projets-personnels` → Galerie personnelle
- `/projet-MEGASAE`, `/projet-SAE12`, etc. → Détails projet

### 2. Layout Global (Outlet Pattern)
```jsx
// Layout.jsx
<>
  <header>Navigation</header>
  <main>
    <Outlet />  {/* Chaque page s'injecte ici */}
  </main>
  <footer>Footer</footer>
</>
```

### 3. Meta Tags Dynamiques
```jsx
// Dans chaque page:
useDocumentMeta({
  title: "Page Title",
  description: "Page description pour SEO"
});
```

### 4. Intégration Modules Legacy
```jsx
// usePortfolioModules.js
// Lance les libs externes (particles.js, lecteur musique, etc.)
// Compatible avec React (effet au montage du Layout)
```

---

## 🎨 Styling

### Variables CSS Centralisées
```css
/* src/styles/_variables.css */
:root {
  --primary-color: #d4af37;      /* Or */
  --bg-color: #1a1a1a;            /* Noir */
  --text-color: #ffffff;
  --spacing-unit: 1rem;
}
```

### Mise à Jour des Styles
1. **Global** → Modifier `_variables.css`
2. **Par page** → Créer une classe/id dans `components/_page-name.css`
3. **Import CSS** → Automatique dans React (tous les fichiers CSS importés)

---

## 🛠️ Commandes de Développement

```bash
npm run dev      # Dev server: localhost:3000 (HMR actif)
npm run build    # Production: dist/ minifiée
npm run preview  # Test la build de production localement
```

---

## 🔄 Flux de Navigation

```
Utilisateur clique sur lien
    ↓
React Router capture l'URL
    ↓
Route match → Composant Page chargé
    ↓
useDocumentMeta met à jour <title>, <meta tags>
    ↓
usePortfolioModules initialise effects (si premier chargement)
    ↓
Layout + Page + Footer s'affichent
```

---

## 📝 Ajouter une Nouvelle Page

### Étape 1: Créer le composant
```jsx
// src/pages/MonProjet.jsx
import { useEffect } from 'react';
import useDocumentMeta from '../hooks/useDocumentMeta';

export default function MonProjet() {
  useDocumentMeta({
    title: "Mon Projet",
    description: "Description du projet"
  });

  return (
    <article>
      <h1>Titre du Projet</h1>
      <p>Contenu...</p>
    </article>
  );
}
```

### Étape 2: Ajouter la route
```jsx
// App.jsx
<Route path="mon-projet" element={<MonProjet />} />
```

### Étape 3: Ajouter le lien dans le nav
```jsx
// Dans navigations (Header ou autre)
<a href="/mon-projet">Mon Projet</a>
```

### Étape 4: Ajouter un CSS (optionnel)
```css
/* src/styles/components/_mon-projet.css */
article { /* styles */ }

/* Puis importer dans main.css */
@import "./components/_mon-projet.css";
```

---

## 🎵 Lecteur Musique Persistent

Le hook `usePortfolioModules` initialise les anciens modules JS (music-player.js, etc.) lors du montage du Layout. **Ces modules fonctionnent en parallèle de React** (pour la persistance localStorage, etc.).

### Ajouter une piste
1. Placer le fichier `.m4a` dans `public/assets/music/`
2. Modifier les données du lecteur (selon implémentation dans `scripts/music-player.js`)

---

## 🌟 Technos Stack

- **Frontend** : React 18.2 + React Router 6.22
- **Build** : Vite 5.0
- **CSS** : CSS Modules / Classique (non-scoped)
- **Librairies externes**:
  - `particles.js` - Fond animé
  - `jsmediatags` - Lecture des tags ID3 (musique)

---

## 📋 Checklist Avant Commit

- [ ] `npm run build` passe sans erreur
- [ ] `npm run preview` fonctionne
- [ ] Nouveaux Meta tags ajoutés si nouvelle page
- [ ] Tests des liens de nav
- [ ] CSS respecte les variables centralisées
- [ ] Pas de console errors/warnings

---

## ❓ FAQ

**Q: Où sont les anciens fichiers Vite?**
A: Archivés dans `_archive/`. Voir [_archive/README.md](_archive/README.md).

**Q: Comment faire du CSS-in-JS?**
A: Actuellement, on utilise CSS classique. Possibilité d'ajouter `styled-components` ou `emotion` à l'avenir.

**Q: Comment tester les metas dynamiques?**
A: Ouvrir DevTools → `<head>` → vérifier que `<title>` et `<meta description>` changent lors de navigation.

**Q: Où sont les assets?**
A: `public/assets/` (images, musique, vidéos). Toujours avec chemin absolu `/assets/...`.

