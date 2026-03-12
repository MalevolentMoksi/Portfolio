import useDocumentMeta from '@/hooks/useDocumentMeta.js';
import { MOODS } from '@/contexts/MoodContext.jsx';

/* ─── Données de la stack technique ─────────────────────── */
const STACK = [
  {
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
    name: 'Vite 5',
    role: 'Outil de build',
    desc: 'Bundler ultra-rapide avec HMR, path aliases (@/, @styles/, @components/…) et optimisation de production.',
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
    name: 'CSS sur mesure',
    role: 'Système de thèmes',
    desc: '25+ modules CSS isolés, propriétés personnalisées centralisées dans _variables.css, zéro !important, PostCSS + Autoprefixer.',
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
    name: 'GitHub Pages',
    role: 'Déploiement',
    desc: 'Build Vite optimisé déployé automatiquement via gh-pages, servi comme SPA statique sur le domaine GitHub.',
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
    label: 'Routing',
    items: [
      'BrowserRouter → Layout.jsx (shell partagé) → <Outlet />',
      'Toutes les pages sont lazy-loadées (code splitting par route)',
      'pageConfig dans Layout.jsx : fond, titre et méta par chemin',
    ],
  },
  {
    label: 'Composants',
    items: [
      '~30 composants React isolés dans src/components/',
      'Couche ambiante : 13 effets décoratifs dans components/ambient/',
      'CSS scopé par composant, pas de pollution de cascade',
    ],
  },
  {
    label: 'État global',
    items: [
      'MoodContext — thème actif, écriture dans localStorage',
      'ReadingTimeContext — estimation de lecture fournie aux pages',
      'ToastContext — notifications légères non-bloquantes',
    ],
  },
  {
    label: 'Hooks personnalisés',
    items: [
      'useDocumentMeta(title, desc) — SEO par page (title + meta)',
      'usePortfolioModules(tracks) — init lazy des modules legacy',
      'useReadingTimeEstimate() — durée de lecture estimée',
    ],
  },
  {
    label: 'Scripts legacy',
    items: [
      'music-player.js — lecteur audio persistant, throttle localStorage à 1 éc/s',
      'effects.js — particles.js, parallaxe, suivi souris',
      'ui-enhancements.js — animation de frappe, horloge, hover vidéo',
      'lightbox.js — zoom galerie sur les images .zoomable',
    ],
  },
];

/* ─── Ordre canonique des moods ─────────────────────────── */
const MOOD_ORDER = ['default', 'hacker', 'vaporwave', 'europa', 'industrial'];

/* ─── Effets ambiants ───────────────────────────────────── */
const AMBIENT = [
  {
    name: 'FooterDiorama',
    desc: '8 structures SVG animées (antenne relais, radar, phare, tour, bobine Tesla…) placées aléatoirement au-dessus du footer à chaque navigation.',
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
    name: 'AmbientEffects',
    desc: 'Effets météo liés au mood : givre Europa, néons et vapeurs Industriels, silhouettes, drones, braises, ondes de puissance.',
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
    name: 'Robot mascotte',
    desc: 'Compagnon interactif : déambulation par RAF, drag par capture de pointeur, stats faim/bonheur, bulles de pensée SVG et morphing de visage Framer Motion.',
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
    name: 'Lecteur musical',
    desc: 'Lecture persistante entre les routes, découverte automatique des pistes .m4a dans /assets/music/, état sérialisé dans localStorage (track, position, pause).',
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
  { value: '10', label: 'Pages' },
  { value: '30+', label: 'Composants React' },
  { value: '5', label: 'Thèmes visuels' },
  { value: '25+', label: 'Modules CSS' },
  { value: '4', label: 'Scripts legacy' },
  { value: '1', label: 'Robot mascotte' },
];

/* ─── Page About ────────────────────────────────────────── */
const About = () => {
  useDocumentMeta(
    'À propos | Portfolio',
    "Architecture et stack technique du portfolio d'Enzo Morello — React, Vite, Framer Motion, CSS sur mesure."
  );

  return (
    <>
      {/* === Stack technique === */}
      <section id="about-stack" aria-labelledby="about-stack-title">
        <h2 id="about-stack-title">Stack technique</h2>
        <p className="about-intro">
          Technologies choisies pour ce portfolio — légères, modernes, sans dépendances superflues.
        </p>
        <div className="about-stack-grid" role="list">
          {STACK.map(({ name, role, desc, color, icon }) => (
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
                <span className="about-tech-role">{role}</span>
                <p className="about-tech-desc">{desc}</p>
              </div>
            </article>
          ))}
        </div>
      </section>

      {/* === Architecture === */}
      <section id="about-architecture" aria-labelledby="about-arch-title">
        <h2 id="about-arch-title">Architecture</h2>
        <p className="about-intro">
          Application React SPA (Single Page Application) avec modules JavaScript legacy coexistant
          pour les effets et la musique.
        </p>
        <dl className="about-arch-list">
          {ARCH.map(({ label, items }) => (
            <div key={label} className="about-arch-entry">
              <dt className="about-arch-term">{label}</dt>
              <dd className="about-arch-detail">
                <ul>
                  {items.map((item) => (
                    <li key={item}>{item}</li>
                  ))}
                </ul>
              </dd>
            </div>
          ))}
        </dl>
      </section>

      {/* === Système de thèmes === */}
      <section id="about-themes" aria-labelledby="about-themes-title">
        <h2 id="about-themes-title">Système de thèmes</h2>
        <p className="about-intro">
          Cinq ambiances visuelles pilotées par des propriétés CSS personnalisées sur{' '}
          <code>body[data-mood]</code>. Le thème est persisté dans <code>localStorage</code>.
        </p>
        <div className="about-mood-palette" role="list" aria-label="Thèmes disponibles">
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
                <span className="about-mood-name">{m.label}</span>
              </div>
            );
          })}
        </div>
        <p className="about-theme-note">
          Les couleurs d'accentuation, de fond, de texte et les filtres d'icônes s'adaptent
          automatiquement à chaque thème via les mêmes variables CSS — aucun JavaScript nécessaire
          pour le rendu.
        </p>
      </section>

      {/* === Effets & ambiance === */}
      <section id="about-ambient" aria-labelledby="about-ambient-title">
        <h2 id="about-ambient-title">Effets &amp; ambiance</h2>
        <p className="about-intro">
          Couche décorative non-bloquante : les effets se chargent en arrière-plan et se retirent
          gracieusement si le DOM cible est absent.
        </p>
        <div className="about-ambient-grid" role="list">
          {AMBIENT.map(({ name, desc, icon }) => (
            <article key={name} className="about-ambient-card" role="listitem">
              <span className="about-ambient-icon" aria-hidden="true">
                {icon}
              </span>
              <div>
                <strong className="about-ambient-name">{name}</strong>
                <p className="about-ambient-desc">{desc}</p>
              </div>
            </article>
          ))}
        </div>
      </section>

      {/* === En chiffres === */}
      <section id="about-stats" aria-labelledby="about-stats-title">
        <h2 id="about-stats-title">En chiffres</h2>
        <div className="about-stats-grid" role="list">
          {STATS.map(({ value, label }) => (
            <div key={label} className="about-stat" role="listitem">
              <span className="about-stat-value" aria-label={`${value} ${label}`}>
                {value}
              </span>
              <span className="about-stat-label">{label}</span>
            </div>
          ))}
        </div>
      </section>
    </>
  );
};

export default About;
