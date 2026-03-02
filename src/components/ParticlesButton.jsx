import { useState, useRef, useCallback, useEffect } from 'react';
import Tooltip from './Tooltip.jsx';

/* ── Configuration des effets ─────────────────────── */
const EFFECTS = [
  { key: 'explode',  label: 'Explosion',   icon: '💥', duration: 1800 },
  { key: 'attract',  label: 'Attraction',  icon: '🧲', duration: 3000 },
  { key: 'storm',    label: 'Tempête',     icon: '⚡', duration: 3000 },
  { key: 'gravity',  label: 'Gravité',     icon: '🌑', duration: 3000 },
];

/* ── Helpers : accès sécurisé à pJS ── */
const getPJS = () => {
  try {
    return window.pJSDom?.[0]?.pJS ?? null;
  } catch { return null; }
};

const triggerPetAttract = (x, y, duration) => {
  const fire = () => window.petAttract?.(x, y, duration);
  fire();
  requestAnimationFrame(fire);
  setTimeout(fire, 50);
};

/**
 * Active/désactive le mode "foreground" des particules :
 * - Monte le z-index du canvas au-dessus du main
 * - Réduit l'opacité du main pour laisser les particules visibles
 */
const setParticlesForeground = (active) => {
  const canvas = document.getElementById('particles-js');
  const main   = document.querySelector('main');
  if (canvas) canvas.classList.toggle('particles-foreground', active);
  if (main)   main.classList.toggle('main--particles-active', active);
};

/**
 * Génère un point aléatoire en DEHORS du rectangle central du viewport.
 * Le centre est exclu pour que l'attraction ne couvre pas le contenu.
 * Divise le viewport en 4 bandes (haut, bas, gauche, droite).
 */
const randomEdgePoint = () => {
  const W = window.innerWidth;
  const H = window.innerHeight;
  // Hauteur du header sticky (correspond à HEADER_H dans petConstants)
  const HEADER_H = 75;
  // Rectangle central exclu : 40% largeur × 50% hauteur, centré
  const marginX = W * 0.30;
  const marginY = H * 0.25;
  const cx1 = marginX, cx2 = W - marginX;
  // La limite haute de la bande centrale ne peut pas être dans le header
  const cy1 = Math.max(marginY, HEADER_H + 20);
  const cy2 = H - marginY;

  // 4 bandes : haut, bas, gauche, droite (excluant le centre et le header)
  const bands = [
    // haut : commence après le header pour éviter la zone sticky
    { x: () => Math.random() * W, y: () => HEADER_H + Math.random() * Math.max(1, cy1 - HEADER_H) },
    { x: () => Math.random() * W, y: () => cy2 + Math.random() * (H - cy2) },   // bas
    { x: () => Math.random() * cx1, y: () => cy1 + Math.random() * (cy2 - cy1) }, // gauche
    { x: () => cx2 + Math.random() * (W - cx2), y: () => cy1 + Math.random() * (cy2 - cy1) }, // droite
  ];
  const band = bands[Math.floor(Math.random() * bands.length)];
  return { x: band.x(), y: band.y() };
};

/**
 * Vitesse de base réelle d'une particule : les particules.js initialisent
 * chaque composante à (random - 0.5) * speed / 3, donc la magnitude RMS
 * est environ speed / (3 * sqrt(2)) ≈ speed * 0.235.
 * On prend 0.22 * speed comme cible de retour.
 */
const getBaseSpeed = () => (getPJS()?.particles.move.speed ?? 2) * 0.22;

/**
 * Décélération exponentielle smooth : ramène toutes les particules vers
 * baseSpeed sur `duration` ms sans snap brutal.
 * Décroissance par frame : k = 0.05^(1/N) où N ≈ frames dans duration.
 */
