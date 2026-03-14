import { useRef } from 'react';
import { useTranslation } from 'react-i18next';
import ProjectPagination from '@/components/ProjectPagination.jsx';
import useReadingTimeEstimate from '@/hooks/useReadingTimeEstimate.js';

const ProjetSAE4 = () => {
  const { i18n } = useTranslation();
  const contentRef = useRef(null);
  useReadingTimeEstimate(contentRef);

  if (i18n.resolvedLanguage === 'en') {
    return (
      <>
        <article className="project-article" ref={contentRef}>
          <section id="project-detail">
            <h2>Description</h2>
            <p>
              Completed during semester 1 of the Computer Science BUT, this pair project aimed to design and
              implement a complete database for the SuperBall bowling club. Starting from requirements and an
              Entity-Association model, we:
            </p>
            <ul>
              <li>derived the relational schema using course translation rules;</li>
              <li>
                wrote <code>create.sql</code> to build tables, primary/foreign keys, <code>CHECK</code>,
                <code>NOT NULL</code>, and uniqueness constraints;
              </li>
              <li>
                wrote <code>test.sql</code> to populate the database and validate integrity with invalid inserts;
              </li>
              <li>
                created SQL queries for six business needs (lane planning, shoe stock, availability, etc.);
              </li>
              <li>
                evolved the schema in stage 3: lane replacement workflow, max-game extension, and critical review.
              </li>
            </ul>
            <p>
              Result: a robust PostgreSQL database, fully documented (PDF), delivered with create/drop scripts and
              a test dataset.
            </p>
          </section>

          <hr />

          <section id="skills">
            <h2>Skills Mobilized</h2>
            <ul>
              <li>Update and query relational databases (direct SQL or through applications)</li>
              <li>Visualize data</li>
              <li>Design relational schemas from requirements</li>
            </ul>
          </section>

          <hr />

          <section id="objectives">
            <h2>Learning Objectives</h2>
            <ul>
              <li>Apply the full DB design workflow (EA -&gt; relational model -&gt; SQL)</li>
              <li>Master integrity constraints at the DBMS level</li>
              <li>Populate and query a database for concrete business needs</li>
              <li>Learn to evolve an existing schema without breaking data</li>
            </ul>
          </section>

          <hr />

          <section id="techniques">
            <h2>Technical Skills & Know-How</h2>
            <ul>
              <li>EA / Merise modeling with DB-Diagram.io, exported to PDF</li>
              <li>PostgreSQL 15, <code>psql</code>, pgAdmin 4, DBeaver</li>
              <li>Constraints: <strong>CHECK</strong>, composite keys, FK, indexes</li>
              <li>Advanced SQL: window functions, <code>INTERVAL</code>, materialized views</li>
              <li>GitLab versioning and packaged deliverables in <code>.zip</code></li>
              <li>Critical report in LaTeX (<code>bilan.pdf</code>)</li>
            </ul>
          </section>

          <hr />

          <section id="group-work">
            <h2>Pair Organization</h2>
            <p>
              Task split: my teammate focused on <code>create.sql</code> and <code>drop.sql</code>, while I focused
              on the relational model, business queries, and project review. We performed weekly code reviews on GitLab.
            </p>
          </section>

          <hr />

          <section id="individual-work">
            <h2>Personal Contributions</h2>
            <ul>
              <li>Relational schema design (diagram + justification)</li>
              <li>Query authoring and optimization from B1.1 to B2 (&lt;= 5 ms)</li>
              <li>Automated testing and SQL script validation with PostgreSQL</li>
              <li>5-minute oral presentation (Canva slides)</li>
            </ul>
          </section>
        </article>

        <ProjectPagination currentPath="/projet-SAE4" />
      </>
    );
  }

  return (
    <>
      <article className="project-article" ref={contentRef}>
        <section id="project-detail">
          <h2>Description</h2>
          <p>
            Réalisée au semestre 1 du BUT Informatique, le projet avait pour but de concevoir et de
            mettre en place, en binôme, une base de données complète pour le club de bowling SuperBall.
            À partir d'un cahier des charges et d'un schéma Entités-Associations (SEA) fournis, nous
            avons :
          </p>
          <ul>
            <li>Dérivé le schéma relationnel (SLR) en appliquant les règles de traduction vues en cours ;</li>
            <li>
              Écrit un script <code>create.sql</code> créant les tables, clés primaires / étrangères,
              <code>CHECK</code>, <code>NOT NULL</code>, contraintes d'unicité ;
            </li>
            <li>
              Rédigé un script <code>test.sql</code> peuplant la base puis vérifiant l'intégrité via des
              insertions invalides ;
            </li>
            <li>
              Développé des requêtes SQL répondant à six besoins métier (planning des pistes, stock de
              chaussures, disponibilité, etc.) ;
            </li>
            <li>
              Fait évoluer la base lors de l'étape 3 : gestion du remplacement d'une piste, extension du
              nombre maximum de parties et bilan critique du projet.
            </li>
          </ul>
          <p>
            Resultat : une base PostgreSQL robuste, documentee (PDF) et livree avec scripts de creation,
            suppression et jeu d'essai.
          </p>
        </section>

        <hr />

        <section id="skills">
          <h2>Compétences mobilisées</h2>
          <ul>
            <li>Mettre à jour et interroger une base de données relationnelle (en requêtes directes ou via une application)</li>
            <li>Visualiser des données</li>
            <li>Concevoir une base de données relationnelle à partir d'un cahier des charges</li>
          </ul>
        </section>

        <hr />

        <section id="objectives">
          <h2>Objectifs pédagogiques</h2>
          <ul>
            <li>Mettre en pratique la méthodologie de conception BD vue en cours (SEA -&gt; SLR -&gt; SQL) ;</li>
            <li>Maîtriser les contraintes d'intégrité côté SGBD plutôt que dans le code applicatif ;</li>
            <li>Savoir peupler et interroger une base afin de répondre à des besoins concrets ;</li>
            <li>Apprendre à faire évoluer un schéma existant sans casser les données.</li>
          </ul>
        </section>

        <hr />

        <section id="techniques">
          <h2>Compétences techniques & savoir-faire</h2>
          <ul>
            <li>Conception EA / Merise avec DB-Diagram.io puis export PDF</li>
            <li>PostgreSQL 15, <code>psql</code>, pgAdmin 4, DBeaver</li>
            <li>Contraintes : <strong>CHECK</strong>, clés composites, FK, index</li>
            <li>Requêtes avancées : window functions, <code>INTERVAL</code>, vues matérialisées</li>
            <li>Versioning GitLab ; livrables packagés en <code>.zip</code></li>
            <li>Bilan rédigé en LaTeX (<code>bilan.pdf</code>) avec analyse critique</li>
          </ul>
        </section>

        <hr />

        <section id="group-work">
          <h2>Organisation en binôme</h2>
          <p>
            Répartition des tâches : mon binôme s'est concentré sur <code>create.sql</code> / <code>drop.sql</code>,
            moi sur le SLR, les requêtes métier et le bilan. Revues de code hebdomadaires sur GitLab.
          </p>
        </section>

        <hr />

        <section id="individual-work">
          <h2>Contributions personnelles</h2>
          <ul>
            <li>Conception du schéma relationnel (diagramme & justification)</li>
            <li>Écriture / optimisation des requêtes B1.1 -&gt; B2 (&lt;= 5 ms)</li>
            <li>Automatisation des tests et validation des scripts SQL avec PostgreSQL</li>
            <li>Présentation orale de 5 minutes (slides Canva)</li>
          </ul>
        </section>
      </article>

      <ProjectPagination currentPath="/projet-SAE4" />
    </>
  );
};

export default ProjetSAE4;
