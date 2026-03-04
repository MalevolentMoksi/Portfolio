/**
 * FooterDiorama — Éléments décoratifs ancrés juste au-dessus du footer.
 *
 * Spawn 2 ou 3 dioramas aléatoires (jamais le même type deux fois)
 * à chaque changement de route, aux positions horizontales aléatoires
 * dans les zones latérales (hors main centré). Aucun diorama ne peut
 * chevaucher un autre (gap minimum assuré).
 *
 * Pool actuel : 10 types — relay, beacon, warmind, radar,
 * turbine, radio, lighthouse, clock, tesla, periscope.
 */

import { useRef, useMemo } from 'react';
import { useLocation } from 'react-router-dom';

/* ─── Placement helpers ─── */

/**
 * Zones sûres : les flancs du footer, en dehors de la zone centrale
 * où se situe l'élément <main> (max-width 800px centré).
 * Sur 1200px : 200px de marge → ~16 %. On cible < 22 % et > 78 %.
 */
const SAFE_ZONES = [[1, 22], [78, 99]]; // en %
const DIORAMA_W_PCT = 4;  // largeur approximative du SVG (48px / ~1200px)
const MIN_GAP_PCT   = 9;  // espacement minimum centre-à-centre

/**
 * Retourne `count` positions (%) aléatoires, sans chevauchement,
 * réparties dans les zones sûres.
 */
function pickPositions(count) {
  const positions = [];
  let attempts = 0;
  while (positions.length < count && attempts < 400) {
    attempts++;
    const zone = SAFE_ZONES[Math.floor(Math.random() * SAFE_ZONES.length)];
    const pos  = zone[0] + Math.random() * (zone[1] - zone[0] - DIORAMA_W_PCT);
    const fits = positions.every(p => Math.abs(p - pos) > MIN_GAP_PCT);
    if (fits) positions.push(pos);
  }
  return positions;
}

/* ─── SVG Diorama Definitions ─── */

/** Antenne relais : mât vertical, parabole oscillante anglée, voyant clignotant */
const RelayDiorama = () => (
  <svg
    className="footer-diorama diorama-relay"
    viewBox="0 0 48 64"
    fill="none"
    aria-hidden="true"
    xmlns="http://www.w3.org/2000/svg"
  >
    <line x1="24" y1="62" x2="24" y2="18" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
    <line x1="16" y1="62" x2="32" y2="62" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
    {/* Bras + parabole — pivote depuis le sommet du mât (y=18) */}
    <g className="relay-dish">
      <line x1="24" y1="16" x2="24" y2="22" stroke="currentColor" strokeWidth="1" />
      <ellipse cx="24" cy="22" rx="10" ry="3" stroke="currentColor" strokeWidth="1" />
    </g>
    <circle className="relay-light" cx="24" cy="14" r="2.5" fill="currentColor" />
    <line x1="18" y1="54" x2="24" y2="36" stroke="currentColor" strokeWidth="0.6" opacity="0.4" />
    <line x1="30" y1="54" x2="24" y2="36" stroke="currentColor" strokeWidth="0.6" opacity="0.4" />
  </svg>
);

/** Balise signal : base triangulaire, cœur lumineux pulsant, fumée montante */
const BeaconDiorama = () => (
  <svg
    className="footer-diorama diorama-beacon"
    viewBox="0 0 48 64"
    fill="none"
    aria-hidden="true"
    xmlns="http://www.w3.org/2000/svg"
  >
    <polygon points="14,62 34,62 24,40" stroke="currentColor" strokeWidth="1.2" fill="none" />
    <line x1="19" y1="52" x2="29" y2="52" stroke="currentColor" strokeWidth="0.6" opacity="0.5" />
    <circle className="beacon-core" cx="24" cy="46" r="3.5" fill="currentColor" />
    <circle className="beacon-smoke" cx="23" cy="38" r="2" fill="currentColor" />
    <circle className="beacon-smoke" cx="26" cy="36" r="1.5" fill="currentColor" />
    <circle className="beacon-smoke" cx="22" cy="34" r="1.8" fill="currentColor" />
    <line x1="24" y1="39" x2="24" y2="32" stroke="currentColor" strokeWidth="0.6" opacity="0.3" />
    <line x1="20" y1="41" x2="16" y2="35" stroke="currentColor" strokeWidth="0.5" opacity="0.2" />
    <line x1="28" y1="41" x2="32" y2="35" stroke="currentColor" strokeWidth="0.5" opacity="0.2" />
  </svg>
);

