import '@styles/components/_about.css';
import useDocumentMeta from '@/hooks/useDocumentMeta';
import { useTranslation } from 'react-i18next';
import { MOODS } from '@/contexts/MoodContext';
import type { MoodKey } from '@/types';

/* ─── Données de la stack technique ─────────────────────── */
const STACK = [
  {
    id: 'react',
    name: 'React 18',
    role: 'Librairie UI',
    desc: 'Composants fonctionnels, hooks, lazy-loading des pages par route et Suspense pour le code-splitting.',
    color: '#61DAFB',
    icon: (
      <svg
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.4"
        strokeLinecap="round"
        strokeLinejoin="round"
        aria-hidden="true"
      >
        <circle cx="12" cy="12" r="2" fill="currentColor" stroke="none" />
        <ellipse cx="12" cy="12" rx="10" ry="3.5" />
        <ellipse cx="12" cy="12" rx="10" ry="3.5" transform="rotate(60 12 12)" />
        <ellipse cx="12" cy="12" rx="10" ry="3.5" transform="rotate(120 12 12)" />
      </svg>
    ),
  },
  {
    id: 'vite',
    name: 'Vite 8',
    role: 'Outil de build',
    desc: 'Build ultra-rapide avec HMR, aliases TypeScript, bundling optimise et integration PWA via vite-plugin-pwa.',
    color: '#646CFF',
    icon: (
      <svg
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinecap="round"
        strokeLinejoin="round"
        aria-hidden="true"
      >
        <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z" />
      </svg>
    ),
  },
  {
    id: 'router',
    name: 'React Router v6',
    role: 'Navigation SPA',
    desc: 'BrowserRouter avec Layout partagé via <Outlet />, NavLink actifs et navigation côté client sans rechargement.',
    color: '#F44250',
    icon: (
      <svg
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinecap="round"
        strokeLinejoin="round"
        aria-hidden="true"
      >
        <circle cx="12" cy="4" r="2" />
        <circle cx="4" cy="20" r="2" />
        <circle cx="20" cy="20" r="2" />
        <path d="M12 6v5M12 11L5.5 18M12 11l6.5 7" />
      </svg>
    ),
  },
  {
    id: 'framerMotion',
    name: 'Framer Motion v12',
    role: 'Animations',
    desc: 'Morphing de chemins SVG pour le robot mascotte, transitions de montée/sortie et effets de ressort.',
    color: '#BB4FF0',
    icon: (
      <svg
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinecap="round"
        strokeLinejoin="round"
        aria-hidden="true"
      >
        <path d="M5 3h14v8H5z" />
        <path d="M5 11h7v5H5z" />
        <path d="M5 16l7 5" />
      </svg>
    ),
  },
  {
    id: 'css',
    name: 'CSS sur mesure',
    role: 'Système de thèmes',
    desc: '35 modules CSS isoles, proprietes personnalisees centralisees dans _variables.css, zero !important, PostCSS + Autoprefixer.',
    color: '#2965F1',
    icon: (
      <svg
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinecap="round"
        strokeLinejoin="round"
        aria-hidden="true"
      >
        <path d="M4 4l7.07 17 2.51-7.39L21 11.07z" />
      </svg>
    ),
  },
  {
    id: 'githubPages',
    name: 'GitHub Pages + CI',
    role: 'Déploiement',
    desc: 'Build Vite deploye via GitHub Actions (typecheck + build + fallback 404). Configs Netlify/Vercel presentes pour un deploiement alternatif.',
    color: '#6E7681',
    icon: (
      <svg
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinecap="round"
        strokeLinejoin="round"
        aria-hidden="true"
      >
        <polyline points="16 16 12 12 8 16" />
        <line x1="12" y1="12" x2="12" y2="21" />
        <path d="M20.39 18.39A5 5 0 0018 9h-1.26A8 8 0 103 16.3" />
      </svg>
    ),
  },
];

