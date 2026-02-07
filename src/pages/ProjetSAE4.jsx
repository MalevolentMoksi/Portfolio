import { useRef } from 'react';
import ProjectPagination from '@/components/ProjectPagination.jsx';
import useReadingTimeEstimate from '@/hooks/useReadingTimeEstimate.js';

const ProjetSAE4 = () => {
  const contentRef = useRef(null);
  useReadingTimeEstimate(contentRef);

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

        <section id="skills">
          <h2>Compétences mobilisées</h2>
          <ul>
            <li>Mettre à jour et interroger une base de données relationnelle (en requêtes directes ou via une application)</li>
            <li>Visualiser des données</li>
            <li>Concevoir une base de données relationnelle à partir d'un cahier des charges</li>
          </ul>
        </section>

        <section id="objectives">
          <h2>Objectifs pédagogiques</h2>
          <ul>
            <li>Mettre en pratique la méthodologie de conception BD vue en cours (SEA -&gt; SLR -&gt; SQL) ;</li>
            <li>Maîtriser les contraintes d'intégrité côté SGBD plutôt que dans le code applicatif ;</li>
            <li>Savoir peupler et interroger une base afin de répondre à des besoins concrets ;</li>
            <li>Apprendre à faire évoluer un schéma existant sans casser les données.</li>
          </ul>
        </section>

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

        <section id="group-work">
          <h2>Organisation en binôme</h2>
          <p>
            Répartition des tâches : mon binôme s'est concentré sur <code>create.sql</code> / <code>drop.sql</code>,
            moi sur le SLR, les requêtes métier et le bilan. Revues de code hebdomadaires sur GitLab.
          </p>
        </section>

        <section id="individual-work">
          <h2>Contributions personnelles</h2>
          <ul>
            <li>Conception du schéma relationnel (diagramme & justification)</li>
            <li>Écriture / optimisation des requêtes B1.1 -&gt; B2 (&lt;= 5 ms)</li>
            <li>Automatisation des tests via conteneur Docker PostgreSQL</li>
            <li>Présentation orale de 5 minutes (slides Canva)</li>
          </ul>
        </section>
      </article>

      <ProjectPagination currentPath="/projet-SAE4" />
    </>
  );
};

export default ProjetSAE4;
