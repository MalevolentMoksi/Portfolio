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
          style={{ maxWidth: '280px', marginBottom: '1.5rem' }}
        />

        <p>
          <strong>Moksi's Bazaar</strong> est un bot Discord entièrement développé en JavaScript
          (discord.js), qui offre plusieurs services et jeux réunis sur une même plateforme
          textuelle. À la fois un système de monnaie virtuelle et plusieurs mini-jeux de casino :
          blackjack, roulette, machine à sous, etc. Les utilisateurs dans un serveur Discord peuvent
          miser, gagner des crédits et suivre leur classement en temps réel. Le bot est également
          capable de communication : relié à une IA externe, il peut répondre aux utilisateurs,
          avoir des conversations avec eux, et se souvenir des interactions, stockant même des
          niveaux de relations selon si les utilisateurs ont été aimables ou non, et étant en
          réaction plus aimable en retour (ou plus hostile).
        </p>
        <ul>
          <li><strong>Compétences :</strong> API Discord, programmation événementielle, gestion des permissions</li>
          <li><strong>Techniques :</strong> Python (discord.py), hébergement, gestion d'events, logs, SQL</li>
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
            Fonctionnement du Bot
          </summary>

          <div style={{ marginTop: '1rem' }}>
            <p>
              Le bot est hébergé sur <strong>Railway</strong> grâce à une instance GitHub 24/7.
              Une base de données <strong>PostgreSQL</strong> (intégrée à Railway) stocke en temps réel :
            </p>
            <ul>
              <li>Les <em>identifiants</em> Discord de chaque utilisateur</li>
              <li>Les <em>soldes</em> (crédits) et leur historique</li>
              <li>Les <em>statuts de participation</em> aux différents jeux (mise, gains/pertes)</li>
            </ul>
            <p>
              Des qu'un utilisateur envoie une commande (par exemple <code>!blackjack</code> ou
              <code>!roulette</code>), le bot interroge la table <code>users</code> pour vérifier le
              <em>solde</em>, met à jour les données appropriées selon les résultats, puis renvoie un
              message Discord détaillé (embed) affichant l'évolution du profil et du classement.
            </p>

            <div style={{ textAlign: 'center', marginTop: '1rem' }}>
              <img
                  src={getAssetPath('assets/images/railway-dashboard.png')}
                loading="lazy"
                alt="Tableau de bord Railway pour le bot Discord"
                style={{
                  maxWidth: '100%',
                  border: '1px solid var(--primary-color)',
                  borderRadius: '4px',
                }}
              />
              <figcaption
                style={{
                  fontSize: '0.85rem',
                  color: 'var(--text-color)',
                  marginTop: '0.25rem',
                }}
              >
                Aperçu du dashboard Railway : gestion des variables d'environnement &amp; métriques
                PostgreSQL
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

        <div className="video-gallery" style={{ marginTop: '1.5rem' }}>
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
