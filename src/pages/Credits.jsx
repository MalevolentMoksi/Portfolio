import useDocumentMeta from '@/hooks/useDocumentMeta.js';

/* ─── Icône musique ────────────────────────────────────── */
const IconMusic = (
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
);

/* ─── Icône image / visuel ─────────────────────────────── */
const IconImage = (
  <svg
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="1.6"
    strokeLinecap="round"
    strokeLinejoin="round"
    aria-hidden="true"
  >
    <rect x="3" y="3" width="18" height="18" rx="2" />
    <circle cx="8.5" cy="8.5" r="1.5" />
    <path d="M21 15l-5-5L5 21" />
  </svg>
);

/* ─── Icône diplôme ────────────────────────────────────── */
const IconDiploma = (
  <svg
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="1.6"
    strokeLinecap="round"
    strokeLinejoin="round"
    aria-hidden="true"
  >
    <path d="M22 10v6M2 10l10-5 10 5-10 5z" />
    <path d="M6 12v5c3 3 9 3 12 0v-5" />
  </svg>
);

/* ─── Artistes musicaux ────────────────────────────────── */
const MUSIC_CREDITS = [
  {
    name: 'luxury elite',
    note: 'Pionnière du vaporwave et du future funk, atmosphères dorées et nostalgiques.',
  },
  {
    name: 'Graham Kartna',
    note: 'Compositions lo-fi et expérimentales aux textures douces et introspectives.',
  },
  {
    name: 'Anthemics',
    note: 'Musique électronique aux sonorités ambiantes et mélodiques.',
  },
  {
    name: 'Chris Christodoulou',
    note: 'Compositeur de la bande originale de Risk of Rain & Risk of Rain 2, post-rock progressif et électronique.',
  },
  {
    name: 'Bill Kiley',
    note: 'Compositions atmosphériques aux teintes lo-fi et dreamlike.',
  },
  {
    name: 'Black Hill & Silent Island',
    note: 'Ambient méditatif et cinématographique pour une écoute en profondeur.',
  },
];

/* ─── Crédits visuels ──────────────────────────────────── */
const VISUAL_CREDITS = [
  {
    title: 'Risk of Rain 2',
    studio: 'Hopoo Games',
    publisher: 'Gearbox Publishing',
    year: '2019',
    note: "Fonds d'écran tirés des visuels officiels du jeu.",
  },
  {
    title: 'Destiny 2',
    studio: 'Bungie',
    publisher: null,
    year: '2017',
    note: "Fonds d'écran tirés des visuels officiels, dont l'extension Beyond Light (Europa).",
  },
];

/* ─── Page Crédits ─────────────────────────────────────── */
const Credits = () => {
  useDocumentMeta(
    'Crédits | Portfolio',
    "Remerciements et crédits du portfolio d'Enzo Morello — musique, visuels et formation."
  );

  return (
    <>
      {/* === Musique === */}
      <section id="credits-music" aria-labelledby="credits-music-title">
        <h2 id="credits-music-title">
          <span className="credits-section-icon" aria-hidden="true">
            {IconMusic}
          </span>
          Musique
        </h2>
        <p className="credits-intro">
          Les artistes suivants accompagnent l'expérience sonore du portfolio. Leur travail mérite
          d'être découvert bien au-delà de ces pages.
        </p>
        <ol className="credits-music-list" aria-label="Artistes musicaux">
          {MUSIC_CREDITS.map(({ name, note }) => (
            <li key={name} className="credits-music-entry">
              <strong className="credits-artist-name">{name}</strong>
              <p className="credits-artist-note">{note}</p>
            </li>
          ))}
        </ol>
      </section>

      {/* === Visuels & fonds d'écran === */}
      <section id="credits-visuals" aria-labelledby="credits-visuals-title">
        <h2 id="credits-visuals-title">
          <span className="credits-section-icon" aria-hidden="true">
            {IconImage}
          </span>
          Visuels &amp; fonds d'écran
        </h2>
        <p className="credits-intro">
          Les illustrations utilisées comme arrière-plans appartiennent à leurs créateurs respectifs
          et sont reproduites ici à titre décoratif non-commercial.
        </p>
        <div className="credits-visuals-grid">
          {VISUAL_CREDITS.map(({ title, studio, publisher, year, note }) => (
            <article key={title} className="credits-visual-card">
              <div className="credits-visual-header">
                <strong className="credits-game-title">{title}</strong>
                <span className="credits-game-year">{year}</span>
              </div>
              <p className="credits-game-studio">
                © {studio}
                {publisher ? ` — édité par ${publisher}` : ''}
              </p>
              <p className="credits-visual-note">{note}</p>
            </article>
          ))}
        </div>
      </section>

      {/* === Formation === */}
      <section id="credits-education" aria-labelledby="credits-education-title">
        <h2 id="credits-education-title">
          <span className="credits-section-icon" aria-hidden="true">
            {IconDiploma}
          </span>
          Formation &amp; encadrement
        </h2>
        <article className="credits-education-card">
          <strong className="credits-edu-name">
            L'équipe pédagogique de l'IUT2 — Université Grenoble Alpes
          </strong>
          <p className="credits-edu-note">
            Un remerciement sincère aux enseignants et intervenants du département informatique de
            l'IUT2 de l'UGA pour la qualité de leur encadrement, la rigueur de leur enseignement et
            leur disponibilité tout au long du cursus BUT Informatique. Les projets présentés dans
            ce portfolio sont le reflet direct des compétences transmises et des défis proposés au
            fil des semestres.
          </p>
        </article>
      </section>
    </>
  );
};

export default Credits;
