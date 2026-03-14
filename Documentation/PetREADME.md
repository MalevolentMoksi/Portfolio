# Pet Robot - Module Reference

Reference du sous-systeme pet.
Etat verifie sur le code source le 2026-03-15.

## Fichiers

### petConstants.ts
Constantes partagees:
- timings (DECAY_MS, REACTION_MS, SLEEP_IDLE_MS)
- physique (vitesses, seuils de drag, restitution)
- cooldowns HUD
- cles localStorage
- utilitaires (clamp, getMood, wrappers safeStorage)
- catalogue achievements

### petData.tsx
Donnees visuelles et textuelles:
- mood text pools
- face combos (eyes/mouth)
- thought symbols SVG
- thought pools par etat
- food icons SVG

### RobotFace.tsx
Face SVG animee (Framer Motion):
- yeux adaptes a l'expression
- bouche morphing
- regard (gazeX/gazeY)

### ThoughtBubbleQueue.tsx
Queue de bulles flottantes:
- types symbol | text | reaction
- portal vers document.body
- normalisation via normalizeThought
- limite de concurrence geree par PetButton

### WanderingPet.tsx
Composant de mouvement + HUD:
- boucle RAF physique
- magnet/avoid cursor selon mood
- drag pointer-capture + throw
- rest mode apres scroll idle
- hover sustained -> petted
- HUD dialog (stats, actions, cooldown rings, rename)
- mini-jeu Catch integration
- APIs externes: petGravity, petAttract

### PetButton.tsx
Orchestrateur d'etat:
- spawn/despawn
- stats hunger/happiness
- reactions temporaires
- sommeil et wake
- decay + thriving logic
- combo logic
- achievements
- persistence localStorage
- pont debug global (petReact/getPetStats)

### AchievementsPanel.tsx / CatchGame.tsx
- panneau succes
- mini-jeu attrape de balle

## Flux de donnees

```text
PetButton (state owner)
  -> passe props a WanderingPet
      -> WanderingPet emet callbacks (onInteract/onBehavior/onThought/...)
  -> PetButton met a jour stats/reactions/achievements
  -> PetButton persiste en localStorage
```

## Etat et Persistance

Etat principal (PetButton):
- isSpawned
- stats { hunger, happiness }
- reaction
- thoughtQueue
- cdEnds
- isSleeping
- moodSpinActive
- petName
- feedIconIndex
- achievements
- isCatching

Cles localStorage:
- pet-hunger
- pet-happiness
- pet-spawned
- pet-name
- pet-feedIndex
- pet-achievements
- pet-onboarded

## Regles Comportementales

### Humeur de base
- happy: hunger > 60 et happiness > 60
- content: hunger > 30 et happiness > 30
- sad: sinon

### Decay
- tick toutes les 8s
- hunger chute plus vite que happiness
- thriving (>85/>85) ralentit le declin
- catch game: hunger figee, happiness augmente lentement

### Sommeil
- inactivite > 30s -> isSleeping
- activite utilisateur -> wake + woozy

### Interactions HUD
- feed: +25 hunger, reaction eat
- pet: +20 happiness, reaction petted
- play: +10/+10, reaction play
- catch: ouvre mini-jeu

### Combo
- 3 interactions en 7s -> bonus happiness +8 + excited

## Accessibilite et UX

- bouton header en role switch
- noMotion => pet desactive automatiquement
- HUD en role dialog + fermeture Escape + focus trap
- interactions clavier supportees
- toasts via ToastContext

## APIs debug globales

Disponibles quand le composant est monte:

```javascript
window.petReact('excited');
window.getPetStats();
window.petGravity(3000);
window.petAttract(window.innerWidth / 2, window.innerHeight / 2, 2000);
```

## Fichiers CSS relies

Styles dans:
- src/styles/components/_pet-button.css

Le composant s'appuie aussi sur:
- animations/variables globales dans src/styles/_effects.css et src/styles/_variables.css

## Verification rapide

- spawn/despawn fonctionne
- HUD ouvre/ferme correctement
- cooldowns visuels actives
- decay actif si spawn
- wake/sleep conforme
- mini-jeu catch demarre et termine
- achievements se debloquent
- persistence OK apres reload
