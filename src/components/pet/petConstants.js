/* ══════════════════════════════════════════════
   Pet Robot — constantes, clés localStorage, utilitaires
   ══════════════════════════════════════════════ */

/* ── Timing ── */
export const DECAY_MS = 8000;
export const REACTION_MS = 2000;
export const COOLDOWNS = { feed: 2000, pet: 2000, play: 3000 };

/* ── Dimensions & physique ── */
export const PET_SIZE = 60;
export const HALF = PET_SIZE / 2;
export const HEADER_H = 75; // zone interdite en haut
export const BASE_SPEED = 0.6; // px/frame en balade
export const MAX_SPEED = 1.2; // px/frame max en balade
export const MAGNET_RADIUS = 200; // rayon d'attraction au curseur
export const MAGNET_SPEED = 2.5; // px/frame max sous attraction
export const DRAG_FAST_THRESHOLD = 8; // vitesse (px/frame) à partir de laquelle scale + spin s'activent
export const BOUNCE_RESTITUTION = 0.65; // coefficient de rebond sur les murs
export const THROW_SPEED_CAP = 18; // vitesse max de lancer (px/frame)
export const SLEEP_IDLE_MS = 30_000; // 30 s sans activité → sommeil
export const SCROLL_DIZZY_WINDOW = 1500; // fenêtre de détection scroll rapide (ms)
export const REST_SCROLL_IDLE = 2500; // 2.5s sans scroll → tenter repos

/* ── Catch game ── */
export const CATCH_BALL_SIZE = 22; // diamètre balle
export const CATCH_BALL_SPEED = 12; // lancer initial (px/frame)
export const CATCH_BALL_GRAVITY = 0.15;
export const CATCH_BOT_RADIUS = 55; // distance de détection du bot

/* ── Clés localStorage ── */
export const LS = {
  hunger: 'pet-hunger',
  happiness: 'pet-happiness',
  spawned: 'pet-spawned',
  name: 'pet-name',
  feedIndex: 'pet-feedIndex',
  achievements: 'pet-achievements',
};

/* ── Achievements (id, label, description) ── */
export const ACHIEVEMENTS = [
  { id: 'wall-bounce', label: 'Premier rebond', desc: 'Le robot a rebondi contre un mur' },
  { id: 'pet-action', label: 'Câlin reçu', desc: 'Câliné pour la première fois' },
  { id: 'footer-sit', label: 'Repos sur footer', desc: "Le robot s'est posé sur le pied de page" },
  { id: 'thrive', label: 'Florissant', desc: "Atteint l'état heureux" },
  { id: 'particles', label: 'Sensoriel', desc: 'Le robot a repéré les particules' },
  { id: 'throw', label: 'Lancé !', desc: 'Lancé le robot avec élan' },
  { id: 'catch-game', label: 'Baseball', desc: "Joué au jeu d'attrape" },
  { id: 'sleep', label: 'Bonne nuit', desc: "Le robot s'est endormi" },
  { id: 'combo', label: 'Combo ×3', desc: 'Enchaîné 3 interactions en 7 s' },
  { id: 'rename', label: 'Rebaptisé', desc: 'Donné un nouveau nom au robot' },
  { id: 'neglect', label: 'Têtu', desc: 'Resté triste trop longtemps' },
];

/* ── Utilitaires ── */
export const clamp = (v, min = 0, max = 100) => Math.max(min, Math.min(max, v));

export const readLS = (key, fallback) => {
  const v = localStorage.getItem(key);
  return v !== null ? clamp(Math.round(Number(v))) : fallback;
};

/* ── Humeur dérivée ── */
export const getMood = (hunger, happiness) => {
  if (hunger > 60 && happiness > 60) return 'happy';
  if (hunger > 30 && happiness > 30) return 'content';
  return 'sad';
};

export const pickRandom = (arr) => arr[Math.floor(Math.random() * arr.length)];
