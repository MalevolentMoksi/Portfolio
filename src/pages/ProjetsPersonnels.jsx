import useDocumentMeta from '@/hooks/useDocumentMeta.js';
import { useTranslation } from 'react-i18next';
import { getAssetPath } from '@/utils/assetPath.js';
import Tooltip from '@/components/Tooltip.jsx';

const discordBotTechnologies = [
  {
    name: 'JavaScript',
    icon: 'https://cdn.jsdelivr.net/npm/simple-icons@v11/icons/javascript.svg',
  },
  {
    name: 'Node.js',
    icon: 'https://cdn.jsdelivr.net/npm/simple-icons@v11/icons/nodedotjs.svg',
  },
  {
    name: 'Discord',
    icon: 'https://cdn.jsdelivr.net/npm/simple-icons@v11/icons/discord.svg',
  },
  {
    name: 'PostgreSQL',
    icon: 'https://cdn.jsdelivr.net/npm/simple-icons@v11/icons/postgresql.svg',
  },
  {
    name: 'Docker',
    icon: 'https://cdn.jsdelivr.net/npm/simple-icons@v11/icons/docker.svg',
  },
  {
    name: 'Railway',
    icon: 'https://cdn.jsdelivr.net/npm/simple-icons@v11/icons/railway.svg',
  },
  {
    name: 'OpenRouter',
    icon: 'https://cdn.jsdelivr.net/npm/simple-icons@v11/icons/openai.svg',
  },
];

