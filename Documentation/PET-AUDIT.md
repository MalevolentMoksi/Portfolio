# Pet System - Behavioral Audit

Audit verifie sur le code source au 2026-03-15.
Scope: src/components/pet/*.tsx + petConstants.ts + petData.tsx.

## 1) Etats d'expression

Le rendu de visage provient de:
- mood de base derive de hunger/happiness
- reaction temporaire (triggerReaction)
- etat sommeil (persistant)

### Moods de base (getMood)
- happy: hunger > 60 et happiness > 60
- content: hunger > 30 et happiness > 30
- sad: sinon

### Reactions temporaires (REACTION_MS = 2000)
Reactions observees dans les triggers:
- woozy
- dizzy
- excited
- scared
- eat
- petted
- play
- happy/content/sad (pulses idle)

Le mode sleep n'est pas une reaction de 2s: c'est un etat persistant active via isSleeping.

## 2) Timings et reglages critiques

Depuis petConstants.ts:
- DECAY_MS: 8000 ms
- REACTION_MS: 2000 ms
- SLEEP_IDLE_MS: 30000 ms
- COOLDOWNS: feed 2000 ms, pet 2000 ms, play 3000 ms
- DRAG_FAST_THRESHOLD: 8 px/frame

## 3) Persistance localStorage

Cles pet principales:
- pet-hunger
- pet-happiness
- pet-spawned
- pet-name
- pet-feedIndex
- pet-achievements
- pet-onboarded

Migration:
- suppression de la cle stale pet-renderer

## 4) Logique de vie

### Spawn
- etat spawned persiste
- au premier spawn: stats forcees a 80/80
- a chaque spawn: reaction woozy
- noMotion (accessibility) force despawn

### Decay
Tick toutes les 8s:
- mode normal: hunger diminue plus vite que happiness
- mode thriving (hunger >85 et happiness >85): decay fortement ralenti (skip probabiliste)
- pendant catch game: hunger figee, happiness augmente doucement

### Sleep
- inactivite > 30s -> isSleeping = true
- activite utilisateur (mousemove/keydown/pointerdown) -> wake + woozy

### Combo
- 3 interactions en 7s -> bonus happiness +8 + reaction excited

## 5) Mouvements et comportements

WanderingPet.tsx:
- boucle RAF avec physique frame-rate independent (dt)
- magnet/repulsion selon mood
- wall bounce avec restitution
- drag pointer-capture + throw momentum
- resting mode apres idle de scroll
- hover sustain 1.5s -> petted + +5 happiness + cascade de thoughts
- focus/accessibilite HUD: role=dialog, escape, focus trap

## 6) Mini-jeu Catch

- activation via action HUD catch
- bot seek/interception de balle
- onBotCatchSuccess: happiness +1 a +10
- unlock achievement catch-game

## 7) Achievements (etat current)

Achievements supportes (petConstants.ts):
- wall-bounce
- pet-action
- footer-sit
- thrive
- particles
- throw
- catch-game
- sleep
- combo
- rename
- neglect

## 8) APIs debug exposees sur window

- petReact(reaction)
- getPetStats()
- petGravity(durationMs)
- petAttract(x, y, durationMs)

## 9) Observations

Aucune incoherence structurelle detectee dans l'architecture pet actuelle.
Le comportement est coherent avec:
- accessibilite (despawn no-motion)
- persistence localStorage
- mode interactif etatful (HUD, cooldowns, achievements, catch)
