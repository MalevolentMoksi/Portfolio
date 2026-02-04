# P2.01 Portfolio - Enzo Morello

Portfolio professionnel moderne présentant mes projets académiques et personnels. Développé avec des technologies web modernes et optimisé pour tous les appareils.

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

Le site sera accessible à `http://localhost:3000`

## 📦 Scripts disponibles

| Commande | Description |
|----------|-------------|
| `npm run dev` | Lance le serveur de développement avec rechargement automatique |
| `npm run build` | Construit le site pour la production dans `/dist` |
| `npm run preview` | Prévisualise le build de production localement |
| `npm run format` | Formate le code avec Prettier |

## 🏗️ Architecture du projet

```
P2.01-Portfolio/
├── src/                          # Code source
│   ├── index.html               # Page d'accueil
│   ├── projets.html             # Liste des projets académiques
│   ├── projets-personnels.html  # Projets personnels
│   ├── projet-*.html            # Pages détaillées des projets
│   ├── styles/                  # Styles modulaires
│   │   ├── main.css            # Point d'entrée des styles
│   │   ├── _variables.css      # Variables CSS globales
│   │   ├── _base.css           # Reset & styles de base
│   │   ├── _layout.css         # Grilles et conteneurs
│   │   ├── _typography.css     # Typographie
│   │   ├── _effects.css        # Animations et effets
│   │   └── components/         # Styles des composants
│   │       ├── _header.css
│   │       ├── _footer.css
│   │       ├── _buttons.css
│   │       ├── _music-player.css
│   │       └── _projects.css
│   └── scripts/                 # JavaScript modulaire
│       ├── main.js             # Point d'entrée de l'application
│       ├── music-player.js     # Lecteur de musique persistant
│       ├── effects.js          # Effets visuels (particules, parallaxe)
│       └── ui-enhancements.js  # Améliorations UI (typing, glitch, etc.)
├── public/                      # Assets statiques
│   └── assets/
│       ├── images/             # Images et icônes
│       ├── music/              # Fichiers audio
│       └── videos/             # Vidéos
├── dist/                        # Build de production (généré)
├── vite.config.js              # Configuration Vite
├── package.json                # Dépendances et scripts
└── .prettierrc                 # Configuration Prettier
```

## 🎨 Fonctionnalités principales

### Lecteur de musique persistant
- **État persistant** : Le lecteur se souvient de la piste, du temps de lecture et de l'état lecture/pause entre les pages
- **Métadonnées ID3** : Affichage automatique du titre, artiste et pochette d'album
- **Responsive** : S'adapte automatiquement à la taille de l'écran (mini-player sur mobile)

### Effets visuels
- **Particules animées** : Système de particules dorées avec liens interactifs
- **Parallaxe** : Arrière-plan qui suit le mouvement de la souris (optimisé avec throttling)
- **Animations** : Effet de frappe pour les titres, glitch sur l'email

### Accessibilité
- **ARIA** : Labels et rôles ARIA appropriés sur tous les composants interactifs
- **Navigation clavier** : Tous les éléments interactifs accessibles au clavier
- **Skip links** : Liens "Aller au contenu principal" pour les lecteurs d'écran
- **Contraste** : Respect des normes WCAG AA pour le contraste des couleurs
- **Reduced motion** : Respect des préférences système pour les animations réduites

### Responsive Design
- **Mobile-first** : Conçu pour les petits écrans en priorité
- **Breakpoints** : 320px, 768px, 1024px, 1440px
- **Touch support** : Gestion des gestes tactiles pour les vidéos et interactions

## 🛠️ Technologies utilisées

- **Build Tool** : Vite 5.0
- **Styling** : CSS natif (modulaire avec @import)
- **JavaScript** : ES6+ Modules
- **Libraries** :
  - particles.js - Système de particules
  - jsmediatags - Lecture des métadonnées audio

## 🎯 Conventions de code

### CSS
- **Nomenclature BEM** : Utilisée pour les composants (`.block__element--modifier`)
- **Variables CSS** : Toutes les valeurs communes dans `:root` (couleurs, espacements, transitions)
- **Mobile-first** : Media queries pour écrans plus grands uniquement

### JavaScript
- **ES Modules** : Import/export pour la modularité
- **Classes** : Architecture orientée objet pour les modules principaux
- **JSDoc** : Documentation des fonctions principales

### HTML
- **Sémantique** : Utilisation appropriée des balises HTML5
- **Accessibilité** : ARIA labels, rôles, et attributs appropriés
- **SEO** : Meta descriptions, titres uniques, alt text sur images

## 📱 Support des navigateurs

- Chrome/Edge 90+
- Firefox 88+
- Safari 14+
- Mobile browsers (iOS Safari, Chrome Android)

## 🚀 Déploiement

### GitHub Pages

Le site est configuré pour être déployé sur GitHub Pages :

```bash
# Construire le site
npm run build

# Le dossier dist/ contient les fichiers prêts pour le déploiement
```

### Autres plateformes

Le build produit des fichiers statiques compatibles avec :
- Netlify
- Vercel
- AWS S3 + CloudFront
- Tout hébergeur de fichiers statiques

## 🐛 Résolution de problèmes

### Le lecteur de musique ne démarre pas automatiquement

Les navigateurs modernes bloquent l'autoplay audio. Le lecteur :
1. Démarre en mode muet
2. Attend une interaction utilisateur
3. Réactive le son après le premier clic

### Les images ne se chargent pas en développement

Vérifiez que les assets sont bien dans `public/assets/` et que les chemins utilisent `/assets/...` (sans le préfixe `public`)

### Erreur au build

```bash
# Nettoyer et réinstaller
rm -rf node_modules dist
npm install
npm run build
```

## 📝 Ajouter un nouveau projet

1. Créer le fichier HTML dans `src/projet-nom.html`
2. Ajouter une carte projet dans `src/projets.html`
3. Mettre à jour `vite.config.js` pour inclure la nouvelle page dans le build

## 📄 Licence

Ce projet est sous licence MIT.

## 👤 Auteur

**Enzo Morello**
- GitHub: [@MalevolentMoksi](https://github.com/MalevolentMoksi)
- GitLab: [morelloe](https://gricad-gitlab.univ-grenoble-alpes.fr/morelloe)

---

*Dernière mise à jour : Février 2026*