/* ─── Données d'architecture ────────────────────────────── */
const ARCH = [
  {
    id: 'routing',
    label: 'Routing',
    items: [
      'BrowserRouter → Layout.tsx (shell partagé) → <Outlet />',
      'Toutes les pages sont lazy-loadées (code splitting par route)',
      'pageConfig dans Layout.tsx : fond, titre et meta par chemin',
    ],
  },
  {
    id: 'components',
    label: 'Composants',
    items: [
      '43 composants React TypeScript dans src/components/ (dont ambient et pet)',
      'Couche ambiante : 18 composants decoratifs dans components/ambient/',
      'CSS scopé par composant, pas de pollution de cascade',
    ],
  },
  {
    id: 'globalState',
    label: 'État global',
    items: [
      'MoodContext — thème actif, écriture dans localStorage',
      'ReadingTimeContext — estimation de lecture fournie aux pages',
      'ToastContext — notifications légères non-bloquantes',
      'AccessibilityContext — options a11y (contraste, typo, no-motion) persistees',
    ],
  },
  {
    id: 'customHooks',
    label: 'Hooks personnalisés',
    items: [
      'useDocumentMeta(title, desc) — SEO par page (title + meta)',
      'usePortfolioModules(tracks) — init lazy des modules legacy',
      'useReadingTimeEstimate() — durée de lecture estimée',
    ],
  },
  {
    id: 'legacyScripts',
    label: 'Scripts legacy',
    items: [
      'music-player.ts — lecteur audio persistant, throttle localStorage a ~1 ecriture/s',
      'effects.ts — particles.js, parallaxe, adaptation au tier de performance',
      'ui-enhancements.ts — typing, horloge footer, hover video, back-to-top',
      'lightbox.ts — zoom galerie avec navigation clavier sur les images .zoomable',
    ],
  },
];

/* ─── Ordre canonique des moods ─────────────────────────── */
const MOOD_ORDER: MoodKey[] = ['default', 'hacker', 'vaporwave', 'europa', 'industrial'];

/* ─── Effets ambiants ───────────────────────────────────── */
const AMBIENT = [
  {
    id: 'footerDiorama',
    name: 'FooterDiorama',
    desc: 'Pool de 10 mini-dioramas SVG; 2 ou 3 sont affiches aleatoirement au-dessus du footer a chaque changement de route.',
    icon: (
      <svg
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinecap="round"
        strokeLinejoin="round"
        aria-hidden="true"
      >
        <path d="M2 20h20M6 20V10M10 20V4M14 20V10M18 20V14" />
      </svg>
    ),
  },
  {
    id: 'ambientEffects',
    name: 'AmbientEffects',
    desc: 'Orchestrateur d effets ambiants selon mood, accessibilite et tier de performance (givre Europa, neons industriels, braises, drones, etc.).',
    icon: (
      <svg
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinecap="round"
        strokeLinejoin="round"
        aria-hidden="true"
      >
        <path d="M18.36 6.64a9 9 0 1 1-12.73 0" />
        <line x1="12" y1="2" x2="12" y2="12" />
      </svg>
    ),
  },
  {
    id: 'pet',
    name: 'Robot mascotte',
    desc: 'Compagnon interactif: deambulation RAF, drag pointer-capture, stats faim/bonheur, achievements, mini-jeu de catch, bulles SVG et visage Framer Motion.',
    icon: (
      <svg
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinecap="round"
        strokeLinejoin="round"
        aria-hidden="true"
      >
        <rect x="6" y="8" width="12" height="10" rx="2" />
        <path d="M9 8V6a3 3 0 0 1 6 0v2" />
        <circle cx="9.5" cy="13" r="1" fill="currentColor" stroke="none" />
        <circle cx="14.5" cy="13" r="1" fill="currentColor" stroke="none" />
        <path d="M9.5 17h5" />
      </svg>
    ),
  },
  {
    id: 'music',
    name: 'Lecteur musical',
    desc: 'Lecture persistante entre routes, decouverte auto des pistes .m4a/.mp3 dans /assets/music/, etat serialize (track, position, pause, volume, mute).',
    icon: (
      <svg
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinecap="round"
        strokeLinejoin="round"
        aria-hidden="true"
      >
        <path d="M9 18V5l12-2v13" />
        <circle cx="6" cy="18" r="3" />
        <circle cx="18" cy="16" r="3" />
      </svg>
    ),
  },
];

/* ─── Statistiques ──────────────────────────────────────── */
const STATS = [
  { value: '12', id: 'pages', label: 'Pages' },
  { value: '43', id: 'reactComponents', label: 'Composants React' },
  { value: '5', id: 'visualThemes', label: 'Thèmes visuels' },
  { value: '35', id: 'cssModules', label: 'Modules CSS' },
  { value: '4', id: 'legacyScripts', label: 'Scripts legacy' },
  { value: '1', id: 'pet', label: 'Robot mascotte' },
];

