import { useState, useRef, useCallback } from 'react';

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
    const pJS = getPJS();
    if (!pJS) return;

    const W = window.innerWidth;
    const H = window.innerHeight;
    // Zones en haut à gauche et en haut à droite — hors zone du contenu central
    const zoneW = W * 0.25;
    const zoneH = H * 0.35;
    const headerH = 70; // hauteur approximative du header sticky

    // 15 particules dans le coin haut-gauche
    for (let i = 0; i < 15; i++) {
      pJS.fn.modes.pushParticles(1, {
        pos_x: Math.random() * zoneW,
        pos_y: headerH + Math.random() * (zoneH - headerH),
      });
    }
    // 15 particules dans le coin haut-droit
    for (let i = 0; i < 15; i++) {
      pJS.fn.modes.pushParticles(1, {
        pos_x: W - Math.random() * zoneW,
        pos_y: headerH + Math.random() * (zoneH - headerH),
      });
    }

    // Projeter toutes les particules vers l'extérieur depuis le centre
    const cx = W / 2;
    const cy = H / 4; // depuis le quart supérieur pour accompagner le spawn
    pJS.particles.array.forEach((pt) => {
      const dx = pt.x - cx;
      const dy = pt.y - cy;
      const dist = Math.sqrt(dx * dx + dy * dy) || 1;
      const burst = 5 + Math.random() * 5;
      pt.vx = (dx / dist) * burst;
      pt.vy = (dy / dist) * burst;
    });

    setTimeout(() => smoothRestore(1200), 600);
    window.petReact?.('scared');
  },

  /**
   * Attraction : les particules convergent vers un point aléatoire de l'écran.
   */
  attract() {
    const pJS = getPJS();
    if (!pJS) return;

    const cx = Math.random() * window.innerWidth;
    const cy = Math.random() * window.innerHeight;
    let active = true;
    window.petReact?.('excited');

    const pull = () => {
      if (!active) return;
      const p = getPJS();
      if (!p) return;
      p.particles.array.forEach((pt) => {
        const dx = cx - pt.x;
        const dy = cy - pt.y;
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
    }, 3000);
  },

  /**
   * Tempête : double le nombre de particules et uniformise leur vitesse.
   * Les nouvelles particules reçoivent exactement la même vitesse que
   * les anciennes pour éviter la disparité.
   */
  storm() {
    const pJS = getPJS();
    if (!pJS) return;

    const originalCount = pJS.particles.array.length;
    const bonus = Math.min(originalCount, 80); // max 80 extra
    const stormSpeed = 5;

    // Spawn en positions aléatoires
    for (let i = 0; i < bonus; i++) {
      pJS.fn.modes.pushParticles(1, {
        pos_x: Math.random() * window.innerWidth,
        pos_y: Math.random() * window.innerHeight,
      });
    }

    window.petReact?.('dizzy');

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
    }, 3000);
  },

  /**
   * Gravité : les particules tombent vers le bas du viewport et rebondissent.
   * Utilise pJS.canvas.h pour une détection de sol fiable.
   */
  gravity() {
    const pJS = getPJS();
    if (!pJS) return;
    let active = true;
    window.petReact?.('dizzy');

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
    }, 3000);
  },
};

/* ── Composant ─────────────────────────────────────── */

const ParticlesButton = () => {
  const [effectIndex, setEffectIndex] = useState(0);
  const [isActive, setIsActive] = useState(false);
  const cooldownRef = useRef(false);

  const triggerEffect = useCallback(() => {
    if (cooldownRef.current) return;

    const effect = EFFECTS[effectIndex];
    effects[effect.key]();

    setIsActive(true);
    cooldownRef.current = true;

    // Cooldown : empêcher le spam (durée définie dans l'objet EFFECTS)
    const duration = effect.duration;
    setTimeout(() => {
      setIsActive(false);
      cooldownRef.current = false;
      // Passer à l'effet suivant
      setEffectIndex((i) => (i + 1) % EFFECTS.length);
    }, duration);
  }, [effectIndex]);

  const currentEffect = EFFECTS[effectIndex];
  const nextEffect = EFFECTS[(effectIndex + 1) % EFFECTS.length];

  return (
    <button
      className={`header-action-btn particles-btn ${isActive ? 'particles-btn--active' : ''}`}
      onClick={triggerEffect}
      aria-label={`Effet particules : ${currentEffect.label}`}
      title={`${currentEffect.icon} ${currentEffect.label}${isActive ? ' (en cours…)' : ''}`}
      disabled={isActive}
    >
      <svg
        className={`particles-icon ${isActive ? 'particles-icon--pulse' : ''}`}
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
  );
};

export default ParticlesButton;
