/**
 * FooterWalkers — Petits personnages-silhouettes qui traversent le bord
 * supérieur du footer en suivant des scripts pré-définis.
 *
 * Chaque « script » décrit un voyage complet : un personnage entre
 * d'un côté, effectue des actions (pause, scan, feu de camp, hologramme
 * Ghost) et sort de l'autre côté. Un nouveau script est lancé après
 * un intervalle aléatoire (15-45 s).
 *
 * Mouvement piloté par requestAnimationFrame + DOM direct (`style.left`)
 * pour éviter un re-render React à chaque frame. React ne gère que les
 * transitions de phase (changement d'état/action).
 *
 * Performance-gated : rien sur low tier, max 1 personnage sur mid,
 * scripts duo autorisés sur high.
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import { createPortal } from 'react-dom';
import { isLowTier, isHighTier } from '@utils/performanceTier.js';

/* ═══════════════════════════════════════════
   Constantes
   ═══════════════════════════════════════════ */

/** Vitesse de marche en % de la largeur footer par seconde */
const WALK_SPEED = 3.8;

/** Délai avant le premier script (ms) */
const FIRST_DELAY_MS = 8_000;

/** Fourchette d'attente entre deux scripts (ms) */
const MIN_GAP_MS = 18_000;
const MAX_GAP_MS = 45_000;

/** Seuil de proximité curseur pour la rotation de la tête (px) */
const MOUSE_RANGE_X = 120;
const MOUSE_RANGE_Y = 70;
const MAX_LOOK_DEG = 22;

/* ─── Waypoints (% horizontal du footer) ─── */
const WP = {
  exitL: -5,
  dioramaL: 12,
  campfireL: 26,
  center: 50,
  campfireR: 72,
  dioramaR: 86,
  exitR: 105,
};

/* ═══════════════════════════════════════════
   SVG — Personnages
   ═══════════════════════════════════════════ */

/**
 * Guardian — silhouette blindée Destiny-like.
 * ~20 px de haut, strokeWidth fin pour un rendu « tampon encre ».
 * La tête (<g className="walker-head">) est séparée pour la rotation curseur.
 */
const GuardianSVG = () => (
  <svg viewBox="0 0 20 28" width="20" height="28" fill="none" aria-hidden="true">
    {/* Jambes */}
    <line x1="8" y1="20" x2="6" y2="27" stroke="currentColor" strokeWidth="1.1" strokeLinecap="round" />
    <line x1="12" y1="20" x2="14" y2="27" stroke="currentColor" strokeWidth="1.1" strokeLinecap="round" />
    {/* Bottes — petits rectangles horizontaux */}
    <line x1="4.5" y1="27" x2="7.5" y2="27" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" />
    <line x1="12.5" y1="27" x2="15.5" y2="27" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" />
    {/* Torse */}
    <path d="M7 12 L7 20 L13 20 L13 12 Z" stroke="currentColor" strokeWidth="1" />
    {/* Épaulettes — triangles larges */}
    <path d="M3 12 L7 10 L7 14 Z" stroke="currentColor" strokeWidth="0.8" fill="currentColor" opacity="0.35" />
    <path d="M17 12 L13 10 L13 14 Z" stroke="currentColor" strokeWidth="0.8" fill="currentColor" opacity="0.35" />
    {/* Taille — ceinture */}
    <line x1="6.5" y1="17" x2="13.5" y2="17" stroke="currentColor" strokeWidth="1.2" />
    <rect x="9" y="16" width="2" height="2" rx="0.5" fill="currentColor" opacity="0.5" />
    {/* Bras */}
    <line x1="4" y1="12.5" x2="4" y2="18" stroke="currentColor" strokeWidth="0.9" strokeLinecap="round" />
    <line x1="16" y1="12.5" x2="16" y2="18" stroke="currentColor" strokeWidth="0.9" strokeLinecap="round" />
    {/* Tête — casque arrondi + visière */}
    <g className="walker-head">
      <path d="M7 10 Q7 4, 10 3 Q13 4, 13 10" stroke="currentColor" strokeWidth="1" fill="none" />
      <line x1="7.5" y1="7.5" x2="12.5" y2="7.5" stroke="currentColor" strokeWidth="0.7" opacity="0.7" />
      {/* Visière — fente horizontale */}
      <rect x="8" y="6.6" width="4" height="1.4" rx="0.6" fill="currentColor" opacity="0.55" />
    </g>
    {/* Mark — petit détail classe sur le torse */}
    <line x1="9" y1="13" x2="11" y2="13" stroke="currentColor" strokeWidth="0.5" opacity="0.4" />
    <line x1="10" y1="12.2" x2="10" y2="14" stroke="currentColor" strokeWidth="0.5" opacity="0.4" />
  </svg>
);

