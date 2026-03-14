/**
 * OccasionalCommuter — Véhicule qui traverse lentement l'écran
 * toutes les 30s-60s. Type choisi aléatoirement parmi :
 * spacecraft, satellite, rover.
 *
 * Utilise createPortal pour un positionnement fixe indépendant du scroll.
 *
 * Le cycle est piloté entièrement par des timers JS (pas par onAnimationEnd)
 * pour éviter que le cycle se bloque si l'événement ne se déclenche jamais.
 * L'animation CSS est lancée en deux phases (mount → rAF → classe) pour
 * garantir que le navigateur démarre bien l'animation.
 */

import { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { createPortal } from 'react-dom';

/* ─── Constantes de timing ─── */

const MIN_DELAY_MS = 30_000; // 30 sec
const MAX_DELAY_MS = 60_000; // 1 min
const FIRST_DELAY_MS = 20_000; // 20 sec — premier spawn plus rapide
const BUFFER_MS = 1_000; // marge après la durée d'animation avant nettoyage

/** Durée de traversée par type (en secondes) */
const DURATIONS = {
  spacecraft: 28,
  satellite: 33,
  rover: 42,
};

type VehicleType = keyof typeof DURATIONS;

/* ─── SVG Véhicules ─── */

/** Vaisseau spatial — silhouette aplatie, traînée moteur animée */
const SpacecraftSVG = () => (
  <svg
    width="112"
    height="40"
    viewBox="0 0 70 24"
    fill="none"
    aria-hidden="true"
    xmlns="http://www.w3.org/2000/svg"
  >
    {/* Corps principal */}
    <path
      d="M4 12 L20 6 L58 8 L68 12 L58 16 L20 18 Z"
      stroke="currentColor"
      strokeWidth="1"
      fill="none"
      opacity="0.9"
    />
    {/* Cockpit */}
    <ellipse
      cx="56"
      cy="12"
      rx="5"
      ry="2.5"
      stroke="currentColor"
      strokeWidth="0.7"
      opacity="0.6"
    />
    {/* Réacteurs arrière */}
    <line x1="4" y1="12" x2="-2" y2="10" stroke="currentColor" strokeWidth="0.8" opacity="0.4" />
    <line x1="4" y1="12" x2="-2" y2="14" stroke="currentColor" strokeWidth="0.8" opacity="0.4" />
    {/* Ailerons */}
    <line x1="18" y1="6" x2="14" y2="2" stroke="currentColor" strokeWidth="0.7" opacity="0.5" />
    <line x1="18" y1="18" x2="14" y2="22" stroke="currentColor" strokeWidth="0.7" opacity="0.5" />
    {/* Traînée moteur — animée */}
    <g className="commuter-exhaust">
      <line
        x1="-2"
        y1="11"
        x2="-16"
        y2="11.5"
        stroke="currentColor"
        strokeWidth="0.6"
        strokeDasharray="3 4"
      />
      <line
        x1="-2"
        y1="12"
        x2="-18"
        y2="12"
        stroke="currentColor"
        strokeWidth="0.4"
        strokeDasharray="2 5"
      />
      <line
        x1="-2"
        y1="13"
        x2="-16"
        y2="12.5"
        stroke="currentColor"
        strokeWidth="0.6"
        strokeDasharray="3 4"
      />
    </g>
  </svg>
);

/** Satellite — corps central, panneaux solaires rotatifs lents, voyant pulsant */
const SatelliteSVG = () => (
  <svg
    width="88"
    height="72"
    viewBox="0 0 52 44"
    fill="none"
    aria-hidden="true"
    xmlns="http://www.w3.org/2000/svg"
  >
    {/* Corps central */}
    <rect
      x="18"
      y="16"
      width="16"
      height="12"
      rx="1"
      stroke="currentColor"
      strokeWidth="1"
      opacity="0.8"
    />
    {/* Panneau solaire gauche — rotation lente */}
    <g className="commuter-panel commuter-panel--left">
      <rect
        x="1"
        y="18"
        width="14"
        height="8"
        rx="0.5"
        stroke="currentColor"
        strokeWidth="0.7"
        opacity="0.5"
      />
      <line x1="5" y1="18" x2="5" y2="26" stroke="currentColor" strokeWidth="0.3" opacity="0.3" />
      <line x1="9" y1="18" x2="9" y2="26" stroke="currentColor" strokeWidth="0.3" opacity="0.3" />
    </g>
    {/* Panneau solaire droit — rotation lente inversée */}
    <g className="commuter-panel commuter-panel--right">
      <rect
        x="37"
        y="18"
        width="14"
        height="8"
        rx="0.5"
        stroke="currentColor"
        strokeWidth="0.7"
        opacity="0.5"
      />
      <line x1="41" y1="18" x2="41" y2="26" stroke="currentColor" strokeWidth="0.3" opacity="0.3" />
      <line x1="47" y1="18" x2="47" y2="26" stroke="currentColor" strokeWidth="0.3" opacity="0.3" />
    </g>
    {/* Antenne */}
    <line x1="26" y1="16" x2="26" y2="8" stroke="currentColor" strokeWidth="0.7" opacity="0.6" />
    <g className="commuter-antenna-dish">
      <circle cx="26" cy="6" r="2" stroke="currentColor" strokeWidth="0.6" opacity="0.5" />
    </g>
    {/* Voyant pulsant */}
    <circle className="commuter-blink" cx="26" cy="22" r="1.2" fill="currentColor" />
  </svg>
);

/** Rover lunaire — châssis, roues qui tournent, antenne oscillante, bras articulé */
const RoverSVG = () => (
  <svg
    width="104"
    height="56"
    viewBox="0 0 64 34"
    fill="none"
    aria-hidden="true"
    xmlns="http://www.w3.org/2000/svg"
  >
    {/* Châssis */}
    <rect
      x="12"
      y="14"
      width="40"
      height="10"
      rx="2"
      stroke="currentColor"
      strokeWidth="1"
      opacity="0.8"
    />
    {/* Roues — tournent sur elles-mêmes */}
    <g className="commuter-wheel">
      <circle cx="18" cy="28" r="4" stroke="currentColor" strokeWidth="1" opacity="0.7" />
      <line x1="18" y1="24" x2="18" y2="32" stroke="currentColor" strokeWidth="0.4" opacity="0.3" />
      <line x1="14" y1="28" x2="22" y2="28" stroke="currentColor" strokeWidth="0.4" opacity="0.3" />
    </g>
    <g className="commuter-wheel">
      <circle cx="46" cy="28" r="4" stroke="currentColor" strokeWidth="1" opacity="0.7" />
      <line x1="46" y1="24" x2="46" y2="32" stroke="currentColor" strokeWidth="0.4" opacity="0.3" />
      <line x1="42" y1="28" x2="50" y2="28" stroke="currentColor" strokeWidth="0.4" opacity="0.3" />
    </g>
    <g className="commuter-wheel commuter-wheel--small">
      <circle cx="32" cy="28" r="3" stroke="currentColor" strokeWidth="0.7" opacity="0.5" />
      <line
        x1="32"
        y1="25"
        x2="32"
        y2="31"
        stroke="currentColor"
        strokeWidth="0.3"
        opacity="0.25"
      />
    </g>
    {/* Essieux */}
    <line x1="18" y1="24" x2="18" y2="26" stroke="currentColor" strokeWidth="0.6" opacity="0.5" />
    <line x1="46" y1="24" x2="46" y2="26" stroke="currentColor" strokeWidth="0.6" opacity="0.5" />
    {/* Antenne oscillante */}
    <g className="commuter-antenna">
      <line x1="44" y1="14" x2="48" y2="4" stroke="currentColor" strokeWidth="0.7" opacity="0.6" />
      <circle cx="48" cy="3" r="1.5" stroke="currentColor" strokeWidth="0.5" opacity="0.5" />
    </g>
    {/* Bras articulé */}
    <polyline
      points="14,14 10,8 6,10"
      stroke="currentColor"
      strokeWidth="0.7"
      opacity="0.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    {/* Panneau photovoltaïque */}
    <rect
      x="24"
      y="11"
      width="14"
      height="3"
      rx="0.5"
      stroke="currentColor"
      strokeWidth="0.5"
      opacity="0.4"
    />
  </svg>
);

/* ─── Pool de véhicules ─── */

const VEHICLE_TYPES: VehicleType[] = ['spacecraft', 'satellite', 'rover'];

const VEHICLE_SVGS = {
  spacecraft: SpacecraftSVG,
  satellite: SatelliteSVG,
  rover: RoverSVG,
};

const VEHICLE_CLASSES = {
  spacecraft: 'commuter-spacecraft',
  satellite: 'commuter-satellite',
  rover: 'commuter-rover',
};

/* ─── Helpers ─── */

const randomBetween = (min: any, max: any) => Math.random() * (max - min) + min;
const randomType = (): VehicleType =>
  VEHICLE_TYPES[Math.floor(Math.random() * VEHICLE_TYPES.length)];

/* ─── Composant interne : rendu du véhicule avec animation en deux phases ─── */

/**
 * Décalage vertical par type — fraction du viewport au-dessus du scroll actuel.
 * Puisque les commuters sont position: absolute, on calcule un `top` en pixels
 * relatif au document au moment du spawn pour qu'ils apparaissent dans le viewport courant.
 */
const VIEWPORT_OFFSETS: Partial<Record<VehicleType, number>> = {
  spacecraft: 0.08, // 8% du viewport depuis le haut courant
  satellite: 0.2, // 20% du viewport
};

/**
 * CommuterVehicle — monte le div sans la classe d'animation,
 * puis l'ajoute au frame suivant pour garantir que le navigateur
 * lance bien l'animation CSS.
 *
 * Le `top` est calculé en pixels à partir de window.scrollY
 * (ou du footer.offsetTop pour le rover) puisque les commuters
 * sont maintenant position: absolute et scrollent avec la page.
 */
const CommuterVehicle = ({ type, duration }: { type: VehicleType; duration: number }) => {
  const divRef = useRef<any>(null);
  const [animating, setAnimating] = useState(false);

  // Calculer la position verticale absolue à l'instant du spawn
  const topPx = useMemo(() => {
    if (type === 'rover') {
      // Le rover roule au sommet du footer — on soustrait la hauteur du SVG
      // (56 px) pour que les roues reposent sur le bord supérieur du footer.
      const ROVER_SVG_HEIGHT = 56;
      const footer = document.querySelector('footer');
      if (footer) return footer.offsetTop - ROVER_SVG_HEIGHT + 'px';
      // Fallback : bas du document moins la hauteur du rover
      return Math.max(document.body.scrollHeight, window.innerHeight) - ROVER_SVG_HEIGHT + 'px';
    }
    // Spacecraft / satellite : fraction du viewport, ancrée au scroll courant
    const frac = VIEWPORT_OFFSETS[type] ?? 0.1;
    return Math.round(window.scrollY + window.innerHeight * frac) + 'px';
  }, [type]);

  // Phase 2 : ajouter la classe d'animation au prochain frame
  useEffect(() => {
    const raf = requestAnimationFrame(() => {
      setAnimating(true);
    });
    return () => cancelAnimationFrame(raf);
  }, []);

  const VehicleSVG = VEHICLE_SVGS[type];
  const cssClass = animating ? VEHICLE_CLASSES[type] : '';

  return (
    <div
      ref={divRef}
      className={`ambient-commuter ${cssClass}`}
      style={animating ? { top: topPx, animationDuration: `${duration}s` } : { top: topPx }}
      aria-hidden="true"
    >
      <VehicleSVG />
    </div>
  );
};

/* ─── Composant principal ─── */

const OccasionalCommuter = () => {
  const [vehicle, setVehicle] = useState<{ type: VehicleType; key: number } | null>(null); // { type, key }
  const spawnTimerRef = useRef<any>(null);
  const lifetimeTimerRef = useRef<any>(null);
  const mountedRef = useRef(true);

  /** Nettoie tous les timers actifs */
  const clearAllTimers = useCallback(() => {
    if (spawnTimerRef.current) {
      clearTimeout(spawnTimerRef.current);
      spawnTimerRef.current = null;
    }
    if (lifetimeTimerRef.current) {
      clearTimeout(lifetimeTimerRef.current);
      lifetimeTimerRef.current = null;
    }
  }, []);

  /** Retire le véhicule courant et planifie le prochain passage */
  const despawnAndSchedule = useCallback(() => {
    if (!mountedRef.current) return;
    setVehicle(null);
    if (lifetimeTimerRef.current) {
      clearTimeout(lifetimeTimerRef.current);
      lifetimeTimerRef.current = null;
    }
    const delay = randomBetween(MIN_DELAY_MS, MAX_DELAY_MS);
    spawnTimerRef.current = setTimeout(() => {
      if (!mountedRef.current) return;
      spawnVehicle();
    }, delay);
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  /** Fait apparaître un véhicule et planifie son retrait automatique */
  const spawnVehicle = useCallback(
    (type?: VehicleType) => {
      if (!mountedRef.current) return;
      clearAllTimers();
      const chosenType = type && VEHICLE_TYPES.includes(type) ? type : randomType();
      const duration = DURATIONS[chosenType];
      setVehicle({ type: chosenType, key: Date.now() });

      // Timer JS pour retirer le véhicule après sa traversée
      // (ne dépend PAS de onAnimationEnd, qui peut ne jamais se déclencher)
      lifetimeTimerRef.current = setTimeout(
        () => {
          despawnAndSchedule();
        },
        duration * 1000 + BUFFER_MS
      );
    },
    [clearAllTimers, despawnAndSchedule]
  );

  // Au montage : planifier le premier passage
  useEffect(() => {
    mountedRef.current = true;
    spawnTimerRef.current = setTimeout(() => {
      spawnVehicle();
    }, FIRST_DELAY_MS);

    return () => {
      mountedRef.current = false;
      clearAllTimers();
    };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // Interaction pet Easter egg
  useEffect(() => {
    if (vehicle) {
      const t = setTimeout(() => window.petReact?.('excited'), 3000);
      return () => clearTimeout(t);
    }
  }, [vehicle]);

  // Commande console : spawnCommuter('spacecraft'|'satellite'|'rover')
  useEffect(() => {
    window.spawnCommuter = (type?: VehicleType) => spawnVehicle(type);
    return () => {
      delete window.spawnCommuter;
    };
  }, [spawnVehicle]);

  if (!vehicle) return null;

  return createPortal(
    <CommuterVehicle key={vehicle.key} type={vehicle.type} duration={DURATIONS[vehicle.type]} />,
    document.getElementById('ambient-root') || document.body
  );
};

export default OccasionalCommuter;