const smoothRestore = (duration = 1500) => {
  const baseSpeed = getBaseSpeed();
  // k tel que après duration ms (≈ duration*0.06 frames à 60fps) la vitesse
  // excédentaire soit réduite à 5 % : k = 0.05^(1/(duration*0.06))
  const frames = duration * 0.06;
  const k = Math.pow(0.05, 1 / frames); // ≈ 0.967 pour duration=1500

  const start = performance.now();

  const frame = () => {
    const elapsed = performance.now() - start;
    const done = elapsed >= duration;
    const p = getPJS();
    if (!p) return;

    p.particles.array.forEach((pt) => {
      const mag = Math.sqrt(pt.vx * pt.vx + pt.vy * pt.vy);
      if (mag < 0.001) return;

      let targetMag;
      if (done) {
        targetMag = baseSpeed;
      } else {
        // Converge exponentiellement : excès réduit de (1-k) par frame
        targetMag = baseSpeed + (mag - baseSpeed) * k;
      }
      const ratio = targetMag / mag;
      pt.vx *= ratio;
      pt.vy *= ratio;
    });

    if (!done) requestAnimationFrame(frame);
  };

  requestAnimationFrame(frame);
};

/* ── Implémentation des effets ── */
const effects = {

  /**
   * Explosion : spawn dans les coins supérieurs (zone visible sans contenu)
   * et projection radiale de toutes les particules depuis ces coins.
   */
  explode() {
    setParticlesForeground(true);
    const pJS = getPJS();
    if (!pJS) return;

    const W = window.innerWidth;
    const H = window.innerHeight;
    // pJS.canvas.pxratio = devicePixelRatio sur écran retina, 1 sinon.
    // Les positions internes des particules (pt.x/pt.y) sont en pixels physiques,
    // donc toutes les coordonnées CSS doivent être multipliées par pxratio.
    const pxr = pJS.canvas.pxratio ?? 1;
    // Zones en haut à gauche et en haut à droite — hors zone du contenu central
    const zoneW = W * 0.25;
    const zoneH = H * 0.35;
    const headerH = 70; // hauteur approximative du header sticky

    // 15 particules dans le coin haut-gauche
    for (let i = 0; i < 15; i++) {
      pJS.fn.modes.pushParticles(1, {
        pos_x: Math.random() * zoneW * pxr,
        pos_y: (headerH + Math.random() * (zoneH - headerH)) * pxr,
      });
    }
    // 15 particules dans le coin haut-droit
    for (let i = 0; i < 15; i++) {
      pJS.fn.modes.pushParticles(1, {
        pos_x: (W - Math.random() * zoneW) * pxr,
        pos_y: (headerH + Math.random() * (zoneH - headerH)) * pxr,
      });
    }

    // Projeter toutes les particules vers l'extérieur depuis le centre.
    // cx/cy convertis en pixels physiques pour correspondre à l'espace de pt.x/pt.y.
    const cx = (W / 2) * pxr;
    const cy = (H / 4) * pxr; // depuis le quart supérieur pour accompagner le spawn
    pJS.particles.array.forEach((pt) => {
      const dx = pt.x - cx;
      const dy = pt.y - cy;
      const dist = Math.sqrt(dx * dx + dy * dy) || 1;
      const burst = 5 + Math.random() * 5;
      pt.vx = (dx / dist) * burst;
      pt.vy = (dy / dist) * burst;
    });

    setTimeout(() => { smoothRestore(1200); setParticlesForeground(false); }, 600);
    window.petReact?.('scared');
  },

  /**
   * Attraction : les particules convergent vers un point en bordure de l'écran.
   * Le centre du viewport est évité pour ne pas cacher le contenu.
   */
  attract() {
    setParticlesForeground(true);
    // Point aléatoire hors zone centrale
    const { x: cx, y: cy } = randomEdgePoint();
    triggerPetAttract(cx, cy, 3000);

    const pJS = getPJS();
    if (!pJS) return;

    // Convertir en pixels physiques pour l'espace interne de particles.js.
    // Sur écran retina pxratio = devicePixelRatio (ex. 2), pt.x/pt.y vont
    // jusqu'à canvas.w = innerWidth * pxratio, donc la cible doit être mise
    // à l'échelle pour que particules et robot convergent au même point visuel.
    const pxr = pJS.canvas.pxratio ?? 1;
    const pcx = cx * pxr;
    const pcy = cy * pxr;

    let active = true;

    const pull = () => {
      if (!active) return;
      const p = getPJS();
      if (!p) return;
      p.particles.array.forEach((pt) => {
        const dx = pcx - pt.x;
        const dy = pcy - pt.y;
        const dist = Math.sqrt(dx * dx + dy * dy) || 1;
        pt.vx += (dx / dist) * 0.5;
        pt.vy += (dy / dist) * 0.5;
        // Limiter la vitesse d'attraction
        const spd = Math.sqrt(pt.vx * pt.vx + pt.vy * pt.vy);
        if (spd > 8) {
          pt.vx = (pt.vx / spd) * 8;
          pt.vy = (pt.vy / spd) * 8;
        }
      });
      requestAnimationFrame(pull);
    };

    requestAnimationFrame(pull);

    setTimeout(() => {
      active = false;
      smoothRestore(1500);
      setParticlesForeground(false);
    }, 3000);
  },

  /**
   * Tempête : double le nombre de particules et uniformise leur vitesse.
   * Les nouvelles particules reçoivent exactement la même vitesse que
   * les anciennes pour éviter la disparité.
   */
  storm() {
    setParticlesForeground(true);
    window.petReact?.('dizzy');

    const pJS = getPJS();
    if (!pJS) return;

    const originalCount = pJS.particles.array.length;
    const bonus = Math.min(originalCount, 80); // max 80 extra
    const stormSpeed = 5;
    const pxr = pJS.canvas.pxratio ?? 1;

    // Spawn en positions aléatoires — coordonnées en pixels physiques
    for (let i = 0; i < bonus; i++) {
      pJS.fn.modes.pushParticles(1, {
        pos_x: Math.random() * window.innerWidth * pxr,
        pos_y: Math.random() * window.innerHeight * pxr,
      });
    }

    // Uniformiser TOUTES les particules (nouvelles incluses) à stormSpeed
    // en préservant leur direction individuelle
    pJS.particles.array.forEach((pt) => {
      const mag = Math.sqrt(pt.vx * pt.vx + pt.vy * pt.vy);
      if (mag < 0.001) {
        const angle = Math.random() * Math.PI * 2;
        pt.vx = Math.cos(angle) * stormSpeed;
        pt.vy = Math.sin(angle) * stormSpeed;
      } else {
        const ratio = stormSpeed / mag;
        pt.vx *= ratio;
        pt.vy *= ratio;
      }
    });

    setTimeout(() => {
      const p2 = getPJS();
      if (!p2) return;
      // Supprimer les particules bonus (ajoutées à la fin du tableau)
      const excess = p2.particles.array.length - originalCount;
      if (excess > 0) {
        p2.particles.array.splice(p2.particles.array.length - excess, excess);
      }
      smoothRestore(1800);
      setParticlesForeground(false);
    }, 3000);
  },

  /**
   * Gravité : les particules tombent vers le bas du viewport et rebondissent.
   * Utilise pJS.canvas.h pour une détection de sol fiable.
   */
  gravity() {
    setParticlesForeground(true);
    window.petReact?.('dizzy');
    window.petGravity?.(3000);

    const pJS = getPJS();
    if (!pJS) return;
    let active = true;

    const fall = () => {
      if (!active) return;
      const p = getPJS();
      if (!p) return;
      // pJS.canvas.h = hauteur CSS du canvas = window.innerHeight (container 100vh fixe)
      const floor = p.canvas.h - 4;

      p.particles.array.forEach((pt) => {
        pt.vy += 0.18; // gravité douce
        if (pt.y >= floor) {
          pt.vy *= -0.55; // rebond partiel
          pt.y = floor;
        }
      });
      requestAnimationFrame(fall);
    };

    requestAnimationFrame(fall);

    setTimeout(() => {
      active = false;
      smoothRestore(2000);
      setParticlesForeground(false);
    }, 3000);
  },
};

