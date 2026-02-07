import useDocumentMeta from '@/hooks/useDocumentMeta.js';
import { getAssetPath } from '@/utils/assetPath.js';

const ProjetsPersonnels = () => {
  useDocumentMeta('Projets Personnels | Portfolio', 'Mes projets personnels et illustrations');

  return (
    <>
    <section id="presentation" aria-labelledby="personal-projects-title">
      <h2 id="personal-projects-title">Présentation</h2>
      <p>
        Voici quelques projets personnels que j'ai réalisés, principalement pour m'amuser et
        apprendre de nouvelles compétences. Ils reflètent mon intérêt pour la programmation, le
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
            src={getAssetPath('assets/images/discordBotIcon.png')}
          loading="lazy"
          alt="Icone du Bot Discord Moksi's Bazaar"
          className="bot-icon"
        />

        <p>
          <strong>Moksi's Bazaar</strong> est un bot Discord complet développé en <strong>JavaScript/Node.js</strong> (discord.js v14),
          combinant casino, features sociales et IA conversationnelle. Le bot offre :
        </p>
        <ul className="bot-features-list">
          <li><strong>15+ mini-jeux de casino</strong> : blackjack (vs dealer), roulette, machine à sous, craps, high/low, slots progressifs, duels PvP, gacha, et même Tetris</li>
          <li><strong>Système économique persistant</strong> : monnaie virtuelle avec auto-seeding ($10k), classements par serveur, historique de transactions</li>
          <li><strong>IA conversationnelle avancée</strong> : intégrée à OpenRouter (DeepSeek), analyse d'images en temps réel, adaptation de personnalité selon l'attitude de l'utilisateur (hostile ↔ friendly)</li>
          <li><strong>Système de relations multi-utilisateurs</strong> : suivi des sentiments, niveaux d'attitude (friendly, neutral, annoyed), mémoire des conversations</li>
          <li><strong>Infrastructure 24/7</strong> : hébergée sur Railway (Docker), base PostgreSQL persistante avec 8 tables optimisées</li>
        </ul>
        <ul>
          <li><strong>Compétences :</strong> Architecture logicielle, programmation asynchrone, gestion d'états complexes, optimisation API</li>
          <li><strong>Techniques :</strong> JavaScript (Node.js, discord.js v14), PostgreSQL (8 tables), Docker, Railway, OpenRouter API, Slash Commands, Button Collectors</li>
        </ul>
        <a
          href="https://github.com/MalevolentMoksi/Moksi-Bazaar"
          className="btn"
          target="_blank"
          rel="noopener noreferrer"
          aria-label="Voir le code du Bot Discord sur GitHub (ouvre dans une nouvelle fenetre)"
        >
          Voir le code sur GitHub
        </a>

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
              <video className="hover-play" preload="metadata" muted loop playsInline>
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

            <h4 className="bot-section-heading">Système de Base de Données</h4>
            <p>PostgreSQL contient <strong>8 tables structurées</strong> :</p>
            <ul className="bot-compact-list">
              <li><code>balances</code> : solde virtuel par utilisateur (auto-seeding $10k)</li>
              <li><code>user_preferences</code> : contexte utilisateur, attitude, sentiment score</li>
              <li><code>conversation_memories</code> : historique des messages pour contexte IA (auto-cleanup après 1000 lignes)</li>
              <li><code>media_cache</code> : cache des descriptions d'images (optimise coûts API OpenRouter)</li>
              <li><code>reminders</code> : système de rappels persistants avec scheduling</li>
              <li><code>pending_duels</code> : défis PvP en attente, survit aux redémarrages</li>
              <li><code>user_cooldowns</code> : cooldowns persistants pour éviter spam</li>
              <li><code>sleepy_counts</code> : stats de commande par serveur</li>
            </ul>

            <h4 className="bot-section-heading">Architecture Logicielle</h4>
            <ul className="bot-compact-list">
              <li><strong>Slash Commands (discord.js v14)</strong> : 20+ commandes auto-registerées par serveur (pas de délai global)</li>
              <li><strong>Button Collectors</strong> : jeux multi-tours (blackjack, roulette) avec interface interactive</li>
              <li><strong>Événements asynchrones</strong> : gestion des interactions utilisateur et mises à jour en temps réel</li>
              <li><strong>Intégration IA</strong> : OpenRouter API (DeepSeek pour chat, Gemini 2.0 pour analyse d'images)</li>
              <li><strong>Sentiment Tracking</strong> : système d'adaptation de personnalité basé sur historique de conversation</li>
            </ul>

            <h4 className="bot-section-heading">Flux d'Exécution d'une Commande</h4>
            <ol className="bot-compact-list">
              <li>Utilisateur appelle une commande slash (ex: <code>/bj bet 500</code>)</li>
              <li>Bot interroge <code>balances</code> pour vérifier le solde</li>
              <li>Logique du jeu s'exécute avec button collectors pour les actions du joueur</li>
              <li>Résultats mis à jour dans PostgreSQL</li>
              <li>Embed Discord personnalisé avec couleurs/emoji selon le résultat renvoyé</li>
            </ol>

            <div className="bot-dashboard-container">
              <img
                  src={getAssetPath('assets/images/railway-dashboard.png')}
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
                src={getAssetPath('assets/images/drawings/Goat.jpg')}
              width="800"
              height="450"
              loading="lazy"
              alt="Illustration rapide au crayon"
            />
            <p>Goat de Cult of the Lamb - Illustration rapide au crayon</p>
          </div>

          <div className="drawing-item">
            <img
              className="zoomable"
                src={getAssetPath('assets/images/drawings/EBray.jpg')}
              width="800"
              height="450"
              loading="lazy"
              alt="Illustration au crayon"
            />
            <p>Exo Stranger de Destiny 2 - Illustration au crayon</p>
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
            <img src={getAssetPath('assets/images/ScratchLogo.png')} width="800" height="450" loading="lazy" alt="Logo Scratch" />
        </div>

        <p>
          En CM2, j'ai été introduit au logiciel en ligne Scratch par mon professeur. Cela a
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

    <div id="lightbox-overlay" className="hidden">
      <span id="lightbox-close">&times;</span>
      <img id="lightbox-img" src="" alt="Aperçu agrandi" />
      <p id="lightbox-caption"></p>
    </div>
    </>
  );
};
export default ProjetsPersonnels;
