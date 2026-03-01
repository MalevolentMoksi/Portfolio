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
export const SLEEP_IDLE_MS = 60_000; // 1 minute sans activité → sommeil
export const SCROLL_DIZZY_WINDOW = 1500; // fenêtre de détection scroll rapide (ms)
export const REST_SCROLL_IDLE = 2500; // 2.5s sans scroll → tenter repos

/* ── Clés localStorage ── */
export const LS = {
  hunger: 'pet-hunger',
  happiness: 'pet-happiness',
  spawned: 'pet-spawned',
};

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
