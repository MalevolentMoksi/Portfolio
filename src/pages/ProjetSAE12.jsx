import { useRef } from 'react';
import { useTranslation } from 'react-i18next';
import ProjectPagination from '@/components/ProjectPagination.jsx';
import useReadingTimeEstimate from '@/hooks/useReadingTimeEstimate.js';

const ProjetSAE12 = () => {
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
              This project, named <strong>"Automatic Classification"</strong>, aimed to improve a news dispatch
              sorting system by creating an automatic lexicon-generation method. Unlike the first stage where
              lexicons were manually built, we experimented with machine-learning-inspired heuristics to produce
              more relevant lexicons and improve classification accuracy. Team: Paolo Colombat and Enzo Morello.
            </p>
          </section>

          <hr />

          <section id="skills">
            <h2>Skills</h2>
            <ul>
              <li>Data-structure handling in Java (ArrayList, custom objects)</li>
              <li>Text analysis and string processing</li>
              <li>File reading and writing</li>
              <li>Scoring-algorithm design</li>
              <li>Experimental comparison of AI approaches</li>
            </ul>
          </section>

          <hr />

          <section id="techniques">
            <h2>Technical Skills & Know-How</h2>
            <ul>
              <li>Using Java for text classification</li>
              <li>Using IntelliJ as the IDE</li>
              <li>Applying heuristics to weight lexicons</li>
              <li>Optimization with sorting and binary search</li>
              <li>Comparison with a simplified K-NN method</li>
            </ul>
          </section>

          <hr />

          <section id="objectives">
            <h2>Objectives</h2>
            <ul>
              <li>Automate lexicon generation from categorized dispatches</li>
              <li>Compute a score for each word based on frequency and specificity</li>
              <li>Assign weights to words according to relevance</li>
              <li>Evaluate system performance on test data</li>
              <li>Compare results with a nearest-neighbors approach</li>
            </ul>
          </section>

          <hr />

          <section id="group-work">
            <h2>Teamwork</h2>
            <p>
              The project was completed in pairs. We split the work between text-processing/scoring algorithms
              and code structure/testing/method comparison, then reviewed each milestone together. I focused
              mostly on the iterative scoring-calibration part, while my teammate invested significant effort
              in the KNN approach and later transferred that knowledge to me.
            </p>
          </section>

          <hr />

          <section id="individual-work">
            <h2>Individual Contribution</h2>
            <p>
              I implemented several core methods such as <code>initDico</code>, <code>calculScores</code>, and
              <code>poidsPourScore</code>, while documenting algorithmic decisions for scoring and weighting.
              I also contributed to the English report and oral presentation preparation.
            </p>
          </section>
        </article>

        <ProjectPagination currentPath="/projet-SAE12" />
      </>
    );
  }

  return (
    <>
      <article className="project-article" ref={contentRef}>
        <section id="project-detail">
          <h2>Description</h2>
          <p>
            Ce projet, intitulé <strong>"Classification automatique"</strong>, visait à améliorer un
            système de tri de dépêches d'actualité en développant une méthode de génération automatique
            de lexiques. Contrairement à la première partie où les lexiques étaient manuels, nous avons
            ici expérimenté l'apprentissage automatique afin de générer des lexiques plus pertinents et
            d'améliorer la précision du système de classification. Binôme : Paolo Colombat, Enzo Morello.
          </p>
        </section>

        <hr />

        <section id="skills">
          <h2>Compétences</h2>
          <ul>
            <li>Manipulation de structures de données en Java (ArrayList, objets personnalisés)</li>
            <li>Analyse de texte et traitement de chaînes</li>
            <li>Écriture et lecture de fichiers</li>
            <li>Conception d'algorithmes de pondération</li>
            <li>Comparaison expérimentale de méthodes d'IA</li>
          </ul>
        </section>

        <hr />

        <section id="techniques">
          <h2>Compétences Techniques & Savoir-Faire</h2>
          <ul>
            <li>Utilisation de Java pour la classification textuelle</li>
            <li>Utilisation d'IntelliJ comme IDE</li>
            <li>Application d'heuristiques pour pondérer les lexiques</li>
            <li>Optimisation par tri et recherche dichotomique</li>
            <li>Comparaison avec la méthode K-NN simplifiée</li>
          </ul>
        </section>

        <hr />

        <section id="objectives">
          <h2>Objectifs</h2>
          <ul>
            <li>Automatiser la génération de lexiques à partir de dépêches catégorisées</li>
            <li>Calculer un score pour chaque mot en fonction de sa fréquence et spécificité</li>
            <li>Attribuer des poids aux mots selon leur pertinence</li>
            <li>Évaluer les performances du système avec ces lexiques sur des données de test</li>
            <li>Comparer avec la méthode des K plus proches voisins</li>
          </ul>
        </section>

        <hr />

        <section id="group-work">
          <h2>Travail en groupe</h2>
          <p>
            Le projet a été réalisé en binôme. Nous avons réparti les tâches comme suit : l'un travaillait
            principalement sur les algorithmes de traitement de texte et de calcul de scores, tandis que
            l'autre gérait la structure du code, les tests et les comparaisons de méthodes. Nous avons
            effectué une relecture mutuelle avant chaque étape importante. Je me suis occupé principalement
            de la première partie et sur ce qui demandait le plus de travail "itératif" (augmenter
            empiriquement un score). Notamment, mon camarade a passé beaucoup de temps sur la méthode KNN
            (discutablement la plus difficile) et a pu me l'expliquer après.
          </p>
        </section>

        <hr />

        <section id="individual-work">
          <h2>Travail individuel</h2>
          <p>
            Personnellement, j'ai implémenté plusieurs méthodes <code>initDico</code>,
            <code>calculScores</code> et <code>poidsPourScore</code>, tout en documentant clairement les
            choix algorithmiques faits pour le calcul des scores et l'attribution des poids. J'ai aussi
            participé à l'écriture du rapport en anglais et à la préparation de la présentation orale.
          </p>
        </section>
      </article>

      <ProjectPagination currentPath="/projet-SAE12" />
    </>
  );
};

export default ProjetSAE12;