/** Nœud Warmind : noyau géométrique pulsant, anneaux orbitaux */
const WarmindDiorama = () => (
  <svg
    className="footer-diorama diorama-warmind"
    viewBox="0 0 48 64"
    fill="none"
    aria-hidden="true"
    xmlns="http://www.w3.org/2000/svg"
  >
    <line x1="16" y1="62" x2="32" y2="62" stroke="currentColor" strokeWidth="1" />
    <line x1="24" y1="62" x2="24" y2="52" stroke="currentColor" strokeWidth="1" />
    <polygon className="warmind-core" points="24,30 34,42 24,54 14,42" stroke="currentColor" strokeWidth="1.2" fill="none" />
    <circle cx="24" cy="42" r="2" fill="currentColor" className="warmind-core" />
    <ellipse className="warmind-ring-a" cx="24" cy="42" rx="16" ry="5" stroke="currentColor" strokeWidth="0.6" opacity="0.4" />
    <ellipse className="warmind-ring-b" cx="24" cy="42" rx="12" ry="8" stroke="currentColor" strokeWidth="0.6" opacity="0.3" transform="rotate(30 24 42)" />
  </svg>
);

/** Radar scanner : base + bras rotatif avec balayage */
const RadarDiorama = () => (
  <svg
    className="footer-diorama diorama-radar"
    viewBox="0 0 48 64"
    fill="none"
    aria-hidden="true"
    xmlns="http://www.w3.org/2000/svg"
  >
    {/* Socle */}
    <line x1="14" y1="62" x2="34" y2="62" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
    <line x1="24" y1="62" x2="24" y2="42" stroke="currentColor" strokeWidth="1.2" />
    {/* Cercles concentriques du radar */}
    <circle cx="24" cy="42" r="14" stroke="currentColor" strokeWidth="0.4" opacity="0.2" fill="none" />
    <circle cx="24" cy="42" r="9" stroke="currentColor" strokeWidth="0.4" opacity="0.25" fill="none" />
    <circle cx="24" cy="42" r="4" stroke="currentColor" strokeWidth="0.4" opacity="0.3" fill="none" />
    {/* Bras balayeur rotatif */}
    <g className="radar-sweep">
      <line x1="24" y1="42" x2="24" y2="28" stroke="currentColor" strokeWidth="0.8" opacity="0.7" />
      <circle cx="24" cy="29" r="1" fill="currentColor" opacity="0.6" />
    </g>
    {/* Point central */}
    <circle cx="24" cy="42" r="1.5" fill="currentColor" opacity="0.8" />
  </svg>
);

/** Éolienne minimaliste : mât + pales rotatives */
const WindTurbineDiorama = () => (
  <svg
    className="footer-diorama diorama-turbine"
    viewBox="0 0 48 64"
    fill="none"
    aria-hidden="true"
    xmlns="http://www.w3.org/2000/svg"
  >
    {/* Mât */}
    <line x1="24" y1="62" x2="24" y2="24" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" />
    {/* Base */}
    <line x1="16" y1="62" x2="32" y2="62" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
    {/* Hauban gauche */}
    <line x1="18" y1="58" x2="24" y2="42" stroke="currentColor" strokeWidth="0.4" opacity="0.3" />
    {/* Hauban droit */}
    <line x1="30" y1="58" x2="24" y2="42" stroke="currentColor" strokeWidth="0.4" opacity="0.3" />
    {/* Pales rotatives */}
    <g className="turbine-blades">
      <line x1="24" y1="24" x2="24" y2="10" stroke="currentColor" strokeWidth="0.8" opacity="0.7" />
      <line x1="24" y1="24" x2="36" y2="31" stroke="currentColor" strokeWidth="0.8" opacity="0.7" />
      <line x1="24" y1="24" x2="12" y2="31" stroke="currentColor" strokeWidth="0.8" opacity="0.7" />
    </g>
    {/* Moyeu */}
    <circle cx="24" cy="24" r="2" fill="currentColor" opacity="0.6" />
  </svg>
);

/** Tour radio : structure en treillis, ondes émises, voyant double */
const RadioTowerDiorama = () => (
  <svg
    className="footer-diorama diorama-radio"
    viewBox="0 0 48 64"
    fill="none"
    aria-hidden="true"
    xmlns="http://www.w3.org/2000/svg"
  >
    <line x1="18" y1="62" x2="24" y2="14" stroke="currentColor" strokeWidth="0.8" />
    <line x1="30" y1="62" x2="24" y2="14" stroke="currentColor" strokeWidth="0.8" />
    <line x1="19" y1="54" x2="29" y2="54" stroke="currentColor" strokeWidth="0.5" opacity="0.4" />
    <line x1="20" y1="44" x2="28" y2="44" stroke="currentColor" strokeWidth="0.5" opacity="0.4" />
    <line x1="21" y1="34" x2="27" y2="34" stroke="currentColor" strokeWidth="0.5" opacity="0.4" />
    <line x1="22" y1="24" x2="26" y2="24" stroke="currentColor" strokeWidth="0.5" opacity="0.4" />
    <g className="radio-waves">
      <path d="M30 18 Q34 14 30 10" stroke="currentColor" strokeWidth="0.6" fill="none" opacity="0.5" />
      <path d="M33 20 Q38 14 33 8" stroke="currentColor" strokeWidth="0.5" fill="none" opacity="0.35" />
      <path d="M36 22 Q42 14 36 6" stroke="currentColor" strokeWidth="0.4" fill="none" opacity="0.2" />
    </g>
    <circle className="relay-light" cx="24" cy="14" r="1.5" fill="currentColor" />
    <circle className="relay-light" cx="24" cy="34" r="1" fill="currentColor" />
    <line x1="14" y1="62" x2="34" y2="62" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
  </svg>
);

