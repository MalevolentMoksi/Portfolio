const Home = () => (
  <>
    <section id="presentation">
      <h2>Presentation</h2>
      <div className="presentation-grid">
        <div className="presentation-block" id="about">
          <h3>A propos de moi</h3>
          <p>
            Etudiant en 2eme annee de BUT Informatique a l'IUT2 de Grenoble specialise dans
            le developpement d'applications. Passionne par l'alliance entre la logique
            technique et l'ergonomie visuelle, j'espere pouvoir mettre ma curiosite et ma
            methode au service de projets innovants.
          </p>
        </div>

        <div className="presentation-block" id="skills">
          <h3>Competences</h3>
          <ul>
            <li>Realiser, Concevoir, Optimiser et Administrer en :</li>
            <li>Java, JavaScript, Python, SQL</li>
            <li>HTML/CSS, JavaFX</li>
            <li>Git, Maven, Linux</li>
          </ul>
        </div>

        <div className="presentation-block" id="achievements">
          <h3>Mon parcours</h3>
          <p>
            <strong>Baccalaureat General - Mention Bien</strong>
            <br />
            Lycee Les Iscles, Manosque | Juin 2024
            <br />
            <em>Specialites : Mathematiques et Sciences de l'Ingenieur.</em>
          </p>
        </div>

        <div className="presentation-block" id="hobbies">
          <h3>Centres d'interet</h3>
          <ul>
            <li>Art traditionnel et digital</li>
            <li>Jeux-Video</li>
            <li>Decouverte de musique</li>
            <li>Cinematographie</li>
          </ul>
        </div>
      </div>
    </section>

    <section id="contact">
      <h2>Contact</h2>
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
          >
            gricad-gitlab.univ-grenoble-alpes.fr/morelloe
          </a>
        </li>
      </ul>
    </section>
  </>
);

export default Home;
