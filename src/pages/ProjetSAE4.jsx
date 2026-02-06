const ProjetSAE4 = () => (
  <>
    <section id="project-detail">
      <h2>Description</h2>
      <p>
        Realisee au semestre 1 du BUT Informatique, le projet avait pour but de concevoir et de
        mettre en place, en binome, une base de donnees complete pour le club de bowling SuperBall.
        A partir d'un cahier des charges et d'un schema Entites-Associations (SEA) fournis, nous
        avons :
      </p>
      <ul>
        <li>Derive le schema relationnel (SLR) en appliquant les regles de traduction vues en cours ;</li>
        <li>
          Ecrit un script <code>create.sql</code> creant les tables, cles primaires / etrangeres,
          <code>CHECK</code>, <code>NOT NULL</code>, contraintes d'unicite ;
        </li>
        <li>
          Redige un script <code>test.sql</code> peuplant la base puis verifiant l'integrite via des
          insertions invalides ;
        </li>
        <li>
          Developpe des requetes SQL repondant a six besoins metier (planning des pistes, stock de
          chaussures, disponibilite, etc.) ;
        </li>
        <li>
          Fait evoluer la base lors de l'etape 3 : gestion du remplacement d'une piste, extension du
          nombre maximum de parties et bilan critique du projet.
        </li>
      </ul>
      <p>
        Resultat : une base PostgreSQL robuste, documentee (PDF) et livree avec scripts de creation,
        suppression et jeu d'essai.
      </p>
    </section>

    <section id="skills">
      <h2>Competences mobilisees</h2>
      <ul>
        <li>Mettre a jour et interroger une base de donnees relationnelle (en requetes directes ou via une application)</li>
        <li>Visualiser des donnees</li>
        <li>Concevoir une base de donnees relationnelle a partir d'un cahier des charges</li>
      </ul>
    </section>

    <section id="objectives">
      <h2>Objectifs pedagogiques</h2>
      <ul>
        <li>Mettre en pratique la methodologie de conception BD vue en cours (SEA -&gt; SLR -&gt; SQL) ;</li>
        <li>Maitriser les contraintes d'integrite cote SGBD plutot que dans le code applicatif ;</li>
        <li>Savoir peupler et interroger une base afin de repondre a des besoins concrets ;</li>
        <li>Apprendre a faire evoluer un schema existant sans casser les donnees.</li>
      </ul>
    </section>

    <section id="techniques">
      <h2>Competences techniques & savoir-faire</h2>
      <ul>
        <li>Conception EA / Merise avec DB-Diagram.io puis export PDF</li>
        <li>PostgreSQL 15, <code>psql</code>, pgAdmin 4, DBeaver</li>
        <li>Contraintes : <strong>CHECK</strong>, cles composites, FK, index</li>
        <li>Requetes avancees : window functions, <code>INTERVAL</code>, vues materialisees</li>
        <li>Versioning GitLab ; livrables packages en <code>.zip</code></li>
        <li>Bilan redige en LaTeX (<code>bilan.pdf</code>) avec analyse critique</li>
      </ul>
    </section>

    <section id="group-work">
      <h2>Organisation en binome</h2>
      <p>
        Repartition des taches : mon binome s'est concentre sur <code>create.sql</code> / <code>drop.sql</code>,
        moi sur le SLR, les requetes metier et le bilan. Revues de code hebdomadaires sur GitLab.
      </p>
    </section>

    <section id="individual-work">
      <h2>Contributions personnelles</h2>
      <ul>
        <li>Conception du schema relationnel (diagramme & justification)</li>
        <li>Ecriture / optimisation des requetes B1.1 -&gt; B2 (&lt;= 5 ms)</li>
        <li>Automatisation des tests via conteneur Docker PostgreSQL</li>
        <li>Presentation orale de 5 minutes (slides Canva)</li>
      </ul>
    </section>
  </>
);

export default ProjetSAE4;
