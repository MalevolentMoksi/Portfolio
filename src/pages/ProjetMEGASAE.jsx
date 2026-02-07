import ProjectPagination from '@/components/ProjectPagination.jsx';

const ProjetMEGASAE = () => (
  <>
    <section id="overview">
      <h2>Contexte & description</h2>
      <p>
        Le projet élargi de 2e année a consisté à <strong>concevoir, développer et documenter</strong>{' '}
        une application Java FX permettant à tout organisateur de banquets de gérer événements, menus,
        invités, plan de table et planning. L'application fonctionne hors-ligne (architecture
        lourde) et s'appuie sur un modèle MVC complet. Travail réalisé en équipe de six (groupe 18)
        sur un semestre complet, avec dépôt GitLab institutionnel, jalons et soutenance finale.
      </p>
    </section>

    <hr />

    <section id="skills">
      <h2>Compétences mobilisées</h2>

      <h3>Développer des applications informatiques <em>simples</em></h3>
      <ul>
        <li>Implémenter des conceptions simples</li>
        <li>Élaborer des conceptions simples</li>
        <li>Faire des essais et évaluer leurs résultats</li>
        <li>Développer des interfaces utilisateurs</li>
      </ul>

      <h3>Appréhender & construire des algorithmes</h3>
      <ul>
        <li>Analyser un problème avec méthode</li>
        <li>Comparer des algorithmes pour des problèmes classiques</li>
        <li>Expérimenter compilation & représentations bas niveau</li>
        <li>Formaliser / mettre en œuvre des outils mathématiques</li>
      </ul>

      <h3>Installer & configurer un poste de travail</h3>
      <ul>
        <li>Identifier composants matériels / logiciels d'un système</li>
        <li>Utiliser les fonctionnalités d'un système multitâches</li>
        <li>Installer un OS et des outils de développement</li>
        <li>Configurer un poste dans un réseau d'entreprise</li>
      </ul>

      <h3>Concevoir & mettre en place une base de données</h3>
      <ul>
        <li>Mettre à jour & interroger une BD relationnelle</li>
        <li>Visualiser des données</li>
        <li>Concevoir une BD à partir d'un cahier des charges</li>
      </ul>

      <h3>S'insérer dans son environnement professionnel</h3>
      <ul>
        <li>Appréhender l'écosystème numérique</li>
        <li>Découvrir les aptitudes requises selon les secteurs</li>
        <li>Identifier statuts, fonctions, rôles d'une équipe pluridisciplinaire</li>
        <li>Acquérir les compétences interpersonnelles pour travailler en équipe</li>
      </ul>
    </section>

    <hr />

    <section id="objectives">
      <h2>Objectifs principaux</h2>
      <ul>
        <li>
          Produire un dossier d'analyse / conception UML complet : cas d'utilisation, classes,
          séquences, maquettes IHM ; assurer la cohérence code &lt;-&gt; modèles.
        </li>
        <li>
          Delivrer une application Java FX respectant l'architecture MVC et les bonnes pratiques
          (pattern Observer, DAO, tests JUnit).
        </li>
        <li>Gérer le projet (planning, risques, RACI, Gantt) et documenter les décisions.</li>
        <li>Présenter une démo fonctionnelle et un pitch de 8 minutes lors de la soutenance finale.</li>
      </ul>
    </section>

    <hr />

    <section id="techniques">
      <h2>Compétences techniques & savoir-faire</h2>
      <ul>
        <li><strong>Langage / techno :</strong> Java 17, Java FX 21, Maven, JUnit 5.</li>
        <li>
          <strong>Modélisation :</strong> UML (Visual Paradigm), diagrammes Cas d'utilisation,
          Classes, Séquences, Objets.
        </li>
        <li><strong>Persistance :</strong> SQLite embarquée (DAO générique), scripts DDL/DML de peuplement.</li>
        <li>
          <strong>Outils :</strong> GitLab (CI/CD, merge requests), Discord & Drive (communication),
          Draw.io / Figma pour les wireframes.
        </li>
        <li><strong>Tests & qualité :</strong> couverture 80 %, SonarLint, convention Google Java Style.</li>
        <li>
          <strong>Gestion projet :</strong> diagramme Gantt, matrice RACI, analyse de risques & mitigations
          (acceptation, protection, réduction).
        </li>
      </ul>
    </section>

    <hr />

    <section id="organization">
      <h2>Organisation & rôles</h2>
      <p>Équipe projet 18 - 6 personnes :</p>
      <ul>
        <li><strong>Chef de projet</strong> : Maceo Guicherd-Callin</li>
        <li><strong>Resp. IHM</strong> : Noam Bruchet-Johanon &amp; Enzo Morello</li>
        <li><strong>Resp. Technique</strong> : Jérémie Fauvet-Messat &amp; Simon Krumb</li>
        <li><strong>Resp. Communication</strong> : Paolo Colombat</li>
      </ul>
      <p>
        Livrables étalés de mars -&gt; juin : dossier de cadrage, modèle UML, prototype IHM, itérations
        fonctionnelles, démo finale 20 juin.
      </p>
    </section>

    <hr />

    <section id="group-work">
      <h2>Travail en groupe</h2>
      <ul>
        <li>Méthode <em>Kanban</em> hebdomadaire (GitLab issues) ; revues de code croisées.</li>
        <li>Réunions quotidiennes 15 min (stand-up) ; com. Discord (#recap, #risques).</li>
        <li>Branching : <code>main</code> stable / <code>dev</code> -&gt; feature-branches.</li>
        <li>Wireframes itératifs validés par le binôme IHM, intégrés dans Java FX (<code>FXML</code>).</li>
      </ul>
    </section>

    <hr />

    <section id="individual-work">
      <h2>Contributions individuelles</h2>
      <ul>
        <li>
          <strong>Enzo</strong> : conception & réalisation des vues Java FX (menus, drag-n-drop plan de
          table), intégration CSS thème sombre.
        </li>
        <li>
          <strong>Jérémie &amp; Simon</strong> : couche DAO, logique métier (gestion allergies, invitations PDF).
        </li>
        <li><strong>Noam</strong> : maquettes UX, guidelines d'accessibilité, tests utilisateurs.</li>
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
    
    <ProjectPagination currentPath="/projet-MEGASAE" />
  </>
);

export default ProjetMEGASAE;
