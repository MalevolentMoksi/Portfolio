import { Link } from 'react-router-dom';
import useDocumentMeta from '@/hooks/useDocumentMeta.js';
import { getAssetPath } from '@/utils/assetPath.js';

const Projets = () => {
  useDocumentMeta('Projets | Portfolio', 'Mes projets scolaires et professionnels');
  
  return (
  <section id="project-list">
    <h2>
      <em>Mes Projets</em>
    </h2>

    <article className="project">
      <h3>Projet enlargi</h3>
      <h2>Application d'organisation de banquets</h2>
      <p>Projet plus avance en groupe de 6.</p>
      <img
        src={getAssetPath('assets/images/banquets-MEGASAE.webp')}
        alt="Interface de l'application de gestion de banquets"
        loading="lazy"
        width="800"
        height="450"
      />
      <p>
        <strong>En hexanome (6 personnes) :</strong> Developpement a partir de zero d'une
        application qui pourrait planifier des evenements dans des salles pour un utilisateur.
      </p>

      <div className="project-tech">
        <img
          src="https://cdn.jsdelivr.net/npm/simple-icons@v11/icons/openjdk.svg"
          alt="Java"
          title="OpenJDK (Java)"
          width="30"
          height="30"
        />
        <img
          src={getAssetPath('assets/images/JavaFX.svg')}
          loading="lazy"
          alt="JavaFX"
          title="JavaFX"
          width="30"
          height="30"
        />
        <img
          src="https://cdn.jsdelivr.net/npm/simple-icons@v11/icons/apachemaven.svg"
          alt="Maven"
          title="Apache Maven"
          width="30"
          height="30"
        />
        <img
          src="https://cdn.jsdelivr.net/npm/simple-icons@v11/icons/junit5.svg"
          alt="JUnit 5"
          title="JUnit 5"
          width="30"
          height="30"
        />
        <img
          src="https://cdn.jsdelivr.net/npm/simple-icons@v11/icons/sqlite.svg"
          alt="SQLite"
          title="SQLite"
          width="30"
          height="30"
        />
        <img
          src="https://cdn.jsdelivr.net/npm/simple-icons@v11/icons/gitlab.svg"
          alt="GitLab"
          title="GitLab"
          width="30"
          height="30"
        />
        <img
          src="https://cdn.jsdelivr.net/npm/simple-icons@v11/icons/figma.svg"
          alt="Figma"
          title="Figma"
          width="30"
          height="30"
        />
      </div>

      <Link to="/projet-MEGASAE" className="btn">En savoir plus</Link>
    </article>

    <hr />

    <article className="project">
      <h2>Recueil de besoins | Decouverte de l'environnement economique et ecologique</h2>
      <img
        src={getAssetPath('assets/images/6508-sopra-lille-bata-ext-102.jpg')}
        alt="Batiment Sopra Steria"
        loading="lazy"
        width="800"
        height="450"
      />
      <p>
        <strong>En trinome :</strong> La recolte d'informations sur l'entreprise ESN Sopra
        Steria afin d'en faire un site a type informatif pour un public defini.
      </p>

      <div className="project-tech">
        <img
          src="https://cdn.jsdelivr.net/npm/simple-icons@v11/icons/html5.svg"
          alt="HTML5"
          title="HTML5"
          width="30"
          height="30"
        />
        <img
          src="https://cdn.jsdelivr.net/npm/simple-icons@v11/icons/css3.svg"
          alt="CSS3"
          title="CSS3"
          width="30"
          height="30"
        />
        <img
          src="https://cdn.jsdelivr.net/npm/simple-icons@v11/icons/javascript.svg"
          alt="JavaScript"
          title="JavaScript"
          width="30"
          height="30"
        />
        <img
          src="https://cdn.jsdelivr.net/npm/simple-icons@v11/icons/figma.svg"
          alt="Figma"
          title="Figma"
          width="30"
          height="30"
        />
        <img
          src="https://cdn.jsdelivr.net/npm/simple-icons@v11/icons/gitlab.svg"
          alt="GitLab"
          title="GitLab"
          width="30"
          height="30"
        />
      </div>

      <Link to="/projet-SAE56" className="btn">En savoir plus</Link>
    </article>

    <hr />

    <article className="project">
      <h2>Installation d'un poste pour le developpement</h2>
      <img
        src={getAssetPath('assets/images/PosteTravailLinux.png')}
        alt="Configuration d'un poste de travail Linux Debian"
        loading="lazy"
        width="800"
        height="450"
      />
      <p>
        <strong>En monome :</strong> Installation et schematisation d'un poste Linux Debian.
      </p>

      <div className="project-tech">
        <img
          src="https://cdn.jsdelivr.net/npm/simple-icons@v11/icons/linux.svg"
          alt="Linux"
          title="Linux (Debian/Ubuntu)"
          width="30"
          height="30"
        />
        <img
          src="https://cdn.jsdelivr.net/npm/simple-icons@v11/icons/virtualbox.svg"
          alt="VirtualBox"
          title="VirtualBox"
          width="30"
          height="30"
        />
        <img
          src="https://cdn.jsdelivr.net/npm/simple-icons@v11/icons/visualstudiocode.svg"
          alt="VS Code"
          title="Visual Studio Code"
          width="30"
          height="30"
        />
        <img
          src="https://cdn.jsdelivr.net/npm/simple-icons@v11/icons/intellijidea.svg"
          alt="IntelliJ IDEA"
          title="IntelliJ IDEA"
          width="30"
          height="30"
        />
        <img
          src="https://cdn.jsdelivr.net/npm/simple-icons@v11/icons/gnubash.svg"
          alt="Bash"
          title="Bash"
          width="30"
          height="30"
        />
        <img
          src="https://cdn.jsdelivr.net/npm/simple-icons@v11/icons/gitlab.svg"
          alt="GitLab"
          title="GitLab"
          width="30"
          height="30"
        />
      </div>

      <Link to="/projet-SAE3" className="btn">En savoir plus</Link>
    </article>

    <hr />

    <article className="project">
      <h2>Implementation d'un besoin client | Comparaison d'approches algorithmiques</h2>
      <img
        src={getAssetPath('assets/images/algorithm.jpg')}
        alt="Illustration algorithmes"
        loading="lazy"
        width="800"
        height="450"
      />
      <p>
        <strong>En binome :</strong> Codage, etude et comparaison d'efficacite entre divers
        algorithmes de comparaisons en Java.
      </p>

      <div className="project-tech">
        <img
          src="https://cdn.jsdelivr.net/npm/simple-icons@v11/icons/openjdk.svg"
          alt="Java"
          title="OpenJDK (Java)"
          width="30"
          height="30"
        />
        <img
          src="https://cdn.jsdelivr.net/npm/simple-icons@v11/icons/intellijidea.svg"
          alt="IntelliJ IDEA"
          title="IntelliJ IDEA"
          width="30"
          height="30"
        />
      </div>

      <Link to="/projet-SAE12" className="btn">En savoir plus</Link>
    </article>
  </section>
  );
};

export default Projets;