/* ─── Page About ────────────────────────────────────────── */
const About = () => {
  const { t } = useTranslation();
  useDocumentMeta(t('about.metaTitle'), t('about.metaDescription'));

  return (
    <>
      {/* === Stack technique === */}
      <section id="about-stack" aria-labelledby="about-stack-title">
        <h2 id="about-stack-title">{t('about.sections.stack.title')}</h2>
        <p className="about-intro">{t('about.sections.stack.intro')}</p>
        <div className="about-stack-grid" role="list">
          {STACK.map(({ id, name, role, desc, color, icon }) => (
            <article
              key={name}
              className="about-tech-card"
              role="listitem"
              style={{ '--tech-accent': color }}
            >
              <span className="about-tech-icon" aria-hidden="true">
                {icon}
              </span>
              <div className="about-tech-body">
                <strong className="about-tech-name">{name}</strong>
                <span className="about-tech-role">
                  {t(`about.stack.${id}.role`, { defaultValue: role })}
                </span>
                <p className="about-tech-desc">
                  {t(`about.stack.${id}.desc`, { defaultValue: desc })}
                </p>
              </div>
            </article>
          ))}
        </div>
      </section>

      {/* === Architecture === */}
      <section id="about-architecture" aria-labelledby="about-arch-title">
        <h2 id="about-arch-title">{t('about.sections.architecture.title')}</h2>
        <p className="about-intro">{t('about.sections.architecture.intro')}</p>
        <dl className="about-arch-list">
          {ARCH.map(({ id, label, items }) => (
            <div key={label} className="about-arch-entry">
              <dt className="about-arch-term">
                {t(`about.arch.${id}.label`, { defaultValue: label })}
              </dt>
              <dd className="about-arch-detail">
                <ul>
                  {items.map((item, index) => (
                    <li key={item}>
                      {t(`about.arch.${id}.items.${index}`, { defaultValue: item })}
                    </li>
                  ))}
                </ul>
              </dd>
            </div>
          ))}
        </dl>
      </section>

      {/* === Système de thèmes === */}
      <section id="about-themes" aria-labelledby="about-themes-title">
        <h2 id="about-themes-title">{t('about.sections.themes.title')}</h2>
        <p className="about-intro">
          {t('about.sections.themes.introPrefix')} <code>body[data-mood]</code>. Le thème est
          persisté dans <code>localStorage</code>.
        </p>
        <div
          className="about-mood-palette"
          role="list"
          aria-label={t('about.sections.themes.availableAria')}
        >
          {MOOD_ORDER.map((key) => {
            const m = MOODS[key];
            return (
              <div
                key={key}
                className="about-mood-swatch"
                role="listitem"
                style={{ '--mood-color': m.color, '--mood-rgb': m.rgb }}
              >
                <span className="about-mood-circle" aria-hidden="true" />
                <span className="about-mood-name">
                  {t(`common.mood.names.${key}`, { defaultValue: m.label })}
                </span>
              </div>
            );
          })}
        </div>
        <p className="about-theme-note">{t('about.sections.themes.note')}</p>
      </section>

      {/* === Effets & ambiance === */}
      <section id="about-ambient" aria-labelledby="about-ambient-title">
        <h2 id="about-ambient-title">{t('about.sections.ambient.title')}</h2>
        <p className="about-intro">{t('about.sections.ambient.intro')}</p>
        <div className="about-ambient-grid" role="list">
          {AMBIENT.map(({ id, name, desc, icon }) => (
            <article key={name} className="about-ambient-card" role="listitem">
              <span className="about-ambient-icon" aria-hidden="true">
                {icon}
              </span>
              <div>
                <strong className="about-ambient-name">
                  {t(`about.ambient.${id}.name`, { defaultValue: name })}
                </strong>
                <p className="about-ambient-desc">
                  {t(`about.ambient.${id}.desc`, { defaultValue: desc })}
                </p>
              </div>
            </article>
          ))}
        </div>
      </section>

      {/* === En chiffres === */}
      <section id="about-stats" aria-labelledby="about-stats-title">
        <h2 id="about-stats-title">{t('about.sections.stats.title')}</h2>
        <div className="about-stats-grid" role="list">
          {STATS.map(({ value, id, label }) => (
            <div key={label} className="about-stat" role="listitem">
              <span
                className="about-stat-value"
                aria-label={`${value} ${t(`about.stats.${id}`, { defaultValue: label })}`}
              >
                {value}
              </span>
              <span className="about-stat-label">
                {t(`about.stats.${id}`, { defaultValue: label })}
              </span>
            </div>
          ))}
        </div>
      </section>
    </>
  );
};

export default About;