/**
 * Explorer — silhouette à capuche, cape, bâton de marche.
 * Plus mince que le Guardian, allure de voyageur.
 */
const ExplorerSVG = () => (
  <svg viewBox="0 0 22 28" width="22" height="28" fill="none" aria-hidden="true">
    {/* Jambes */}
    <line x1="9" y1="20" x2="7.5" y2="27" stroke="currentColor" strokeWidth="1" strokeLinecap="round" />
    <line x1="12" y1="20" x2="13.5" y2="27" stroke="currentColor" strokeWidth="1" strokeLinecap="round" />
    {/* Bottes */}
    <line x1="6" y1="27" x2="9" y2="27" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" />
    <line x1="12" y1="27" x2="15" y2="27" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" />
    {/* Corps — tunique */}
    <path d="M8 11 L7 20 L14 20 L13 11 Z" stroke="currentColor" strokeWidth="0.9" fill="none" />
    {/* Cape — tombe dans le dos */}
    <path d="M8 9 Q6 12, 5 20 Q5.5 21, 7 20" stroke="currentColor" strokeWidth="0.7" opacity="0.5" fill="none" />
    {/* Sac à dos */}
    <rect x="5" y="12" width="2.5" height="4" rx="0.8" stroke="currentColor" strokeWidth="0.7" opacity="0.5" />
    {/* Bras gauche (tient le bâton) */}
    <line x1="7" y1="12" x2="4" y2="17" stroke="currentColor" strokeWidth="0.8" strokeLinecap="round" />
    {/* Bras droit */}
    <line x1="14" y1="12" x2="16" y2="17" stroke="currentColor" strokeWidth="0.8" strokeLinecap="round" />
    {/* Bâton de marche (long, dépasse vers le haut) */}
    <line x1="3.5" y1="5" x2="3.5" y2="27" stroke="currentColor" strokeWidth="0.8" opacity="0.6" strokeLinecap="round" />
    {/* Tête — capuche */}
    <g className="walker-head">
      <path d="M8 10 Q8 4, 10.5 3 Q13 4, 13 8 L13 10" stroke="currentColor" strokeWidth="1" fill="none" />
      {/* Ombre du visage sous la capuche */}
      <ellipse cx="10.5" cy="7.8" rx="1.8" ry="1.2" fill="currentColor" opacity="0.3" />
      {/* Yeux — deux petits points */}
      <circle cx="9.8" cy="7.4" r="0.5" fill="currentColor" opacity="0.6" />
      <circle cx="11.4" cy="7.4" r="0.5" fill="currentColor" opacity="0.6" />
    </g>
  </svg>
);

/* ═══════════════════════════════════════════
   SVG — Accessoires de scène
   ═══════════════════════════════════════════ */

/**
 * Ghost — diamant géométrique Destiny-like (~12×14 px).
 * Corps octaédrique, iris central lumineux.
 */
const GhostSVG = () => (
  <svg className="walker-ghost" viewBox="0 0 14 16" width="14" height="16" fill="none" aria-hidden="true">
    {/* Coque extérieure — octaèdre simplifié en losange */}
    <path
      d="M7 1 L12.5 6 L12 10 L7 15 L2 10 L1.5 6 Z"
      stroke="currentColor" strokeWidth="0.8" fill="none" opacity="0.9"
    />
    {/* Facettes internes — lignes structurelles */}
    <line x1="7" y1="1" x2="7" y2="15" stroke="currentColor" strokeWidth="0.3" opacity="0.25" />
    <line x1="1.5" y1="6" x2="12.5" y2="6" stroke="currentColor" strokeWidth="0.3" opacity="0.25" />
    <line x1="2" y1="10" x2="12" y2="10" stroke="currentColor" strokeWidth="0.3" opacity="0.25" />
    {/* Iris central — losange lumineux */}
    <path
      d="M7 5 L9.5 8 L7 11 L4.5 8 Z"
      stroke="currentColor" strokeWidth="0.6" fill="currentColor" opacity="0.5"
    />
    {/* Pupille — fente verticale */}
    <ellipse cx="7" cy="8" rx="0.7" ry="2" fill="currentColor" opacity="0.7" />
    {/* Petits détails de coque */}
    <circle cx="4" cy="4" r="0.4" fill="currentColor" opacity="0.3" />
    <circle cx="10" cy="4" r="0.4" fill="currentColor" opacity="0.3" />
    <line x1="3" y1="8" x2="4.5" y2="8" stroke="currentColor" strokeWidth="0.4" opacity="0.3" />
    <line x1="9.5" y1="8" x2="11" y2="8" stroke="currentColor" strokeWidth="0.4" opacity="0.3" />
  </svg>
);

