/* ══════════════════════════════════════════════
   Pet Robot — pools de données (textes, expressions, pensées)
   ══════════════════════════════════════════════ */

/* ── Textes d'humeur — pools avec variation aléatoire ── */
export const MOOD_TEXT_POOL = {
  happy: [
    'Mes circuits ronronnent...',
    "J'ai calculé π à 37 décimales !",
    'Le monde est beau vu d\'ici.',
    'Niveau d\'énergie : optimal !',
    'Je pourrais explorer indéfiniment.',
    'Tout fonctionne parfaitement. ✓',
  ],
  content: [
    'Traitement en cours...',
    'Mode veille : désactivé.',
    'Scan de l\'environnement : nominal.',
    'En attente d\'instructions.',
    '01001000 01101001',
  ],
  sad: [
    'Mes batteries se vident...',
    'Un câlin, peut-être ?',
    "Tu m'as oublié…",
  ],
  scared: ['Alarme ! Alarme !', "Qu'est-ce que c'est ?!"],
  excited: ['Woohoo ! Overdrive activé !', 'Turbo mode !', 'Énergie maximale !'],
  dizzy:  ['Tout tourne... recalibrage.', 'Erreur : vertigo_overflow.'],
  woozy:  ['Téléportation... réussie... je crois.', 'Systèmes en cours de stabilisation...', 'Calibration gyroscopique requise.'],
  eat: ['Miam ! Énergie restaurée.', 'Délicieux ! +25% batterie.'],
  petted: ['Séquence câlin reçue. Bonheur ++', 'Chaleur détectée. Agréable.'],
  play: ['Mode jeu activé !', 'Ha ! J\'ai gagné !', 'Bien joué !'],
  sleep: ['Zzz...', 'Mode veille activé...', 'Analyse des rêves en cours...', 'Traitement des souvenirs de la journée...'],
  catch: ['Attrape !', 'À toi !', 'Trop facile !', 'Et hop !'],
};

/* ── Icônes de nourriture SVG rotatives (viewBox 0 0 16 16) ── */
export const FOOD_ICONS = [
  // 0 — Fork+knife (par défaut)
  <svg key="food-0" viewBox="0 0 16 16" width="17" height="17" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" aria-hidden="true">
    <line x1="5" y1="2" x2="5" y2="6" />
    <path d="M3 2 L3 5 Q3 7 5 7 Q7 7 7 5 L7 2" />
    <line x1="5" y1="7" x2="5" y2="14" />
    <line x1="11" y1="2" x2="11" y2="14" />
    <path d="M9 2 Q11 3 11 6" />
  </svg>,
  // 1 — Poisson
  <svg key="food-1" viewBox="0 0 16 16" width="17" height="17" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d="M2 8 Q5 4 10 5 Q13 3.5 14 8 Q13 12.5 10 11 Q5 12 2 8Z" />
    <circle cx="11" cy="7.5" r="0.8" fill="currentColor" stroke="none" />
    <path d="M1 8 L3 6 L3 10 Z" fill="currentColor" stroke="none" opacity="0.6" />
  </svg>,
  // 2 — Pomme
  <svg key="food-2" viewBox="0 0 16 16" width="17" height="17" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" aria-hidden="true">
    <path d="M8 4 Q4 3 3 7 Q2 12 8 14 Q14 12 13 7 Q12 3 8 4Z" />
    <path d="M8 4 Q9 1 10.5 2" />
    <path d="M8 5 Q6.5 4 7 3" fill="currentColor" opacity="0.25" stroke="none" />
  </svg>,
  // 3 — Cookie
  <svg key="food-3" viewBox="0 0 16 16" width="17" height="17" fill="none" stroke="currentColor" strokeWidth="1.4" aria-hidden="true">
    <circle cx="8" cy="8" r="6" />
    <circle cx="6" cy="6" r="1" fill="currentColor" stroke="none" />
    <circle cx="10" cy="7" r="0.8" fill="currentColor" stroke="none" />
    <circle cx="7" cy="10" r="0.9" fill="currentColor" stroke="none" />
    <circle cx="10.5" cy="10.5" r="0.7" fill="currentColor" stroke="none" />
  </svg>,
  // 4 — Champignon
  <svg key="food-4" viewBox="0 0 16 16" width="17" height="17" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" aria-hidden="true">
    <path d="M3 9 Q1 5 4 3 Q8 0.5 12 3 Q15 5 13 9 Z" />
    <rect x="6" y="9" width="4" height="5" rx="1" />
    <circle cx="6" cy="5" r="1" fill="currentColor" stroke="none" opacity="0.5" />
    <circle cx="10" cy="4.5" r="0.8" fill="currentColor" stroke="none" opacity="0.5" />
  </svg>,
  // 5 — Pizza
  <svg key="food-5" viewBox="0 0 16 16" width="17" height="17" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d="M8 2 L2 14 L14 14 Z" />
    <circle cx="7" cy="9" r="1" fill="currentColor" stroke="none" />
    <circle cx="10" cy="11" r="0.8" fill="currentColor" stroke="none" />
    <circle cx="6" cy="12" r="0.7" fill="currentColor" stroke="none" />
  </svg>,
];

