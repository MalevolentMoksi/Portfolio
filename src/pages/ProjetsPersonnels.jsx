import useDocumentMeta from '@/hooks/useDocumentMeta.js';
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
  useDocumentMeta('Projets Personnels | Portfolio', 'Mes projets personnels et illustrations');

  return (
    <>
    <section id="presentation" aria-labelledby="personal-projects-title">
      <h2 id="personal-projects-title">Présentation</h2>
      <p>
        Sur cette page sera présenté divers projets personnels et illustrations. Ils reflètent mon intérêt pour la programmation, le
        design et la créativité.
      </p>
      <p>
        <strong>PS : Cette page contient des videos qui se jouent au survol de la souris !</strong>
      </p>
    </section>

    <section aria-labelledby="discord-bot-title">
      <article className="project">
        <h2 id="discord-bot-title">Bot Discord <i>"Moksi's Bazaar"</i></h2>
        <img
            src={getAssetPath('assets/images/projects/MoksisBazaarIllustration.png')}
          loading="lazy"
          alt="Icone du Bot Discord Moksi's Bazaar"
          className="bot-icon"
        />

                <div className="project-tech" role="list" aria-label="Technologies utilisées pour le bot Discord">
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
          <strong>Moksi's Bazaar</strong> est un bot Discord complet développé en <strong>JavaScript/Node.js</strong> (discord.js v14),
          combinant casino, features sociales et IA conversationnelle. Le bot offre :
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
              <p>Blackjack (vs dealer), roulette, machine à sous, craps, high/low, slots progressifs, duels PvP, gacha, et même Tetris.</p>
            </div>
          </div>
          <div className="bot-feature-card">
            <svg className="bot-feature-icon" aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
              <line x1="12" y1="2" x2="12" y2="22"/>
              <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/>
            </svg>
            <div>
              <strong>Économie persistante</strong>
              <p>Monnaie virtuelle avec auto-seeding ($10k), classements par serveur et historique de transactions.</p>
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
              <p>Intégrée à OpenRouter (DeepSeek), analyse d'images en temps réel, personnalité adaptative selon l'attitude de l'utilisateur (hostile ↔ friendly).</p>
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
              <p>Suivi des sentiments, niveaux d'attitude (friendly, neutral, annoyed) et mémoire des conversations par utilisateur.</p>
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
              <p>Hébergée sur Railway via Docker, base PostgreSQL persistante avec 8 tables optimisées.</p>
            </div>
          </div>
        </div>

        <div className="bot-skills-section">
          <p className="bot-skills-label">Compétences acquises</p>
          <div className="bot-skills-tags">
            <span className="bot-skill-tag">Architecture logicielle</span>
            <span className="bot-skill-tag">Programmation asynchrone</span>
            <span className="bot-skill-tag">Gestion d'états complexes</span>
            <span className="bot-skill-tag">Optimisation API</span>
          </div>
        </div>
        <a
          href="https://github.com/MalevolentMoksi/Moksi-Bazaar"
          className="btn"
          target="_blank"
          rel="noopener noreferrer"
          aria-label="Voir le code du Bot Discord sur GitHub (ouvre dans une nouvelle fenetre)"
        >
          Voir le code sur GitHub
        </a>

        <h4 className="video-gallery-title">Démonstrations</h4>
        <div className="video-gallery" role="region" aria-label="Démonstrations vidéo du bot Discord">

          <div className="video-item">
            <div className="video-wrapper">
              <video className="hover-play" preload="metadata" muted loop playsInline aria-label="Demonstration du jeu de Blackjack">
                  <source src={getAssetPath('assets/videos/blackjack.mp4')} type="video/mp4" />
                Votre navigateur ne supporte pas la balise video.
              </video>
            </div>
            <div className="progress-container" aria-hidden="true">
              <div className="progress"></div>
            </div>
            <p className="caption">Jeu de Blackjack</p>
          </div>

          <div className="video-item">
            <div className="video-wrapper">
              <video className="hover-play" preload="metadata" muted loop playsInline aria-label="Demonstration du jeu de Roulette">
                  <source src={getAssetPath('assets/videos/roulette.mp4')} type="video/mp4" />
                Votre navigateur ne supporte pas la balise video.
              </video>
            </div>
            <div className="progress-container" aria-hidden="true">
              <div className="progress"></div>
            </div>
            <p className="caption">Jeu de Roulette</p>
          </div>

          <div className="video-item">
            <div className="video-wrapper">
              <video className="hover-play" preload="metadata" muted loop playsInline aria-label="Demonstration des fonds et classements">
                  <source src={getAssetPath('assets/videos/currency.mp4')} type="video/mp4" />
                Votre navigateur ne supporte pas la balise video.
              </video>
            </div>
            <div className="progress-container">
              <div className="progress"></div>
            </div>
            <p className="caption">Fonds &amp; Classement</p>
          </div>

          <div className="video-item">
            <div className="video-wrapper">
              <video className="hover-play" preload="metadata" muted loop playsInline>
                  <source src={getAssetPath('assets/videos/slots.mp4')} type="video/mp4" />
                Votre navigateur ne supporte pas la balise video.
              </video>
            </div>
            <div className="progress-container">
              <div className="progress"></div>
            </div>
            <p className="caption">Jeu de Machine à Sous</p>
          </div>
        </div>

        <details className="bot-fonctionnement">
          <summary>
            Architecture &amp; Fonctionnement Technique
          </summary>

          <div className="bot-details-content">
            <h4 className="bot-section-heading">Infrastructure &amp; Déploiement</h4>
            <p>
              Le bot est déployé sur <strong>Railway</strong> via Docker (Node 22-slim), assurant une disponibilité 24/7. 
              Une base de données <strong>PostgreSQL</strong> (intégrée à Railway) persiste l'ensemble des données utilisateur.
            </p>

            <h4 className="bot-section-heading">Schéma de Base de Données</h4>
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

            <h4 className="bot-section-heading">Architecture Logicielle</h4>
            <ul className="bot-compact-list">
              <li><strong>Slash Commands (discord.js v14)</strong> : 20+ commandes auto-registerées par serveur (pas de délai global)</li>
              <li><strong>Button Collectors</strong> : jeux multi-tours (blackjack, roulette) avec interface interactive</li>
              <li><strong>Événements asynchrones</strong> : gestion des interactions utilisateur et mises à jour en temps réel</li>
              <li><strong>Intégration IA</strong> : OpenRouter API (DeepSeek pour chat, Gemini 2.0 pour analyse d'images)</li>
              <li><strong>Sentiment Tracking</strong> : système d'adaptation de personnalité basé sur historique de conversation</li>
            </ul>

            <h4 className="bot-section-heading">Flux d'Exécution d'une Commande</h4>
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
                Dashboard Railway : suivi des variables d'environnement, métriques PostgreSQL, &amp; logs applicatifs
              </figcaption>
            </div>
          </div>
        </details>
      </article>
    </section>

    <hr />

    <section>
      <article className="project">
        <h2>Dessins personnels</h2>

        <div className="drawings-intro">
          <p>
            Depuis Janvier 2025, je me suis lancé dans le dessin numérique et traditionnel. Voici
            quelques-unes de mes illustrations, réalisées au crayon (2H à 6B) ou numériquement.
          </p>
          <p>J'explore différents styles et techniques, mais cela reste avant tout un hobby pour moi.</p>
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
            <p>ADA-1 de Destiny 2 - Portrait au crayon</p>
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
            <p>Power de Chainsaw Man - Illustrations numérique</p>
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
            <p>Ramattra de Overwatch 2 - Illustration au crayon</p>
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
            <p>Commission - Illustration numerique</p>
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
            <p>Goat &amp; Lamb de Cult of the Lamb - Illustration au crayon</p>
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
            <p>Exo Stranger de Destiny 2 - Illustration numerique</p>
          </div>
        </div>
      </article>
    </section>

    <hr />

    <section>
      <article className="project">
        <div className="title-with-logo">
          <h2>Jeux réalisés sur Scratch</h2>
            <img src={getAssetPath('assets/images/logos/ScratchLogo.png')} width="800" height="450" loading="lazy" alt="Logo Scratch" />
        </div>

        <p>
          En <strong>CM2</strong>, j'ai été introduit au logiciel en ligne Scratch par mon professeur. Cela a
          consommé une bonne partie de mon temps personnel que j'ai passé à faire des jeux jusqu'en
          2020. <br />
          Le programme permet de programmer de manière ludique, avec des blocs de code visuels. J'ai
          fabriqué plusieurs jeux avec le programme, tous plutôt rugueux mais certains sont encore
          jouables aujourd'hui.
        </p>
        <ul>
          <li>
            <strong>Compétences :</strong> Logique algorithmique, design d'interfaces, animations,
            gestion de variables et de sprites
          </li>
          <li>
            <strong>Techniques :</strong> Utilisation avancée de Scratch, optimisation des scripts,
            adaptation aux feedbacks utilisateurs
          </li>
        </ul>
        <a href="https://scratch.mit.edu/users/Sup3rSh00t3r/" className="btn" target="_blank" rel="noopener noreferrer">
          Voir mon profil Scratch
        </a>

        <div className="video-gallery video-gallery-spaced">
          <div className="video-item">
            <div className="video-wrapper">
              <video className="hover-play" preload="metadata" muted loop playsInline>
                  <source src={getAssetPath('assets/videos/stickman.mp4')} type="video/mp4" />
                Votre navigateur ne supporte pas la balise video.
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
              <video className="hover-play" preload="metadata" muted loop playsInline>
                  <source src={getAssetPath('assets/videos/RPG.mp4')} type="video/mp4" />
                Votre navigateur ne supporte pas la balise video.
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
