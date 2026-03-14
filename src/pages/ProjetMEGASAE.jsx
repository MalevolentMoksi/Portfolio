import { useRef } from 'react';
import { useTranslation } from 'react-i18next';
import ProjectPagination from '@/components/ProjectPagination.jsx';
import useReadingTimeEstimate from '@/hooks/useReadingTimeEstimate.js';

const ProjetMEGASAE = () => {
  const { i18n } = useTranslation();
  const contentRef = useRef(null);
  useReadingTimeEstimate(contentRef);

  if (i18n.resolvedLanguage === 'en') {
    return (
      <>
        <article className="project-article" ref={contentRef}>
          <section id="overview">
            <h2>Context & Description</h2>
            <p>
              This expanded second-year project consisted of <strong>designing, developing, and documenting</strong>
              a JavaFX application enabling banquet organizers to manage events, menus, guests, seating plans, and
              scheduling. The app runs offline (thick-client architecture) and follows a complete MVC model.
              Work was delivered by a team of six (group 18) over one full semester, with institutional GitLab,
              milestones, and final oral defense.
            </p>
          </section>

          <hr />

          <section id="skills">
            <h2>Skills Mobilized</h2>

            <h3>Develop basic software applications</h3>
            <ul>
              <li>Implement straightforward designs</li>
              <li>Build and structure simple software solutions</li>
              <li>Run tests and evaluate outcomes</li>
              <li>Develop user interfaces</li>
            </ul>

            <h3>Understand and build algorithms</h3>
            <ul>
              <li>Analyze problems methodically</li>
              <li>Compare algorithmic approaches on classical problems</li>
              <li>Experiment with compilation and low-level representations</li>
              <li>Apply mathematical tools to implementation problems</li>
            </ul>

            <h3>Install and configure a workstation</h3>
            <ul>
              <li>Identify hardware/software components of a system</li>
              <li>Use core multitasking-system features</li>
              <li>Install an OS and development tools</li>
              <li>Configure a workstation in a company network context</li>
            </ul>

            <h3>Design and implement a database</h3>
            <ul>
              <li>Update and query relational databases</li>
              <li>Visualize and interpret data</li>
              <li>Design a schema from business requirements</li>
            </ul>

            <h3>Work in a professional environment</h3>
            <ul>
              <li>Understand the digital ecosystem</li>
              <li>Identify role expectations across IT sectors</li>
              <li>Understand roles in multidisciplinary teams</li>
              <li>Develop interpersonal teamwork skills</li>
            </ul>
          </section>

          <hr />

          <section id="objectives">
            <h2>Main Objectives</h2>
            <ul>
              <li>
                Produce a complete UML analysis/design package: use cases, class and sequence diagrams, UI mockups,
                and ensure consistency between models and code.
              </li>
              <li>
                Deliver a JavaFX application respecting MVC architecture and good practices (Observer pattern, DAO,
                JUnit tests).
              </li>
              <li>Manage project planning, risks, RACI/Gantt, and document decision rationale.</li>
              <li>Present a functional demo and an 8-minute final pitch.</li>
            </ul>
          </section>

          <hr />

          <section id="techniques">
            <h2>Technical Skills & Know-How</h2>
            <ul>
              <li><strong>Language/stack:</strong> Java 17, JavaFX 21, Maven, JUnit 5.</li>
              <li><strong>Modeling:</strong> UML with Visual Paradigm (use cases, classes, sequences, objects).</li>
              <li><strong>Persistence:</strong> Embedded SQLite with generic DAO and DDL/DML seed scripts.</li>
              <li><strong>Tooling:</strong> GitLab, Discord/Drive collaboration, Draw.io/Figma wireframing.</li>
              <li><strong>Quality:</strong> ~80% test coverage, SonarLint, Google Java Style conventions.</li>
              <li><strong>Project management:</strong> Gantt, RACI, and risk-mitigation planning.</li>
            </ul>
          </section>

          <hr />

          <section id="organization">
            <h2>Organization & Roles</h2>
            <p>Project team 18 - 6 members:</p>
            <ul>
              <li><strong>Project lead</strong>: Maceo Guicherd-Callin</li>
              <li><strong>UI leads</strong>: Noam Bruchet-Johanon &amp; Enzo Morello</li>
              <li><strong>Technical leads</strong>: Jérémie Fauvet-Messat &amp; Simon Krumb</li>
              <li><strong>Communication lead</strong>: Paolo Colombat</li>
            </ul>
            <p>
              Deliverables from March to June: framing file, UML model, UI prototype, functional iterations,
              and final demo on June 20.
            </p>
          </section>

          <hr />

          <section id="group-work">
            <h2>Team Process</h2>
            <ul>
              <li>Weekly Kanban flow via GitLab issues and cross code reviews.</li>
              <li>Daily 15-minute standups and Discord channels for recap/risk tracking.</li>
              <li>Branching model: stable <code>main</code>, <code>dev</code>, and feature branches.</li>
              <li>Iterative wireframes validated by the UI pair and integrated in JavaFX (<code>FXML</code>).</li>
            </ul>
          </section>

          <hr />

          <section id="individual-work">
            <h2>Individual Contributions</h2>
            <ul>
              <li>
                <strong>Enzo</strong>: JavaFX views (menus, drag-and-drop seating plan) and dark-theme CSS integration.
              </li>
              <li><strong>Jérémie &amp; Simon</strong>: DAO layer and business logic (allergy management, PDF invites).</li>
              <li><strong>Noam</strong>: UX mockups, accessibility guidelines, user tests.</li>
              <li><strong>Paolo</strong>: risk tracking, Markdown/LaTeX documentation, final pitch.</li>
              <li><strong>Maceo</strong>: planning, milestone sync, technical arbitration.</li>
            </ul>
          </section>

          <hr />

          <section id="conclusion">
            <h2>Outcome & Retrospective</h2>
            <p>
              Version 1.0 was delivered with banquet creation/import, guest management, dynamic menus adapted to
              dietary constraints, PDF invitation generation, and full JSON export. The project reached 92% of user
              stories, 81% test coverage, and was successfully presented at the final defense (18/20). Main
              challenges were module synchronization and schedule pressure; a weekly risk review notably reduced
              potential delays.
            </p>
          </section>
        </article>

        <ProjectPagination currentPath="/projet-MEGASAE" />
      </>
    );
  }

  return (
    <>
      <article className="project-article" ref={contentRef}>
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
            La version 1.0 est livrée : creation / import de banquets, gestion des invites, menus
            dynamiques adaptes aux restrictions alimentaires, generation PDF d'invitations et export
            complet JSON. Le projet a atteint 92 % des user stories, une couverture de tests de 81 % et a
            été presentée lors de la soutenance finale avec succes (note 18/20). Les principaux defis ont
            porte sur la synchronisation des modules et le respect du temps imparti ; la mise en place
            d'une revue de risques hebdomadaire a permis de reduire drastiquement les retards potentiels.
          </p>
        </section>
      </article>

      <ProjectPagination currentPath="/projet-MEGASAE" />
    </>
  );
};

export default ProjetMEGASAE;
