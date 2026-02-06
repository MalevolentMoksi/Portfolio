const ProjetMEGASAE = () => (
  <>
    <section id="overview">
      <h2>Contexte & description</h2>
      <p>
        Le projet enlargi de 2e annee a consiste a <strong>concevoir, developper et documenter</strong>{' '}
        une application Java FX permettant a tout organisateur de banquets de gerer evenements, menus,
        invites, plan de table et planning. L'application fonctionne hors-ligne (architecture
        lourde) et s'appuie sur un modele MVC complet. Travail realise en equipe de six (groupe 18)
        sur un semestre complet, avec depot GitLab institutionnel, jalons et soutenance finale.
      </p>
    </section>

    <hr />

    <section id="skills">
      <h2>Competences mobilisees</h2>

      <h3>Developper des applications informatiques <em>simples</em></h3>
      <ul>
        <li>Implementer des conceptions simples</li>
        <li>Elaborer des conceptions simples</li>
        <li>Faire des essais et evaluer leurs resultats</li>
        <li>Developper des interfaces utilisateurs</li>
      </ul>

      <h3>Apprehender & construire des algorithmes</h3>
      <ul>
        <li>Analyser un probleme avec methode</li>
        <li>Comparer des algorithmes pour des problemes classiques</li>
        <li>Experimenter compilation & representations bas niveau</li>
        <li>Formaliser / mettre en oeuvre des outils mathematiques</li>
      </ul>

      <h3>Installer & configurer un poste de travail</h3>
      <ul>
        <li>Identifier composants materiels / logiciels d'un systeme</li>
        <li>Utiliser les fonctionnalites d'un systeme multitaches</li>
        <li>Installer un OS et des outils de developpement</li>
        <li>Configurer un poste dans un reseau d'entreprise</li>
      </ul>

      <h3>Concevoir & mettre en place une base de donnees</h3>
      <ul>
        <li>Mettre a jour & interroger une BD relationnelle</li>
        <li>Visualiser des donnees</li>
        <li>Concevoir une BD a partir d'un cahier des charges</li>
      </ul>

      <h3>S'inserer dans son environnement professionnel</h3>
      <ul>
        <li>Apprehender l'ecosysteme numerique</li>
        <li>Decouvrir les aptitudes requises selon les secteurs</li>
        <li>Identifier statuts, fonctions, roles d'une equipe pluridisciplinaire</li>
        <li>Acquerir les competences interpersonnelles pour travailler en equipe</li>
      </ul>
    </section>

    <hr />

    <section id="objectives">
      <h2>Objectifs principaux</h2>
      <ul>
        <li>
          Produire un dossier d'analyse / conception UML complet : cas d'utilisation, classes,
          sequences, maquettes IHM ; assurer la coherence code &lt;-&gt; modeles.
        </li>
        <li>
          Delivrer une application Java FX respectant l'architecture MVC et les bonnes pratiques
          (pattern Observer, DAO, tests JUnit).
        </li>
        <li>Gerer le projet (planning, risques, RACI, Gantt) et documenter les decisions.</li>
        <li>Presenter une demo fonctionnelle et un pitch de 8 minutes lors de la soutenance finale.</li>
      </ul>
    </section>

    <hr />

    <section id="techniques">
      <h2>Competences techniques & savoir-faire</h2>
      <ul>
        <li><strong>Langage / techno :</strong> Java 17, Java FX 21, Maven, JUnit 5.</li>
        <li>
          <strong>Modelisation :</strong> UML (Visual Paradigm), diagrammes Cas d'utilisation,
          Classes, Sequences, Objets.
        </li>
        <li><strong>Persistance :</strong> SQLite embarquee (DAO generique), scripts DDL/DML de peuplement.</li>
        <li>
          <strong>Outils :</strong> GitLab (CI/CD, merge requests), Discord & Drive (communication),
          Draw.io / Figma pour les wireframes.
        </li>
        <li><strong>Tests & qualite :</strong> couverture 80 %, SonarLint, convention Google Java Style.</li>
        <li>
          <strong>Gestion projet :</strong> diagramme Gantt, matrice RACI, analyse de risques & mitigations
          (acceptation, protection, reduction).
        </li>
      </ul>
    </section>

    <hr />

    <section id="organization">
      <h2>Organisation & roles</h2>
      <p>Equipe projet 18 - 6 personnes :</p>
      <ul>
        <li><strong>Chef de projet</strong> : Maceo Guicherd-Callin</li>
        <li><strong>Resp. IHM</strong> : Noam Bruchet-Johanon &amp; Enzo Morello</li>
        <li><strong>Resp. Technique</strong> : Jeremie Fauvet-Messat &amp; Simon Krumb</li>
        <li><strong>Resp. Communication</strong> : Paolo Colombat</li>
      </ul>
      <p>
        Livrables etales de mars -&gt; juin : dossier de cadrage, modele UML, prototype IHM, iterations
        fonctionnelles, demo finale 20 juin.
      </p>
    </section>

    <hr />

    <section id="group-work">
      <h2>Travail en groupe</h2>
      <ul>
        <li>Methode <em>Kanban</em> hebdomadaire (GitLab issues) ; revues de code croisees.</li>
        <li>Reunions quotidiennes 15 min (stand-up) ; com. Discord (#recap, #risques).</li>
        <li>Branching : <code>main</code> stable / <code>dev</code> -&gt; feature-branches.</li>
        <li>Wireframes iteratifs valides par le binome IHM, integres dans Java FX (<code>FXML</code>).</li>
      </ul>
    </section>

    <hr />

    <section id="individual-work">
      <h2>Contributions individuelles</h2>
      <ul>
        <li>
          <strong>Enzo</strong> : conception & realisation des vues Java FX (menus, drag-n-drop plan de
          table), integration CSS theme sombre.
        </li>
        <li>
          <strong>Jeremie &amp; Simon</strong> : couche DAO, logique metier (gestion allergies, invitations PDF).
        </li>
        <li><strong>Noam</strong> : maquettes UX, guidelines d'accessibilite, tests utilisateurs.</li>
        <li><strong>Paolo</strong> : suivi risques, documentation Markdown / LaTeX, pitch final.</li>
        <li><strong>Maceo</strong> : planification, Gantt, synchronisation jalons, arbitrage technique.</li>
      </ul>
    </section>

    <hr />

    <section id="conclusion">
      <h2>Resultat & bilan</h2>
      <p>
        La version 1.0 est livree : creation / import de banquets, gestion des invites, menus
        dynamiques adaptes aux restrictions alimentaires, generation PDF d'invitations et export
        complet JSON. Le projet a atteint 92 % des user stories, une couverture de tests de 81 % et a
        ete presente lors de la soutenance finale avec succes (note 18/20). Les principaux defis ont
        porte sur la synchronisation des modules et le respect du temps imparti ; la mise en place
        d'une revue de risques hebdomadaire a permis de reduire drastiquement les retards potentiels.
      </p>
    </section>
  </>
);

export default ProjetMEGASAE;