/**
 * Feu de camp — bûches croisées + 3 flammes animées + lueur au sol.
 */
const CampfireSVG = () => (
  <svg className="walker-campfire" viewBox="0 0 20 16" width="20" height="16" fill="none" aria-hidden="true">
    {/* Bûches */}
    <line x1="4" y1="14" x2="16" y2="12" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" opacity="0.6" />
    <line x1="5" y1="12" x2="15" y2="14" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" opacity="0.6" />
    {/* Braises au sol — halo */}
    <ellipse cx="10" cy="14" rx="6" ry="1.5" fill="currentColor" opacity="0.12" />
    {/* Flammes (3 gouttes empilées, animées en CSS) */}
    <path className="campfire-flame campfire-flame--1"
      d="M10 11 Q8 8, 10 4 Q12 8, 10 11 Z"
      fill="currentColor" stroke="none" opacity="0.65"
    />
    <path className="campfire-flame campfire-flame--2"
      d="M8 12 Q6.5 9, 8 6 Q9.5 9, 8 12 Z"
      fill="currentColor" stroke="none" opacity="0.45"
    />
    <path className="campfire-flame campfire-flame--3"
      d="M12 12 Q10.5 9, 12 6 Q13.5 9, 12 12 Z"
      fill="currentColor" stroke="none" opacity="0.45"
    />
    {/* Étincelles — petits points montent */}
    <circle className="campfire-spark campfire-spark--1" cx="9" cy="5" r="0.5" fill="currentColor" opacity="0.5" />
    <circle className="campfire-spark campfire-spark--2" cx="11" cy="3.5" r="0.4" fill="currentColor" opacity="0.4" />
    <circle className="campfire-spark campfire-spark--3" cx="10" cy="2" r="0.3" fill="currentColor" opacity="0.35" />
  </svg>
);

/* ═══════════════════════════════════════════
   Scripts de voyage
   ═══════════════════════════════════════════ */

/**
 * Chaque script est un tableau de « phases ».
 * Phase = { action, x, duration? }
 *
 *  - 'enter'  : spawn à `x`, invisible → fade in
 *  - 'walkTo' : se déplacer vers `x` (durée calculée automatiquement)
 *  - 'scan'   : s'arrêter `duration` ms, posture « scan »
 *  - 'ghost'  : afficher le Ghost au-dessus du personnage `duration` ms
 *  - 'sit'    : s'asseoir (feu de camp), `duration` ms
 *  - 'exit'   : marcher vers `x` puis fade out + supprimer
 */

const SCRIPTS = [
  /* Patrouille rapide — Guardian traverse d'un bout à l'autre */
  {
    id: 'quick_patrol',
    character: 'guardian',
    soloOnly: false,
    weight: 3,
    phases: [
      { action: 'enter', x: WP.exitL },
      { action: 'walkTo', x: WP.exitR },
      { action: 'exit' },
    ],
  },
  /* Scan & Move — Explorer inspecte les deux dioramas */
  {
    id: 'scan_and_move',
    character: 'explorer',
    soloOnly: false,
    weight: 3,
    phases: [
      { action: 'enter', x: WP.exitR },
      { action: 'walkTo', x: WP.dioramaR },
      { action: 'scan', duration: 3200 },
      { action: 'walkTo', x: WP.dioramaL },
      { action: 'scan', duration: 2400 },
      { action: 'walkTo', x: WP.exitL },
      { action: 'exit' },
    ],
  },
  /* Ghost Protocol — Guardian invoque un spectre holographique */
  {
    id: 'ghost_protocol',
    character: 'guardian',
    soloOnly: false,
    weight: 2,
    phases: [
      { action: 'enter', x: WP.exitL },
      { action: 'walkTo', x: WP.center },
      { action: 'ghost', duration: 5000 },
      { action: 'walkTo', x: WP.exitR },
      { action: 'exit' },
    ],
  },
  /* Campfire Rest — Explorer se repose auprès d'un feu de camp */
  {
    id: 'campfire_rest',
    character: 'explorer',
    soloOnly: false,
    weight: 2,
    phases: [
      { action: 'enter', x: WP.exitR },
      { action: 'walkTo', x: WP.campfireR },
      { action: 'sit', duration: 11_000 },
      { action: 'walkTo', x: WP.exitL },
      { action: 'exit' },
    ],
  },
  /* Duo Patrol — Guardian <-> Explorer se croisent (high tier) */
  {
    id: 'duo_patrol',
    character: 'guardian', // secondary sera explorer
    soloOnly: false,
    duo: true,
    weight: 1,
    phases: [
      { action: 'enter', x: WP.exitL },
      { action: 'walkTo', x: WP.exitR },
      { action: 'exit' },
    ],
    secondaryPhases: [
      { action: 'enter', x: WP.exitR },
      { action: 'walkTo', x: WP.exitL },
      { action: 'exit' },
    ],
  },
];

