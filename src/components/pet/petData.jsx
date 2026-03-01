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
  play: ['Mode jeu activé !', 'Ha ! Je gagne !', 'Partie enregistrée.'],
  sleep: ['Zzz...', 'Mode veille activé...', 'Analyse des rêves en cours...', 'Traitement des souvenirs de la journée...'],
};

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
  sleep:   [{ eyes: 'tired',   mouth: 'content' }],
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
