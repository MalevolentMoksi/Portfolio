import { getPerformanceTier, byTier } from '../utils/performanceTier';

const BASE_MOOD_COLORS: Record<string, string> = {
  default: '#d4af37',
  hacker: '#00ff41',
  vaporwave: '#ff71ce',
};

const EXTENDED_MOOD_COLORS: Record<string, string> = {
  ...BASE_MOOD_COLORS,
  europa: '#00E5FF',
  industrial: '#FF5722',
  nightshade: '#A366FF',
};

export const moodNeedsFullReconfigure = (mood: string): boolean =>
  mood === 'europa' || mood === 'industrial' || mood === 'nightshade';

export const getMoodColor = (mood: string): string => EXTENDED_MOOD_COLORS[mood] || BASE_MOOD_COLORS.default;

/**
 * Construit la config particles.js adaptee au mood.
 * Europa -> blizzard horizontal (blanc/cyan, rapide, traits fins)
 * Industrial -> cendres flottantes (orange, lent, remontee verticale)
 * Autres -> particules dorees classiques (ou recolorees)
 */
export const getParticlesConfig = (mood: string): Record<string, unknown> => {
  const tier = getPerformanceTier();
  const isMobile: boolean = window.innerWidth <= 768;
  const retinaDetect: boolean = tier === 'high';
  const enableAnims: boolean = tier !== 'low';

  if (mood === 'europa') {
    const count = byTier({
      high: isMobile ? 60 : 120,
      mid: isMobile ? 40 : 80,
      low: isMobile ? 25 : 45,
    });
    return {
      particles: {
        number: { value: count, density: { enable: true, value_area: 800 } },
        color: { value: ['#ffffff', '#E0F2FE', '#7DD3FC', '#00E5FF'] },
        shape: { type: 'edge', stroke: { width: 0, color: '#000' } },
        opacity: {
          value: 0.5,
          random: true,
          anim: { enable: enableAnims, speed: 1.2, opacity_min: 0.1, sync: false },
        },
        size: { value: 2.5, random: true, anim: { enable: false } },
        line_linked: { enable: true, distance: 80, color: '#7DD3FC', opacity: 0.08, width: 0.3 },
        move: {
          enable: true,
          speed: byTier({ high: 3.2, mid: 2.4, low: 1.6 }),
          direction: 'left',
          random: true,
          straight: true,
          out_mode: 'out',
          bounce: false,
        },
      },
      interactivity: {
        detect_on: 'canvas',
        events: { onhover: { enable: false }, onclick: { enable: false }, resize: true },
        modes: {},
      },
      retina_detect: retinaDetect,
    };
  }

  if (mood === 'industrial') {
    const count = byTier({
      high: isMobile ? 26 : 52,
      mid: isMobile ? 18 : 36,
      low: isMobile ? 10 : 20,
    });
    return {
      particles: {
        number: { value: count, density: { enable: true, value_area: 980 } },
        color: { value: ['#FF5722', '#FF8A65', '#FFD600', '#BF360C', '#FF7043', '#FFD180'] },
        shape: { type: ['circle', 'edge'], stroke: { width: 0, color: '#000' } },
        opacity: {
          value: 0.52,
          random: true,
          anim: { enable: enableAnims, speed: 0.65, opacity_min: 0.12, sync: false },
        },
        size: {
          value: 4.2,
          random: true,
          anim: { enable: enableAnims, speed: 1.25, size_min: 1.8, sync: false },
        },
        line_linked: {
          enable: true,
          distance: byTier({ high: 120, mid: 105, low: 90 }),
          color: '#FF8A65',
          opacity: 0.12,
          width: 0.5,
        },
        move: {
          enable: true,
          speed: byTier({ high: 1.1, mid: 0.8, low: 0.5 }),
          direction: 'top-right',
          random: true,
          straight: false,
          out_mode: 'out',
          bounce: false,
        },
      },
      interactivity: {
        detect_on: 'canvas',
        events: {
          onhover: { enable: enableAnims, mode: 'bubble' },
          onclick: { enable: true, mode: 'push' },
          resize: true,
        },
        modes: {
          bubble: {
            distance: byTier({ high: 170, mid: 145, low: 120 }),
            size: 6.4,
            duration: 1,
            opacity: 0.82,
            speed: 3,
          },
          push: { particles_nb: byTier({ high: 9, mid: 7, low: 4 }) },
        },
      },
      retina_detect: retinaDetect,
    };
  }

  if (mood === 'nightshade') {
    const count = byTier({
      high: isMobile ? 38 : 78,
      mid: isMobile ? 26 : 52,
      low: isMobile ? 14 : 26,
    });
    return {
      particles: {
        number: { value: count, density: { enable: true, value_area: 860 } },
        color: { value: ['#A366FF', '#8B5E83', '#C8B0D8', '#2D6A4F', '#52B788'] },
        shape: { type: 'circle', stroke: { width: 0, color: '#000' } },
        opacity: {
          value: 0.58,
          random: true,
          anim: { enable: enableAnims, speed: 0.65, opacity_min: 0.12, sync: false },
        },
        size: {
          value: 3.6,
          random: true,
          anim: { enable: enableAnims, speed: 1.05, size_min: 1.6, sync: false },
        },
        line_linked: {
          enable: true,
          distance: byTier({ high: 132, mid: 118, low: 98 }),
          color: '#A366FF',
          opacity: 0.06,
          width: 0.35,
        },
        move: {
          enable: true,
          speed: byTier({ high: 1.0, mid: 0.74, low: 0.42 }),
          direction: 'top',
          random: true,
          straight: false,
          out_mode: 'out',
          bounce: false,
        },
      },
      interactivity: {
        detect_on: 'canvas',
        events: {
          onhover: { enable: enableAnims, mode: 'repulse' },
          onclick: { enable: true, mode: 'push' },
          resize: true,
        },
        modes: {
          repulse: { distance: byTier({ high: 170, mid: 145, low: 120 }), duration: 0.8 },
          push: { particles_nb: byTier({ high: 12, mid: 9, low: 5 }) },
        },
      },
      retina_detect: retinaDetect,
    };
  }

  const color: string = BASE_MOOD_COLORS[mood] || BASE_MOOD_COLORS.default;
  const particleCount = byTier({
    high: isMobile ? 42 : 85,
    mid: isMobile ? 30 : 60,
    low: isMobile ? 20 : 35,
  });
  const linkDistance = byTier({ high: 160, mid: 145, low: 120 });

  return {
    particles: {
      number: { value: particleCount, density: { enable: true, value_area: 950 } },
      color: { value: color },
      shape: { type: 'circle', stroke: { width: 0, color: '#000000' } },
      opacity: {
        value: 0.4,
        random: true,
        anim: { enable: enableAnims, speed: 0.6, opacity_min: 0.08, sync: false },
      },
      size: {
        value: 4.8,
        random: true,
        anim: { enable: enableAnims, speed: 1.5, size_min: 2.0, sync: false },
      },
      line_linked: { enable: true, distance: linkDistance, color, opacity: 0.18, width: 0.6 },
      move: {
        enable: true,
        speed: 1,
        direction: 'none',
        random: true,
        straight: false,
        out_mode: 'out',
        bounce: false,
      },
    },
    interactivity: {
      detect_on: 'canvas',
      events: {
        onhover: { enable: enableAnims, mode: 'grab' },
        onclick: { enable: true, mode: 'push' },
        resize: true,
      },
      modes: {
        grab: { distance: 160, line_linked: { opacity: 0.35 } },
        push: { particles_nb: byTier({ high: 3, mid: 2, low: 1 }) },
      },
    },
    retina_detect: retinaDetect,
  };
};
