import useDocumentMeta from '@/hooks/useDocumentMeta.js';
import ContactForm from '@/components/ContactForm.jsx';

const Home = () => {
  useDocumentMeta('Accueil | Portfolio', 'Enzo Morello - Étudiant en BUT Informatique à l\'IUT2 de Grenoble');
  
  return (
    <>
      <section id="presentation" aria-labelledby="presentation-title">
        <h2 id="presentation-title">Presentation</h2>
        <div className="presentation-grid">
          <article className="presentation-block" id="about" aria-labelledby="about-title">
            <h3 id="about-title">A propos de moi</h3>
            <p>
              Etudiant en 2eme annee de BUT Informatique a l'IUT2 de Grenoble specialise dans
              le developpement d'applications. Passionne par l'alliance entre la logique
              technique et l'ergonomie visuelle, j'espere pouvoir mettre ma curiosite et ma
              methode au service de projets innovants.
            </p>
          </article>

          <article className="presentation-block" id="skills" aria-labelledby="skills-title">
            <h3 id="skills-title">Competences</h3>
            <ul>
              <li>Realiser, Concevoir, Optimiser et Administrer en :</li>
              <li>Java, JavaScript, Python, SQL</li>
              <li>HTML/CSS, JavaFX</li>
              <li>Git, Maven, Linux</li>
            </ul>
          </article>

          <article className="presentation-block" id="achievements" aria-labelledby="achievements-title">
            <h3 id="achievements-title">Mon parcours</h3>
            <p>
              <strong>Baccalaureat General - Mention Bien</strong>
              <br />
              Lycee Les Iscles, Manosque | Juin 2024
              <br />
              <em>Specialites : Mathematiques et Sciences de l'Ingenieur.</em>
            </p>
          </article>

          <article className="presentation-block" id="hobbies" aria-labelledby="hobbies-title">
            <h3 id="hobbies-title">Centres d'interet</h3>
            <ul>
              <li>Art traditionnel et digital</li>
              <li>Jeux-Video</li>
              <li>Decouverte de musique</li>
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
              <a href="#" className="email-glitch" aria-label="Adresse email masquee pour eviter le spam">
                <span className="local-part" data-text="##########"></span>@etu.univ-grenoble-alpes.fr
              </a>
            </li>
            <li>
              Profil Gitlab :
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