/** Phare : tour conique avec faisceau rotatif et lumière pulsante */
const LighthouseDiorama = () => (
  <svg
    className="footer-diorama diorama-lighthouse"
    viewBox="0 0 48 64"
    fill="none"
    aria-hidden="true"
    xmlns="http://www.w3.org/2000/svg"
  >
    {/* Tour tronconique */}
    <polygon points="17,62 31,62 29,20 19,20" stroke="currentColor" strokeWidth="1" fill="none" />
    {/* Porte */}
    <rect x="20" y="52" width="8" height="10" rx="1" stroke="currentColor" strokeWidth="0.7" opacity="0.6" />
    {/* Fenêtres */}
    <rect x="21" y="38" width="6" height="4" rx="0.5" stroke="currentColor" strokeWidth="0.6" opacity="0.5" />
    <rect x="21" y="27" width="6" height="4" rx="0.5" stroke="currentColor" strokeWidth="0.6" opacity="0.5" />
    {/* Bandes décoratives */}
    <line x1="19.5" y1="44" x2="28.5" y2="44" stroke="currentColor" strokeWidth="0.4" opacity="0.3" />
    <line x1="19.5" y1="32" x2="28.5" y2="32" stroke="currentColor" strokeWidth="0.4" opacity="0.3" />
    {/* Lanterne */}
    <rect x="18" y="14" width="12" height="6" rx="1" stroke="currentColor" strokeWidth="0.8" />
    {/* Toit */}
    <polygon points="18,14 30,14 24,8" stroke="currentColor" strokeWidth="0.8" fill="none" />
    {/* Faisceau rotatif pivoté au centre de la lanterne */}
    <g className="lighthouse-beam">
      <line x1="24" y1="17" x2="44" y2="10" stroke="currentColor" strokeWidth="0.8" opacity="0.6" />
      <line x1="24" y1="17" x2="44" y2="15" stroke="currentColor" strokeWidth="0.3" opacity="0.25" />
    </g>
    {/* Lumière centrale */}
    <circle className="lighthouse-glow" cx="24" cy="17" r="2.5" fill="currentColor" />
  </svg>
);

/** Tour de l'horloge : cadran avec aiguilles tournantes */
const ClockDiorama = () => (
  <svg
    className="footer-diorama diorama-clock"
    viewBox="0 0 48 64"
    fill="none"
    aria-hidden="true"
    xmlns="http://www.w3.org/2000/svg"
  >
    {/* Colonne */}
    <line x1="24" y1="62" x2="24" y2="40" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" />
    <line x1="16" y1="62" x2="32" y2="62" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
    <line x1="22" y1="40" x2="26" y2="40" stroke="currentColor" strokeWidth="0.5" opacity="0.4" />
    {/* Cadran */}
    <circle cx="24" cy="28" r="11" stroke="currentColor" strokeWidth="0.9" />
    {/* Marques horaires (12h, 3h, 6h, 9h) */}
    <line x1="24" y1="17" x2="24" y2="20" stroke="currentColor" strokeWidth="1" strokeLinecap="round" />
    <line x1="35" y1="28" x2="32" y2="28" stroke="currentColor" strokeWidth="1" strokeLinecap="round" />
    <line x1="24" y1="39" x2="24" y2="36" stroke="currentColor" strokeWidth="1" strokeLinecap="round" />
    <line x1="13" y1="28" x2="16" y2="28" stroke="currentColor" strokeWidth="1" strokeLinecap="round" />
    {/* Aiguille des minutes (tourne en 15s) */}
    <line className="clock-minute" x1="24" y1="28" x2="24" y2="18.5" stroke="currentColor" strokeWidth="0.8" strokeLinecap="round" />
    {/* Aiguille des heures (tourne en 180s) */}
    <line className="clock-hour" x1="24" y1="28" x2="24" y2="22" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" />
    {/* Centre */}
    <circle cx="24" cy="28" r="1.5" fill="currentColor" />
  </svg>
);

