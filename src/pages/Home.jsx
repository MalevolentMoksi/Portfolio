import useDocumentMeta from '@/hooks/useDocumentMeta.js';
import ContactForm from '@/components/ContactForm.jsx';

const Home = () => {
  useDocumentMeta('Accueil | Portfolio', 'Enzo Morello - Étudiant en BUT Informatique à l\'IUT2 de Grenoble');
  
  return (
    <>
      <section id="presentation" aria-labelledby="presentation-title">
        <h2 id="presentation-title">Présentation</h2>
        <div className="presentation-grid">
          <article className="presentation-block" id="about" aria-labelledby="about-title">
            <h3 id="about-title">À propos de moi</h3>
            <p>
              Étudiant en 2ème année de BUT Informatique à l'IUT2 de Grenoble spécialisé dans
              le développement d'applications. Passionné par l'alliance entre la logique
              technique et l'ergonomie visuelle, j'espère pouvoir mettre ma curiosité et ma
              méthode au service de projets innovants.
            </p>
          </article>

          <article className="presentation-block" id="skills" aria-labelledby="skills-title">
            <h3 id="skills-title">Compétences</h3>
            <ul>
              <li>Réaliser, Concevoir, Optimiser et Administrer en :</li>
              <li>Java, JavaScript, Python, SQL</li>
              <li>HTML/CSS, JavaFX</li>
              <li>Git, Maven, Linux</li>
            </ul>
          </article>

          <article className="presentation-block" id="achievements" aria-labelledby="achievements-title">
            <h3 id="achievements-title">Mon parcours</h3>
            <p>
              <strong>Baccalauréat Général - Mention Bien</strong>
              <br />
              Lycée Les Iscles, Manosque | Juin 2024
              <br />
              <em>Spécialités : Mathématiques et Sciences de l'Ingénieur.</em>
            </p>
          </article>

          <article className="presentation-block" id="hobbies" aria-labelledby="hobbies-title">
            <h3 id="hobbies-title">Centres d'intérêt</h3>
            <ul>
              <li>Art traditionnel et digital</li>
              <li>Jeux-Vidéo</li>
              <li>Découverte de musique</li>
              <li>Cinematographie</li>
            </ul>
          </article>
        </div>
      </section>

      <section id="contact" aria-labelledby="contact-title">
        <h2 id="contact-title">Contact</h2>
        <div className="contact-info">
          <ul>
            <li>
              Email :
              <a href="#" className="email-glitch" aria-label="Adresse email masquée pour éviter le spam">
                <span className="local-part" data-text="##########"></span>@etu.univ-grenoble-alpes.fr
              </a>
            </li>
            <li>
              Profil Gitlab : {' '}
              <a
                href="https://gricad-gitlab.univ-grenoble-alpes.fr/morelloe"
                target="_blank"
                rel="noopener noreferrer"
                aria-label="Profil GitLab (ouvre dans une nouvelle fenetre)"
              >
                gricad-gitlab.univ-grenoble-alpes.fr/morelloe
              </a>
            </li>
          </ul>
        </div>
        <ContactForm />
      </section>
    </>
  );
};

export default Home;