/* ── Composant ─────────────────────────────────────── */

const ParticlesButton = () => {
  const [effectIndex, setEffectIndex] = useState(0);
  const [isActive, setIsActive] = useState(false);
  const [activeEffectKey, setActiveEffectKey] = useState(null);
  const [progress, setProgress] = useState(100);
  const cooldownRef = useRef(false);
  const progressIntervalRef = useRef(null);

  const triggerEffect = useCallback(() => {
    if (cooldownRef.current) return;

    const effect = EFFECTS[effectIndex];
    effects[effect.key]();

    setIsActive(true);
    setActiveEffectKey(effect.key);
    setProgress(100);
    cooldownRef.current = true;

    // Cooldown : empêcher le spam (durée définie dans l'objet EFFECTS)
    const duration = effect.duration;

    // Start progress countdown
    const startTime = Date.now();
    if (progressIntervalRef.current) {
      clearInterval(progressIntervalRef.current);
    }

    progressIntervalRef.current = setInterval(() => {
      const elapsed = Date.now() - startTime;
      const remaining = Math.max(0, duration - elapsed);
      const progressPercent = (remaining / duration) * 100;
      setProgress(progressPercent);

      if (progressPercent <= 0) {
        clearInterval(progressIntervalRef.current);
        setIsActive(false);
        setActiveEffectKey(null);
        cooldownRef.current = false;
        // Passer à l'effet suivant
        setEffectIndex((i) => (i + 1) % EFFECTS.length);
      }
    }, 50);
  }, [effectIndex]);

  // Cleanup interval on unmount
  useEffect(() => {
    return () => {
      if (progressIntervalRef.current) {
        clearInterval(progressIntervalRef.current);
      }
    };
  }, []);

  const currentEffect = EFFECTS[effectIndex];
  const progressRingPerimeter = 4 * (39 - 2 * 10.5) + 2 * Math.PI * 10.5; // périmètre rect 39×39 rx=10.5
  const progressOffset = progressRingPerimeter * (1 - progress / 100);

  // Determine progress class for color transition
  let progressClass = '';
  if (progress > 75) progressClass = 'progress-75';
  else if (progress > 50) progressClass = 'progress-50';
  else if (progress > 25) progressClass = 'progress-25';

  return (
    <Tooltip text={`${currentEffect.icon} ${currentEffect.label}`} desc={isActive ? `Chargement ${Math.ceil(progress)}%` : 'Cliquer pour déclencher'} position="bottom">
    <button
      className={`header-action-btn particles-btn ${isActive ? 'particles-btn--active' : ''}`}
      onClick={triggerEffect}
      aria-label={`Effet particules : ${currentEffect.label}`}
      disabled={isActive}
    >
      {/* Cooldown Progress Ring */}
      {isActive && (
        <svg
          className="particles-progress-ring"
          viewBox="0 0 40 40"
          width="40"
          height="40"
        >
          <rect
            className={`particles-progress-ring__circle ${progressClass}`}
            x="0.5"
            y="0.5"
            width="39"
            height="39"
            rx="10.5"
            strokeWidth="2"
            strokeDasharray={progressRingPerimeter}
            strokeDashoffset={progressOffset}
          />
        </svg>
      )}

      {/* Effect Icon with Animation */}
      <svg
        className={`particles-icon ${activeEffectKey ? `particles-icon--${activeEffectKey}` : ''}`}
        viewBox="0 0 24 24"
        width="17"
        height="17"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
        aria-hidden="true"
      >
        {/* Étoile / spark central */}
        <path
          className="particles-icon__star"
          d="M12 2 L13.5 8.5 L20 7 L15 12 L20 17 L13.5 15.5 L12 22 L10.5 15.5 L4 17 L9 12 L4 7 L10.5 8.5 Z"
          fill="currentColor"
          stroke="none"
          opacity="0.9"
        />
        {/* Rayons dynamiques */}
        <line className="particles-icon__ray particles-icon__ray--1" x1="12" y1="1" x2="12" y2="4" />
        <line className="particles-icon__ray particles-icon__ray--2" x1="23" y1="12" x2="20" y2="12" />
        <line className="particles-icon__ray particles-icon__ray--3" x1="12" y1="23" x2="12" y2="20" />
        <line className="particles-icon__ray particles-icon__ray--4" x1="1" y1="12" x2="4" y2="12" />
      </svg>
    </button>
    </Tooltip>
  );
};

export default ParticlesButton;