/* ─── Helpers ─── */

const randomBetween = (min, max) => Math.random() * (max - min) + min;

/** Sélection pondérée parmi les scripts disponibles */
const pickScript = (allowDuo) => {
  const pool = SCRIPTS.filter(s => allowDuo || !s.duo);
  const totalW = pool.reduce((s, sc) => s + sc.weight, 0);
  let r = Math.random() * totalW;
  for (const sc of pool) {
    r -= sc.weight;
    if (r <= 0) return sc;
  }
  return pool[pool.length - 1];
};

/* ═══════════════════════════════════════════
   Composant interne : un walker individuel
   ═══════════════════════════════════════════ */

/**
 * SingleWalker — un personnage SVG positionné en absolu au-dessus
 * du footer. Le mouvement est piloté par le parent via `targetX` /
 * `phaseAction`. Le walker gère l'animation locale (bob, scan, sit).
 */
const CHARACTERS = { guardian: GuardianSVG, explorer: ExplorerSVG };

const SingleWalker = ({ id: walkerId, character, startX, phases, footerRef, onDone }) => {
  const elRef = useRef(null);
  const headRef = useRef(null);
  const xRef = useRef(startX);
  const phaseIdxRef = useRef(0);
  const facingRef = useRef(1); // 1 = droite, -1 = gauche
  const rafRef = useRef(null);
  const timerRef = useRef(null);
  const prevTimeRef = useRef(null);
  const mountedRef = useRef(true);
  const doneRef = useRef(false);

  const [phaseAction, setPhaseAction] = useState('enter');
  const [showGhost, setShowGhost] = useState(false);
  const [showCampfire, setShowCampfire] = useState(false);
  const [visible, setVisible] = useState(false);

  const CharSVG = CHARACTERS[character] || GuardianSVG;

  /** Convertit un x% en pixels via la largeur du footer */
  const xToPx = useCallback(() => {
    const footer = footerRef.current;
    if (!footer) return 0;
    return (xRef.current / 100) * footer.offsetWidth;
  }, [footerRef]);

  /** Applique la position x courante sur le DOM */
  const applyPosition = useCallback(() => {
    if (!elRef.current) return;
    const px = xToPx();
    // Utilise transform pour la position ET le flip — left n'est plus touché.
    // translateX est composité GPU ; left forcerait layout + paint à chaque frame.
    elRef.current.style.transform = `translateX(${px}px) scaleX(${facingRef.current})`;
  }, [xToPx]);

  /** Avance vers la phase suivante */
  const nextPhase = useCallback(() => {
    if (!mountedRef.current || doneRef.current) return;
    phaseIdxRef.current += 1;
    if (phaseIdxRef.current >= phases.length) {
      doneRef.current = true;
      onDone(walkerId);
      return;
    }
    runPhase(); // eslint-disable-line
  }, [phases, onDone, walkerId]);

  /** Exécute la phase courante */
  const runPhase = useCallback(() => {
    if (!mountedRef.current || doneRef.current) return;
    const phase = phases[phaseIdxRef.current];
    if (!phase) { doneRef.current = true; onDone(walkerId); return; }

    switch (phase.action) {
      case 'enter': {
        xRef.current = phase.x;
        applyPosition();
        // Déterminer la direction initiale (vers le prochain walkTo)
        const nextWalk = phases.find((p, i) => i > phaseIdxRef.current && p.action === 'walkTo');
        if (nextWalk) facingRef.current = nextWalk.x > phase.x ? 1 : -1;
        setPhaseAction('enter');
        // Petit délai de fade-in
        timerRef.current = setTimeout(() => { setVisible(true); nextPhase(); }, 600);
        break;
      }

      case 'walkTo': {
        const targetX = phase.x;
        facingRef.current = targetX > xRef.current ? 1 : -1;
        applyPosition();
        setPhaseAction('walking');
        prevTimeRef.current = null;

        const walk = (ts) => {
          if (!mountedRef.current || doneRef.current) return;
          if (prevTimeRef.current === null) { prevTimeRef.current = ts; }
          const dt = Math.min((ts - prevTimeRef.current) / 1000, 0.1); // cap delta
          prevTimeRef.current = ts;

          const dir = targetX > xRef.current ? 1 : -1;
          xRef.current += dir * WALK_SPEED * dt;

          // Arrivé à destination ?
          if ((dir > 0 && xRef.current >= targetX) || (dir < 0 && xRef.current <= targetX)) {
            xRef.current = targetX;
            applyPosition();
            nextPhase();
            return;
          }
          applyPosition();
          rafRef.current = requestAnimationFrame(walk);
        };
        rafRef.current = requestAnimationFrame(walk);
        break;
      }

      case 'scan': {
        setPhaseAction('scanning');
        timerRef.current = setTimeout(nextPhase, phase.duration);
        break;
      }

      case 'ghost': {
        setPhaseAction('invoking');
        // Ghost apparaît après 0.4 s (pose d'invocation)
        timerRef.current = setTimeout(() => {
          if (!mountedRef.current) return;
          setShowGhost(true);
          timerRef.current = setTimeout(() => {
            if (!mountedRef.current) return;
            setShowGhost(false);
            timerRef.current = setTimeout(nextPhase, 500);
          }, phase.duration);
        }, 400);
        break;
      }

      case 'sit': {
        setPhaseAction('sitting');
        setShowCampfire(true);
        timerRef.current = setTimeout(() => {
          if (!mountedRef.current) return;
          setShowCampfire(false);
          setPhaseAction('standing');
          timerRef.current = setTimeout(nextPhase, 700);
        }, phase.duration);
        break;
      }

      case 'exit': {
        setVisible(false);
        timerRef.current = setTimeout(() => {
          doneRef.current = true;
          if (mountedRef.current) onDone(walkerId);
        }, 600);
        break;
      }

      default:
        nextPhase();
    }
  }, [phases, applyPosition, nextPhase, onDone, walkerId]);

  // Lancer la première phase au montage
  useEffect(() => {
    mountedRef.current = true;
    runPhase();
    return () => {
      mountedRef.current = false;
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // Cursor proximity — head look
  useEffect(() => {
    let gateRaf = false;
    const onMove = (e) => {
      if (gateRaf) return;
      gateRaf = true;
      requestAnimationFrame(() => {
        gateRaf = false;
        if (!headRef.current || !elRef.current || !footerRef.current) return;
        const footer = footerRef.current;
        const rect = footer.getBoundingClientRect();
        const walkerPxX = (xRef.current / 100) * footer.offsetWidth + rect.left;
        const walkerPxY = rect.top - 14; // Walker est au-dessus du footer
        const dx = e.clientX - walkerPxX;
        const dy = e.clientY - walkerPxY;
        if (Math.abs(dx) < MOUSE_RANGE_X && Math.abs(dy) < MOUSE_RANGE_Y) {
          const angle = Math.atan2(dy, dx) * (180 / Math.PI);
          const clamped = Math.max(-MAX_LOOK_DEG, Math.min(MAX_LOOK_DEG, angle * 0.35));
          headRef.current.style.transform = `rotate(${clamped}deg)`;
        } else {
          headRef.current.style.transform = '';
        }
      });
    };
    window.addEventListener('mousemove', onMove, { passive: true });
    return () => window.removeEventListener('mousemove', onMove);
  }, [footerRef]);

  // Attacher headRef au vrai DOM après render
  useEffect(() => {
    if (elRef.current) {
      headRef.current = elRef.current.querySelector('.walker-head');
    }
  });

  return (
    <div
      ref={elRef}
      className={[
        'footer-walker',
        `walker--${phaseAction}`,
        visible ? 'walker--visible' : '',
      ].join(' ')}
      data-character={character}
      aria-hidden="true"
    >
      <div className="walker-body">
        <CharSVG />
      </div>
      {/* Ghost hologramme — flotte au-dessus */}
      <div className={`walker-ghost-slot ${showGhost ? 'walker-ghost-slot--active' : ''}`}>
        <GhostSVG />
      </div>
      {/* Feu de camp — affiché à côté */}
      <div className={`walker-campfire-slot ${showCampfire ? 'walker-campfire-slot--active' : ''}`}>
        <CampfireSVG />
      </div>
    </div>
  );
};

/* ═══════════════════════════════════════════
   Composant principal
   ═══════════════════════════════════════════ */

const FooterWalkers = () => {
  const [walkers, setWalkers] = useState([]);
  const footerRef = useRef(null);
  const spawnTimerRef = useRef(null);
  const mountedRef = useRef(true);
  const activeKeyRef = useRef(0);

  // Résoudre le footer au montage
  useEffect(() => {
    footerRef.current = document.querySelector('footer.site-footer') || document.querySelector('footer');
  }, []);

  /** Retire un walker terminé et planifie le prochain */
  const handleWalkerDone = useCallback((walkerId) => {
    if (!mountedRef.current) return;
    setWalkers(prev => prev.filter(w => w.id !== walkerId));
  }, []);

  /** Lance un script (ou type forcé via console) */
  const spawnScript = useCallback((scriptId) => {
    if (!mountedRef.current || !footerRef.current) return;
    if (spawnTimerRef.current) { clearTimeout(spawnTimerRef.current); spawnTimerRef.current = null; }

    const allowDuo = isHighTier();
    const script = scriptId
      ? SCRIPTS.find(s => s.id === scriptId) || pickScript(allowDuo)
      : pickScript(allowDuo);

    const key = ++activeKeyRef.current;
    const newWalkers = [];

    // Walker principal
    newWalkers.push({
      id: `w-${key}`,
      key: `w-${key}`,
      character: script.character,
      startX: script.phases[0].x,
      phases: script.phases,
    });

    // Walker secondaire (duo script)
    if (script.duo && script.secondaryPhases && allowDuo) {
      newWalkers.push({
        id: `w-${key}-b`,
        key: `w-${key}-b`,
        character: 'explorer',
        startX: script.secondaryPhases[0].x,
        phases: script.secondaryPhases,
      });
    }

    setWalkers(newWalkers);

    // Calculer la durée totale estimée du script pour planifier le suivant
    const estimatedMs = estimateScriptDuration(script.phases);
    const totalWait = estimatedMs + randomBetween(MIN_GAP_MS, MAX_GAP_MS);
    spawnTimerRef.current = setTimeout(() => {
      if (mountedRef.current) spawnScript();
    }, totalWait);
  }, []);

  // Premier spawn différé
  useEffect(() => {
    mountedRef.current = true;
    spawnTimerRef.current = setTimeout(() => {
      if (mountedRef.current) spawnScript();
    }, FIRST_DELAY_MS);

    return () => {
      mountedRef.current = false;
      if (spawnTimerRef.current) clearTimeout(spawnTimerRef.current);
    };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // Console APIs
  useEffect(() => {
    window.spawnWalker = (scriptId) => spawnScript(scriptId);
    window.getWalkerState = () => walkers;
    return () => { delete window.spawnWalker; delete window.getWalkerState; };
  }, [spawnScript, walkers]);

  // Performance gate : rien sur low tier
  if (isLowTier()) return null;

  const portalTarget = document.getElementById('ambient-root') || document.body;

  return createPortal(
    <div className="footer-walkers-stage" aria-hidden="true">
      {/* Horizon ground strip — bande lumineuse subtile */}
      <div className="footer-horizon" />
      {/* Walkers */}
      {walkers.map(w => (
        <SingleWalker
          key={w.key}
          id={w.id}
          character={w.character}
          startX={w.startX}
          phases={w.phases}
          footerRef={footerRef}
          onDone={handleWalkerDone}
        />
      ))}
    </div>,
    portalTarget,
  );
};

/* ─── Estimation de durée d'un script (ms) ─── */

function estimateScriptDuration(phases) {
  let ms = 0;
  let prevX = null;
  for (const p of phases) {
    switch (p.action) {
      case 'enter':
        prevX = p.x;
        ms += 600;
        break;
      case 'walkTo': {
        const dist = Math.abs(p.x - (prevX ?? 0));
        ms += (dist / WALK_SPEED) * 1000;
        prevX = p.x;
        break;
      }
      case 'scan':
      case 'ghost':
      case 'sit':
        ms += (p.duration || 3000) + 500;
        break;
      case 'exit':
        ms += 600;
        break;
      default:
        break;
    }
  }
  return ms;
}

export default FooterWalkers;