/** Bobine de Tesla : zigzag conducteur, sphère apicale, arcs électriques */
const TeslaCoilDiorama = () => (
  <svg
    className="footer-diorama diorama-tesla"
    viewBox="0 0 48 64"
    fill="none"
    aria-hidden="true"
    xmlns="http://www.w3.org/2000/svg"
  >
    {/* Socle */}
    <rect x="12" y="58" width="24" height="4" rx="1" stroke="currentColor" strokeWidth="1" />
    {/* Bobine (zigzag) */}
    <polyline
      points="20,58 20,50 28,50 28,44 20,44 20,38 28,38 28,32 20,32 20,26 28,26 28,20"
      stroke="currentColor"
      strokeWidth="1"
      fill="none"
      opacity="0.8"
    />
    {/* Sphère terminale */}
    <circle cx="24" cy="15" r="5" stroke="currentColor" strokeWidth="1" opacity="0.9" />
    {/* Arcs électriques — clignotent en décalé */}
    <path className="tesla-arc tesla-arc--1" d="M29 13 Q37 6 32 3" stroke="currentColor" strokeWidth="0.8" fill="none" />
    <path className="tesla-arc tesla-arc--2" d="M19 13 Q11 6 16 3" stroke="currentColor" strokeWidth="0.8" fill="none" />
    <path className="tesla-arc tesla-arc--3" d="M26 10 Q33 3 29 1" stroke="currentColor" strokeWidth="0.5" fill="none" />
    {/* Halo de base */}
    <ellipse className="tesla-glow" cx="24" cy="58" rx="10" ry="2" stroke="currentColor" strokeWidth="0.5" opacity="0.5" />
  </svg>
);

/** Périscope : fût émergent, tête oscillante avec lentille */
const PeriscopeDiorama = () => (
  <svg
    className="footer-diorama diorama-periscope"
    viewBox="0 0 48 64"
    fill="none"
    aria-hidden="true"
    xmlns="http://www.w3.org/2000/svg"
  >
    {/* Fût vertical */}
    <rect x="21" y="34" width="6" height="28" rx="1.5" stroke="currentColor" strokeWidth="1" />
    {/* Joints décoratifs */}
    <line x1="19" y1="44" x2="29" y2="44" stroke="currentColor" strokeWidth="0.6" opacity="0.4" />
    <line x1="19" y1="52" x2="29" y2="52" stroke="currentColor" strokeWidth="0.6" opacity="0.4" />
    {/* Tête pivotante : coude + tube horizontal + oeil */}
    <g className="periscope-head">
      {/* Coude */}
      <path d="M21 34 Q21 22 30 22" stroke="currentColor" strokeWidth="3" fill="none" strokeLinecap="round" opacity="0.7" />
      {/* Tube horizontal */}
      <rect x="30" y="19" width="12" height="6" rx="1" stroke="currentColor" strokeWidth="0.8" />
      {/* Lentille */}
      <circle cx="41" cy="22" r="2.5" stroke="currentColor" strokeWidth="0.7" />
      <circle cx="41" cy="22" r="1" fill="currentColor" opacity="0.6" />
    </g>
  </svg>
);

/* ─── Pool de dioramas (10 types) ─── */

const DIORAMAS = [
  RelayDiorama,
  BeaconDiorama,
  WarmindDiorama,
  RadarDiorama,
  WindTurbineDiorama,
  RadioTowerDiorama,
  LighthouseDiorama,
  ClockDiorama,
  TeslaCoilDiorama,
  PeriscopeDiorama,
];

/* ─── Composant principal ─── */

const FooterDiorama = () => {
  const { pathname } = useLocation();
  const routeCountRef = useRef(0);
  const prevPathRef   = useRef(pathname);

  if (pathname !== prevPathRef.current) {
    routeCountRef.current += 1;
    prevPathRef.current = pathname;
  }

  // À chaque route : 2 ou 3 dioramas de types différents, positions aléatoires
  const { dioramas, positions } = useMemo(() => {
    const count     = Math.random() < 0.4 ? 3 : 2;
    const shuffled  = [...DIORAMAS].sort(() => Math.random() - 0.5);
    const chosen    = shuffled.slice(0, count);
    const pos       = pickPositions(count);
    return { dioramas: chosen, positions: pos };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [routeCountRef.current]);

  return (
    <div className="footer-diorama-container" aria-hidden="true">
      {dioramas.map((DioramaComponent, i) => (
        <div
          key={i}
          className="footer-diorama-slot"
          style={{ left: `${positions[i] ?? (i * 20 + 2)}%` }}
        >
          <DioramaComponent />
        </div>
      ))}
    </div>
  );
};

export default FooterDiorama;
