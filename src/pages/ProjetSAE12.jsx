const ProjetSAE12 = () => (
  <>
    <section id="project-detail">
      <h2>Description</h2>
      <p>
        Ce projet, intitule <strong>"Classification automatique"</strong>, visait a ameliorer un
        systeme de tri de depeches d'actualite en developpant une methode de generation automatique
        de lexiques. Contrairement a la premiere partie ou les lexiques etaient manuels, nous avons
        ici experimente l'apprentissage automatique afin de generer des lexiques plus pertinents et
        d'ameliorer la precision du systeme de classification. Binome : Paolo Colombat, Enzo Morello.
      </p>
    </section>

    <section id="skills">
      <h2>Competences</h2>
      <ul>
        <li>Manipulation de structures de donnees en Java (ArrayList, objets personnalises)</li>
        <li>Analyse de texte et traitement de chaines</li>
        <li>Ecriture et lecture de fichiers</li>
        <li>Conception d'algorithmes de ponderation</li>
        <li>Comparaison experimentale de methodes d'IA</li>
      </ul>
    </section>

    <section id="techniques">
      <h2>Competences Techniques & Savoir-Faire</h2>
      <ul>
        <li>Utilisation de Java pour la classification textuelle</li>
        <li>Utilisation d'IntelliJ comme IDE</li>
        <li>Application d'heuristiques pour ponderer les lexiques</li>
        <li>Optimisation par tri et recherche dichotomique</li>
        <li>Comparaison avec la methode K-NN simplifiee</li>
      </ul>
    </section>

    <section id="objectives">
      <h2>Objectifs</h2>
      <ul>
        <li>Automatiser la generation de lexiques a partir de depeches categorisees</li>
        <li>Calculer un score pour chaque mot en fonction de sa frequence et specificite</li>
        <li>Attribuer des poids aux mots selon leur pertinence</li>
        <li>Evaluer les performances du systeme avec ces lexiques sur des donnees de test</li>
        <li>Comparer avec la methode des K plus proches voisins</li>
      </ul>
    </section>

    <section id="group-work">
      <h2>Travail en groupe</h2>
      <p>
        Le projet a ete realise en binome. Nous avons reparti les taches comme suit : l'un travaillait
        principalement sur les algorithmes de traitement de texte et de calcul de scores, tandis que
        l'autre gerait la structure du code, les tests et les comparaisons de methodes. Nous avons
        effectue une relecture mutuelle avant chaque etape importante. Je me suis occupe principalement
        de la premiere partie et sur ce qui demandait le plus de travail "iteratif" (augmenter
        empiriquement un score). Notamment, mon camarade a passe beaucoup de temps sur la methode KNN
        (discutablement la plus difficile) et a pu me l'expliquer apres.
      </p>
    </section>

    <section id="individual-work">
      <h2>Travail individuel</h2>
      <p>
        Personnellement, j'ai implemente plusieurs methodes <code>initDico</code>,
        <code>calculScores</code> et <code>poidsPourScore</code>, tout en documentant clairement les
        choix algorithmiques faits pour le calcul des scores et l'attribution des poids. J'ai aussi
        participe a l'ecriture du rapport en anglais et a la preparation de la presentation orale.
      </p>
    </section>
  </>
);

export default ProjetSAE12;
