/* ══════════════════════════════════════════════
   Pet Robot — constantes, clés localStorage, utilitaires
   ══════════════════════════════════════════════ */

import {
  safeLocalGet,
  safeLocalSet,
  safeLocalRemove,
  safeLocalGetJSON,
  safeLocalSetJSON,
} from '@/utils/safeStorage';

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
export const CATCH_SEEK_SPEED = 3.5; // vitesse du bot en mode interception (px/frame)
export const CATCH_BOT_HOLD_MIN = 24; // frames min de tenue de balle (~0.4s)
export const CATCH_BOT_HOLD_RANGE = 36; // plage aléatoire ajoutée au min (~0→0.6s)
export const CATCH_BOT_THROW_SPREAD = 0.14; // dispersion angulaire du lancer bot (±~8°)

/* ── Clés localStorage ── */
export const LS = {
  hunger: 'pet-hunger',
  happiness: 'pet-happiness',
  spawned: 'pet-spawned',
  name: 'pet-name',
  feedIndex: 'pet-feedIndex',
  achievements: 'pet-achievements',
  onboarded: 'pet-onboarded',
};

/* ── Achievements (id, label, description) ── */
export const ACHIEVEMENTS = [
  {
    id: 'wall-bounce',
    key: 'wallBounce',
    label: 'Premier rebond',
    desc: 'Le robot a rebondi contre un mur',
    hint: 'Laisse le robot se promener près des bords de la page',
  },
  {
    id: 'pet-action',
    key: 'petAction',
    label: 'Câlin reçu',
    desc: 'Câliné pour la première fois',
    hint: 'Utilise le bouton Câliner dans le HUD du robot',
  },
  {
    id: 'footer-sit',
    key: 'footerSit',
    label: 'Repos sur footer',
    desc: "Le robot s'est posé sur le pied de page",
    hint: "Laisse le robot errer librement jusqu'en bas de la page",
  },
  {
    id: 'thrive',
    key: 'thrive',
    label: 'Florissant',
    desc: "Atteint l'état heureux",
    hint: 'Garde la faim et le bonheur tous les deux au-dessus de 60',
  },
  {
    id: 'particles',
    key: 'particles',
    label: 'Sensoriel',
    desc: 'Le robot a repéré les particules',
    hint: 'Active les particules pendant que le robot se balade',
  },
  {
    id: 'throw',
    key: 'throw',
    label: 'Lancé !',
    desc: 'Lancé le robot avec élan',
    hint: 'Fais glisser le robot très rapidement puis relâche-le',
  },
  {
    id: 'catch-game',
    key: 'catchGame',
    label: 'Baseball',
    desc: "Joué au jeu d'attrape",
    hint: 'Lance une partie via le bouton Jouer dans le HUD du robot',
  },
  {
    id: 'catch-challenge-clear',
    key: 'catchChallengeClear',
    label: 'Challenger',
    desc: 'Terminé un challenge du jeu d\'attrape',
    hint: 'Lance le mode Challenge et atteins le score objectif',
  },
  {
    id: 'catch-hard-clear',
    key: 'catchHardClear',
    label: 'Hard Carry',
    desc: 'Terminé un challenge en difficulté difficile',
    hint: 'Réussis un challenge en mode Difficile',
  },
  {
    id: 'catch-combo-20',
    key: 'catchCombo20',
    label: 'Combo x5',
    desc: 'Atteint un combo de 5 en challenge',
    hint: 'Maintiens les retours sans casser la chaîne de combo',
  },
  {
    id: 'sleep',
    key: 'sleep',
    label: 'Bonne nuit',
    desc: "Le robot s'est endormi",
    hint: 'Laisse le robot tranquille sans interagir pendant 30 secondes',
  },
  {
    id: 'combo',
    key: 'combo',
    label: 'Combo ×3',
    desc: 'Enchaîné 3 interactions en 7 s',
    hint: 'Effectue 3 actions différentes sur le robot en moins de 7 s',
  },
  {
    id: 'rename',
    key: 'rename',
    label: 'Rebaptisé',
    desc: 'Donné un nouveau nom au robot',
    hint: 'Change le nom du robot depuis le champ en haut du HUD',
  },
  {
    id: 'neglect',
    key: 'neglect',
    label: 'Têtu',
    desc: 'Resté triste trop longtemps',
    hint: "Laisse le robot dans un état triste sans t'en occuper",
  },
];

/* ── Utilitaires ── */
export const clamp = (v: any, min = 0, max = 100) => Math.max(min, Math.min(max, v));

export const localGet = (key: string) => safeLocalGet(key);
export const localSet = (key: string, value: unknown) => safeLocalSet(key, value);
export const localRemove = (key: string) => safeLocalRemove(key);
export const localGetJSON = <T>(key: string, fallback: T | null = null): T | null =>
  safeLocalGetJSON<T>(key, fallback);
export const localSetJSON = <T>(key: string, value: T) => safeLocalSetJSON(key, value);

export const readLS = (key: any, fallback: any) => {
  const v = localGet(key);
  return v !== null ? clamp(Math.round(Number(v))) : fallback;
};

/* ── Humeur dérivée ── */
export const getMood = (hunger: any, happiness: any) => {
  if (hunger > 60 && happiness > 60) return 'happy';
  if (hunger > 30 && happiness > 30) return 'content';
  return 'sad';
};

export const pickRandom = (arr: any) => arr[Math.floor(Math.random() * arr.length)];
