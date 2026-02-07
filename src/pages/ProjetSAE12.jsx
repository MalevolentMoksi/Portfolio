import ProjectPagination from '@/components/ProjectPagination.jsx';

const ProjetSAE12 = () => (
  <>
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

    <section id="individual-work">
      <h2>Travail individuel</h2>
      <p>
        Personnellement, j'ai implémenté plusieurs méthodes <code>initDico</code>,
        <code>calculScores</code> et <code>poidsPourScore</code>, tout en documentant clairement les
        choix algorithmiques faits pour le calcul des scores et l'attribution des poids. J'ai aussi
        participé à l'écriture du rapport en anglais et à la préparation de la présentation orale.
      </p>
    </section>
    
    <ProjectPagination currentPath="/projet-SAE12" />
  </>
);

export default ProjetSAE12;