const ProjetsPersonnels = () => {
  const { t } = useTranslation();
  useDocumentMeta(t('projetsPersonnels.metaTitle'), t('projetsPersonnels.metaDescription'));

  return (
    <>
    <section id="presentation" aria-labelledby="personal-projects-title">
      <h2 id="personal-projects-title">{t('projetsPersonnels.presentation.title')}</h2>
      <p>
        {t('projetsPersonnels.presentation.description')}
      </p>
      <p>
        <strong>{t('projetsPersonnels.presentation.notice')}</strong>
      </p>
    </section>

    <section aria-labelledby="discord-bot-title">
      <article className="project">
        <h2 id="discord-bot-title">{t('projetsPersonnels.discord.title')} <i>"Moksi's Bazaar"</i></h2>
        <img
            src={getAssetPath('assets/images/projects/MoksisBazaarIllustration.png')}
          loading="lazy"
          alt={t('projetsPersonnels.discord.iconAlt')}
          className="bot-icon"
        />

                <div className="project-tech" role="list" aria-label={t('projetsPersonnels.discord.technologiesAria')}>
          {discordBotTechnologies.map((tech) => (
            <div key={tech.name} role="listitem">
              <Tooltip text={tech.name}>
                <img
                  src={tech.icon}
                  alt={tech.name}
                  className="tech-icon"
                  loading="lazy"
                  width="36"
                  height="36"
                />
              </Tooltip>
            </div>
          ))}
        </div>

        <p>
          <strong>Moksi's Bazaar</strong> {t('projetsPersonnels.discord.intro')}
        </p>



        <div className="bot-features-grid">
          <div className="bot-feature-card">
            <svg className="bot-feature-icon" aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
              <rect x="2" y="3" width="20" height="14" rx="2"/>
              <circle cx="8" cy="8" r="1.5" fill="currentColor" stroke="none"/>
              <circle cx="12" cy="10" r="1.5" fill="currentColor" stroke="none"/>
              <circle cx="16" cy="8" r="1.5" fill="currentColor" stroke="none"/>
              <path d="M6 21h12M12 17v4"/>
            </svg>
            <div>
              <strong>15+ mini-jeux de casino</strong>
              <p>{t('projetsPersonnels.discord.features.games')}</p>
            </div>
          </div>
          <div className="bot-feature-card">
            <svg className="bot-feature-icon" aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
              <line x1="12" y1="2" x2="12" y2="22"/>
              <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/>
            </svg>
            <div>
              <strong>Économie persistante</strong>
              <p>{t('projetsPersonnels.discord.features.economy')}</p>
            </div>
          </div>
          <div className="bot-feature-card">
            <svg className="bot-feature-icon" aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
              <rect x="4" y="4" width="16" height="16" rx="2"/>
              <rect x="9" y="9" width="6" height="6"/>
              <path d="M9 2v2M15 2v2M9 20v2M15 20v2M2 9h2M2 15h2M20 9h2M20 15h2"/>
            </svg>
            <div>
              <strong>IA conversationnelle</strong>
              <p>{t('projetsPersonnels.discord.features.ai')}</p>
            </div>
          </div>
          <div className="bot-feature-card">
            <svg className="bot-feature-icon" aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="9" cy="7" r="3"/>
              <circle cx="17" cy="9" r="2.5"/>
              <path d="M3 20a6 6 0 0 1 12 0"/>
              <path d="M17 14c2.5 0 5 1.2 5 4"/>
            </svg>
            <div>
              <strong>Système de relations</strong>
              <p>{t('projetsPersonnels.discord.features.relations')}</p>
            </div>
          </div>
          <div className="bot-feature-card">
            <svg className="bot-feature-icon" aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
              <rect x="2" y="3" width="20" height="5" rx="1"/>
              <rect x="2" y="11" width="20" height="5" rx="1"/>
              <circle cx="18" cy="5.5" r="0.75" fill="currentColor" stroke="none"/>
              <circle cx="18" cy="13.5" r="0.75" fill="currentColor" stroke="none"/>
              <path d="M6 19h12M12 16v3"/>
            </svg>
            <div>
              <strong>Infrastructure 24/7</strong>
              <p>{t('projetsPersonnels.discord.features.infrastructure')}</p>
            </div>
          </div>
        </div>

        <div className="bot-skills-section">
          <p className="bot-skills-label">{t('projetsPersonnels.discord.skillsLabel')}</p>
          <div className="bot-skills-tags">
            <span className="bot-skill-tag">{t('projetsPersonnels.discord.skills.architecture')}</span>
            <span className="bot-skill-tag">{t('projetsPersonnels.discord.skills.async')}</span>
            <span className="bot-skill-tag">{t('projetsPersonnels.discord.skills.state')}</span>
            <span className="bot-skill-tag">{t('projetsPersonnels.discord.skills.api')}</span>
          </div>
        </div>
        <a
          href="https://github.com/MalevolentMoksi/Moksi-Bazaar"
          className="btn"
          target="_blank"
          rel="noopener noreferrer"
          aria-label={t('projetsPersonnels.discord.githubAria')}
        >
          {t('projetsPersonnels.discord.github')}
        </a>

        <h4 className="video-gallery-title">{t('projetsPersonnels.discord.demosTitle')}</h4>
        <div className="video-gallery" role="region" aria-label={t('projetsPersonnels.discord.demosAria')}>

          <div className="video-item">
            <div className="video-wrapper">
              <video className="hover-play" preload="metadata" muted loop playsInline aria-label={t('projetsPersonnels.discord.captions.blackjack')}>
                  <source src={getAssetPath('assets/videos/blackjack.mp4')} type="video/mp4" />
                {t('common.videoNotSupported')}
              </video>
            </div>
            <div className="progress-container" aria-hidden="true">
              <div className="progress"></div>
            </div>
            <p className="caption">{t('projetsPersonnels.discord.captions.blackjack')}</p>
          </div>

          <div className="video-item">
            <div className="video-wrapper">
              <video className="hover-play" preload="metadata" muted loop playsInline aria-label={t('projetsPersonnels.discord.captions.roulette')}>
                  <source src={getAssetPath('assets/videos/roulette.mp4')} type="video/mp4" />
                {t('common.videoNotSupported')}
              </video>
            </div>
            <div className="progress-container" aria-hidden="true">
              <div className="progress"></div>
            </div>
            <p className="caption">{t('projetsPersonnels.discord.captions.roulette')}</p>
          </div>

          <div className="video-item">
            <div className="video-wrapper">
              <video className="hover-play" preload="metadata" muted loop playsInline aria-label={t('projetsPersonnels.discord.captions.currency')}>
                  <source src={getAssetPath('assets/videos/currency.mp4')} type="video/mp4" />
                {t('common.videoNotSupported')}
              </video>
            </div>
            <div className="progress-container">
              <div className="progress"></div>
            </div>
            <p className="caption">{t('projetsPersonnels.discord.captions.currency')}</p>
          </div>

          <div className="video-item">
            <div className="video-wrapper">
              <video className="hover-play" preload="metadata" muted loop playsInline aria-label={t('projetsPersonnels.discord.captions.slots')}>
                  <source src={getAssetPath('assets/videos/slots.mp4')} type="video/mp4" />
                {t('common.videoNotSupported')}
              </video>
            </div>
            <div className="progress-container">
              <div className="progress"></div>
            </div>
            <p className="caption">{t('projetsPersonnels.discord.captions.slots')}</p>
          </div>
        </div>

        <details className="bot-fonctionnement">
          <summary>
            {t('projetsPersonnels.discord.architectureSummary')}
          </summary>

          <div className="bot-details-content">
            <h4 className="bot-section-heading">{t('projetsPersonnels.discord.sections.infrastructure')}</h4>
            <p>
              Le bot est déployé sur <strong>Railway</strong> via Docker (Node 22-slim), assurant une disponibilité 24/7. 
              Une base de données <strong>PostgreSQL</strong> (intégrée à Railway) persiste l'ensemble des données utilisateur.
            </p>

            <h4 className="bot-section-heading">{t('projetsPersonnels.discord.sections.database')}</h4>
            <p>PostgreSQL contient <strong>8 tables structurées</strong> :</p>
            <table className="bot-schema-table">
              <thead>
                <tr>
                  <th>Table</th>
                  <th>Rôle</th>
                </tr>
              </thead>
              <tbody>
                <tr><td><code>balances</code></td><td>Solde virtuel par utilisateur, auto-seeding à $10k</td></tr>
                <tr><td><code>user_preferences</code></td><td>Contexte utilisateur, attitude et sentiment score</td></tr>
                <tr><td><code>conversation_memories</code></td><td>Historique IA par utilisateur — auto-cleanup après 1000 lignes</td></tr>
                <tr><td><code>media_cache</code></td><td>Cache des descriptions d'images pour limiter les appels OpenRouter</td></tr>
                <tr><td><code>reminders</code></td><td>Rappels persistants avec scheduling inter-redémarrages</td></tr>
                <tr><td><code>pending_duels</code></td><td>Défis PvP en attente — survit aux redémarrages Docker</td></tr>
                <tr><td><code>user_cooldowns</code></td><td>Cooldowns persistants anti-spam par commande</td></tr>
                <tr><td><code>sleepy_counts</code></td><td>Statistiques d'usage par commande et par serveur</td></tr>
              </tbody>
            </table>

            <h4 className="bot-section-heading">{t('projetsPersonnels.discord.sections.software')}</h4>
            <ul className="bot-compact-list">
              <li><strong>Slash Commands (discord.js v14)</strong> : 20+ commandes auto-registerées par serveur (pas de délai global)</li>
              <li><strong>Button Collectors</strong> : jeux multi-tours (blackjack, roulette) avec interface interactive</li>
              <li><strong>Événements asynchrones</strong> : gestion des interactions utilisateur et mises à jour en temps réel</li>
              <li><strong>Intégration IA</strong> : OpenRouter API (DeepSeek pour chat, Gemini 2.0 pour analyse d'images)</li>
              <li><strong>Sentiment Tracking</strong> : système d'adaptation de personnalité basé sur historique de conversation</li>
            </ul>

            <h4 className="bot-section-heading">{t('projetsPersonnels.discord.sections.flow')}</h4>
            <ol className="bot-flow">
              <li>
                <span className="bot-flow-step">1</span>
                <p>Utilisateur appelle une commande slash <code>/bj bet 500</code></p>
              </li>
              <li>
                <span className="bot-flow-step">2</span>
                <p>Vérification du solde dans <code>balances</code> — rejet si insuffisant</p>
              </li>
              <li>
                <span className="bot-flow-step">3</span>
                <p>Logique du jeu avec <strong>Button Collectors</strong> discord.js pour les actions du joueur</p>
              </li>
              <li>
                <span className="bot-flow-step">4</span>
                <p>Mise à jour transactionnelle dans PostgreSQL</p>
              </li>
              <li>
                <span className="bot-flow-step">5</span>
                <p>Embed Discord renvoyé avec état et résultat de la partie</p>
              </li>
            </ol>

            <div className="bot-dashboard-container">
              <img
                  src={getAssetPath('assets/images/projects/railway-dashboard.png')}
                loading="lazy"
                alt="Tableau de bord Railway pour le bot Discord"
                className="bot-dashboard-image"
              />
              <figcaption className="bot-dashboard-caption">
                {t('projetsPersonnels.discord.dashboardCaption')}
              </figcaption>
            </div>
          </div>
        </details>
      </article>
    </section>

    <hr />

    <section>
      <article className="project">
        <h2>{t('projetsPersonnels.drawings.title')}</h2>

        <div className="drawings-intro">
          <p>
            {t('projetsPersonnels.drawings.description1')}
          </p>
          <p>{t('projetsPersonnels.drawings.description2')}</p>
        </div>

        <div className="drawings-grid">
          <div className="drawing-item">
            <img
              className="zoomable"
                src={getAssetPath('assets/images/drawings/ADA1.jpg')}
              width="800"
              height="450"
              loading="lazy"
              alt="ADA-1 de Destiny 2 au crayon"
            />
            <p>{t('projetsPersonnels.drawings.captions.ada1')}</p>
          </div>

          <div className="drawing-item">
            <img
              className="zoomable"
                src={getAssetPath('assets/images/drawings/PowerDrawing.png')}
              width="800"
              height="450"
              loading="lazy"
              alt="Illustration numérique"
            />
            <p>{t('projetsPersonnels.drawings.captions.power')}</p>
          </div>

          <div className="drawing-item">
            <img
              className="zoomable"
                src={getAssetPath('assets/images/drawings/RamattraDrawing.jpg')}
              width="800"
              height="450"
              loading="lazy"
              alt="Illustration au crayon"
            />
            <p>{t('projetsPersonnels.drawings.captions.ramattra')}</p>
          </div>

          <div className="drawing-item">
            <img
              className="zoomable"
                src={getAssetPath('assets/images/drawings/CaptainComm.webp')}
              width="800"
              height="450"
              loading="lazy"
              alt="Illustration numerique"
            />
            <p>{t('projetsPersonnels.drawings.captions.commission')}</p>
          </div>

          <div className="drawing-item">
            <img
              className="zoomable"
                src={getAssetPath('assets/images/drawings/GoatLamb.jpg')}
              width="800"
              height="450"
              loading="lazy"
              alt="Dessin au stylo"
            />
            <p>{t('projetsPersonnels.drawings.captions.goatLamb')}</p>
          </div>

          <div className="drawing-item">
            <img
              className="zoomable"
                src={getAssetPath('assets/images/drawings/ElsiePortrait.webp')}
              width="800"
              height="450"
              loading="lazy"
              alt="Illustration numerique"
            />
            <p>{t('projetsPersonnels.drawings.captions.elsie')}</p>
          </div>
        </div>
      </article>
    </section>

    <hr />

    <section>
      <article className="project">
        <div className="title-with-logo">
          <h2>{t('projetsPersonnels.scratch.title')}</h2>
            <img src={getAssetPath('assets/images/logos/ScratchLogo.png')} width="800" height="450" loading="lazy" alt="Logo Scratch" />
        </div>

        <p>
          {t('projetsPersonnels.scratch.description')}
        </p>
        <ul>
          <li>
            <strong>{t('projetsPersonnels.scratch.skillsLabel')}</strong> {t('projetsPersonnels.scratch.skills')}
          </li>
          <li>
            <strong>{t('projetsPersonnels.scratch.techniquesLabel')}</strong> {t('projetsPersonnels.scratch.techniques')}
          </li>
        </ul>
        <a href="https://scratch.mit.edu/users/Sup3rSh00t3r/" className="btn" target="_blank" rel="noopener noreferrer">
          {t('projetsPersonnels.scratch.profile')}
        </a>

        <div className="video-gallery video-gallery-spaced">
          <div className="video-item">
            <div className="video-wrapper">
              <video className="hover-play" preload="metadata" muted loop playsInline aria-label={t('projetsPersonnels.scratch.captions.stickman')}>
                  <source src={getAssetPath('assets/videos/stickman.mp4')} type="video/mp4" />
                {t('common.videoNotSupported')}
              </video>
            </div>
            <div className="progress-container">
              <div className="progress"></div>
            </div>
            <p className="caption">
              <i>"Stickman Adventure"</i>
            </p>
          </div>

          <div className="video-item">
            <div className="video-wrapper">
              <video className="hover-play" preload="metadata" muted loop playsInline aria-label={t('projetsPersonnels.scratch.captions.rpg')}>
                  <source src={getAssetPath('assets/videos/RPG.mp4')} type="video/mp4" />
                {t('common.videoNotSupported')}
              </video>
            </div>
            <div className="progress-container">
              <div className="progress"></div>
            </div>
            <p className="caption">
              <i>"RPG 1.2v"</i>
            </p>
          </div>
        </div>
      </article>
    </section>

    </>
  );
};
export default ProjetsPersonnels;