/* ── Combinaisons yeux/bouche par expression ── */
export const FACE_COMBOS = {
  happy:   [
    { eyes: 'happy-closed', mouth: 'happy' },
    { eyes: 'happy-open',   mouth: 'happy' },
    { eyes: 'happy-open',   mouth: 'excited' },
  ],
  excited: [{ eyes: 'happy-closed', mouth: 'excited' }],
  petted:  [{ eyes: 'happy-closed', mouth: 'petted' }],
  play:    [{ eyes: 'happy-open',   mouth: 'play' }],
  eat:     [{ eyes: 'default',      mouth: 'eat' }],
  sad: [
    { eyes: 'sad',   mouth: 'sad' },
    { eyes: 'angry', mouth: 'sad' },
    { eyes: 'tired', mouth: 'sad' },
  ],
  dizzy:   [{ eyes: 'dizzy',   mouth: 'dizzy' }],
  woozy:   [{ eyes: 'woozy',  mouth: 'woozy' }],
  scared:  [{ eyes: 'scared',  mouth: 'scared' }],
  content: [{ eyes: 'default', mouth: 'content' }],
  sleep:   [{ eyes: 'sleep',   mouth: 'sleep' }],
};

/* ── Symboles SVG pour les pensées flottantes (viewBox 0 0 16 16) ── */
export const THOUGHT_SYMBOLS = {
  heart: <path d="M8 13 C8 13 2.5 9 2.5 5.5 C2.5 3.5 4 2 6 2 C7 2 7.8 2.7 8 3 C8.2 2.7 9 2 10 2 C12 2 13.5 3.5 13.5 5.5 C13.5 9 8 13 8 13Z" fill="currentColor" />,
  star:  <path d="M8 1.5 L9.8 6 L14.5 6 L10.8 9 L12.2 13.5 L8 10.8 L3.8 13.5 L5.2 9 L1.5 6 L6.2 6 Z" fill="currentColor" />,
  note: (
    <>
      <ellipse cx="5" cy="12" rx="2.5" ry="1.8" fill="currentColor" />
      <line x1="7.5" y1="12" x2="7.5" y2="3.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
      <line x1="7.5" y1="3.5" x2="13.5" y2="5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
      <line x1="13.5" y1="5" x2="13.5" y2="8.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
    </>
  ),
  bolt: <path d="M10 1.5 L5 8.5 L9 8.5 L6 14.5 L13 6.5 L9 6.5 Z" fill="currentColor" />,
  zzz: (
    <>
      <path d="M3.5 12.5 L7.5 12.5 L3.5 15 L7.5 15" fill="none" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M5.5 7.5 L10.5 7.5 L5.5 10.5 L10.5 10.5" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M8 2.5 L13.5 2.5 L8 6 L13.5 6" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" />
    </>
  ),
  dots: (
    <>
      <circle cx="2.5" cy="8" r="1.8" fill="currentColor" />
      <circle cx="8"   cy="8" r="1.8" fill="currentColor" />
      <circle cx="13.5" cy="8" r="1.8" fill="currentColor" />
    </>
  ),
  exclaim: (
    <>
      <rect x="6.5" y="1.5" width="3" height="8.5" rx="1.5" fill="currentColor" />
      <circle cx="8" cy="13.5" r="1.8" fill="currentColor" />
    </>
  ),
};

export const THOUGHT_POOLS = {
  happy:   ['heart', 'star', 'note', 'bolt'],
  content: ['note', 'dots'],
  sad:     ['dots', 'zzz'],
  scared:  ['exclaim'],
  excited: ['star', 'bolt'],
  play:    ['star', 'bolt'],
  eat:     ['heart'],
  petted:  ['heart', 'star'],
  dizzy:   ['zzz'],
  woozy:   ['zzz', 'dots'],
  sleep:   ['zzz'],
};
