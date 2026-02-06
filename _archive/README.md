# Archive - Fichiers Obsolètes (Transition Vite → React)

Cette archive contient les fichiers générés et configurations pour l'ancienne architecture **Vite multi-page HTML** qui a été complètement migrée vers **React avec routing**.

## 📁 Structure

### `old-pages/` 
Anciens fichiers HTML et dossier Pages d'avant la transition
- **src/*.html** - Pages HTML migrer-pour-Vite (projet-MEGASAE.html, projet-SAE12.html, projets.html, etc.)
- **Pages/** - Dossier originel avec les anciennes pages HTML, CSS, et JS (deprecated)

### `old-vite-setup/`
Configuration et scripts de migration Vite (déjà complétés)
- **migrate.ps1** - Script de migration Vite (complété)
- **update-paths.ps1** - Script de mise à jour des chemins (complété)
- **IMPLEMENTATION.md** - Documentation de l'implémentation Vite
- **MIGRATION-COMPLETE.md** - Documentation de fin de migration Vite
- **A faire.txt** - Liste de tâches anciennes
- **index.html** - Ancien fichier racine Vite

### `old-assets-folders/`
Dossiers d'assets d'avant la restructuration
- **Images/** 
- **Music/**
- **Videos/**
- *(Contenus maintenant en `public/assets/`)*

---

## ✅ Architecture Actuelle (React SPA)

### 🔄 Routage et Pages
```
App.jsx (orchestrateur)
  ├── Home (index)
  ├── Projets (académiques)
  ├── ProjetsPersonnels
  ├── ProjetMEGASAE
  ├── ProjetSAE12
  ├── ProjetSAE3
  ├── ProjetSAE4
  └── ProjetSAE56
```

### 📦 Points d'Entrée
- **src/main.jsx** - Point d'entrée Vite → React
- **src/index.html** - Template HTML unique pour la SPA
- **vite.config.js** - Config pour Vite + React

### 🎨 Styling
- **src/styles/*.css** - Modules CSS importés dans les composants React (ou à migrer vers CSS-in-JS)

---

## 🔍 Quand Restaurer ?
Vous n'aurez jamais besoin de restaurer ces fichiers **sauf si**:
- ❌ Vous revenez à l'architecture Vite multi-page (peu probable)
- ✅ Vous consultez l'historique de migration (documentation de référence)

---

**Archive créée:** Février 2026  
**Raison:** Modernisation React complète
