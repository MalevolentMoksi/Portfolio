import useDocumentMeta from '@/hooks/useDocumentMeta.js';
import { getAssetPath } from '@/utils/assetPath.js';

const ProjetsPersonnels = () => {
  useDocumentMeta('Projets Personnels | Portfolio', 'Mes projets personnels et illustrations');

  return (
    <>
    <section id="presentation" aria-labelledby="personal-projects-title">
      <h2 id="personal-projects-title">Presentation</h2>
      <p>
        Voici quelques projets personnels que j'ai realises, principalement pour m'amuser et
        apprendre de nouvelles competences. Ils refletent mon interet pour la programmation, le
        design et la creativite.
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
          <strong>Moksi's Bazaar</strong> est un bot Discord entierement developpe en JavaScript
          (discord.js), qui offre plusieurs services et jeux reunis sur une meme plateforme
          textuelle. A la fois un systeme de monnaie virtuelle et plusieurs mini-jeux de casino :
          blackjack, roulette, machine a sous, etc. Les utilisateurs dans un serveur Discord peuvent
          miser, gagner des credits et suivre leur classement en temps reel. Le bot est egalement
          capable de communication : relie a une IA externe, il peut repondre aux utilisateurs,
          avoir des conversations avec eux, et se souvenir des interactions, stockant meme des
          niveaux de relations selon si les utilisateurs ont ete aimables ou non, et etant en
          reaction plus aimable en retour (ou plus hostile).
        </p>
        <ul>
          <li><strong>Competences :</strong> API Discord, programmation evenementielle, gestion des permissions</li>
          <li><strong>Techniques :</strong> Python (discord.py), hebergement, gestion d'events, logs, SQL</li>
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

        <div className="video-gallery" role="region" aria-label="Demonstrations video du bot Discord">
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
            <p className="caption">Jeu de Machine a Sous</p>
          </div>
        </div>

        <details className="bot-fonctionnement">
          <summary>
            Fonctionnement du Bot
          </summary>

          <div style={{ marginTop: '1rem' }}>
            <p>
              Le bot est heberge sur <strong>Railway</strong> grace a une instance GitHub 24/7.
              Une base de donnees <strong>PostgreSQL</strong> (integree a Railway) stocke en temps reel :
            </p>
            <ul>
              <li>Les <em>identifiants</em> Discord de chaque utilisateur</li>
              <li>Les <em>soldes</em> (credits) et leur historique</li>
              <li>Les <em>statuts de participation</em> aux differents jeux (mise, gains/pertes)</li>
            </ul>
            <p>
              Des qu'un utilisateur envoie une commande (par exemple <code>!blackjack</code> ou
              <code>!roulette</code>), le bot interroge la table <code>users</code> pour verifier le
              <em>solde</em>, met a jour les donnees appropriees selon les resultats, puis renvoie un
              message Discord detaille (embed) affichant l'evolution du profil et du classement.
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
                Apercu du dashboard Railway : gestion des variables d'environnement &amp; metriques
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
            Depuis Janvier 2025, je me suis lance dans le dessin numerique et traditionnel. Voici
            quelques-unes de mes illustrations, realisees au crayon (2H a 6B) ou numeriquement.
          </p>
          <p>J'explore differents styles et techniques, mais cela reste avant tout un hobby pour moi.</p>
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
          <h2>Jeux realises sur Scratch</h2>
            <img src={getAssetPath('assets/images/ScratchLogo.png')} width="800" height="450" loading="lazy" alt="Logo Scratch" />
        </div>

        <p>
          En CM2, j'ai ete introduit au logiciel en ligne Scratch par mon professeur. Cela a
          consomme une bonne partie de mon temps personnel que j'ai passe a faire des jeux jusqu'en
          2020. <br />
          Le programme permet de programmer de maniere ludique, avec des blocs de code visuels. J'ai
          fabrique plusieurs jeux avec le programme, tous plutot rugueux mais certains sont encore
          jouables aujourd'hui.
        </p>
        <ul>
          <li>
            <strong>Competences :</strong> Logique algorithmique, design d'interfaces, animations,
            gestion de variables et de sprites
          </li>
          <li>
            <strong>Techniques :</strong> Utilisation avancee de Scratch, optimisation des scripts,
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
      <img id="lightbox-img" src="" alt="Apercu agrandi" />
      <p id="lightbox-caption"></p>
    </div>
    </>
  );
};
export default ProjetsPersonnels;
