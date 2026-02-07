import { useRef } from 'react';
import ProjectPagination from '@/components/ProjectPagination.jsx';
import useReadingTimeEstimate from '@/hooks/useReadingTimeEstimate.js';

const ProjetSAE3 = () => {
  const contentRef = useRef(null);
  useReadingTimeEstimate(contentRef);

  return (
    <>
      <article className="project-article" ref={contentRef}>
        <section id="project-detail">
          <h2>Description</h2>
          <p>
            Le projet d'Installation d'un poste pour le développement avait pour objectif de préparer
            pas à pas un environnement de développement complet : choix et installation du système
            d'exploitation, mise à jour et sécurisation de la machine, déploiement des outils (IDE,
            compilateurs, gestion de versions) et configuration réseau. Ce travail pratique s'est conclu
            par la réalisation d'une carte mentale.
            <br />
            <br />
            Réalisé individuellement (1ère année BUT Informatique).
          </p>
        </section>

        <section id="skills">
          <h2>Compétences</h2>
          <ul>
            <li>
              Identifier les différents composants (matériels et logiciels) d'un système numérique
              <ul>
                <li>Repérer et nommer les éléments d'une carte mère : CPU, RAM, chipset, bus, ports E/S...</li>
                <li>Distinguer micrologiciel, système d'exploitation, pilotes, bibliothèques et applications</li>
              </ul>
            </li>

            <li>
              Utiliser les fonctionnalités de base d'un système multitâches / multi-utilisateurs
              <ul>
                <li>Naviguer dans l'arborescence Unix (<code>cd</code>, <code>ls</code>, <code>pwd</code>, completion)</li>
                <li>
                  Gérer processus et permissions (<code>ps</code>, <code>kill</code>, <code>chmod</code>,
                  <code>chown</code>, <code>sudo</code>)
                </li>
              </ul>
            </li>

            <li>
              Installer et configurer un système d'exploitation et des outils de développement
              <ul>
                <li>Créer un support USB açmorçable (Ventoy) et installer Ubuntu 22.04 LTS dans VirtualBox</li>
                <li>Installer JDK 17, GCC, Python 3, Git, VS Code, IntelliJ IDEA, Node.js</li>
                <li>Configurer les variables d'environnement, les raccourcis clavier et l'intégration Git dans l'IDE</li>
              </ul>
            </li>

            <li>
              Configurer un poste de travail dans un réseau d'entreprise
              <ul>
                <li>Paramétrer l'adressage IP/DNS, rejoindre le Wi-Fi/filé de l'IUT, configurer le proxy APT</li>
                <li>Générer une paire de clés SSH et cloner un dépôt GitLab UGA</li>
                <li>Accéder aux ressources partagées : imprimantes, partages Samba/NFS</li>
              </ul>
            </li>
          </ul>
        </section>

        <section id="techniques">
          <h2>Compétences Techniques & Savoir-Faire</h2>
          <ul>
            <li>Création de supports açmorçables (Ventoy, Rufus) et configuration UEFI/Secure Boot</li>
            <li>Partitionnement disque & installation en dual-boot ou machine virtuelle (VirtualBox)</li>
            <li>Mise à jour système : <code>apt</code>, <code>snap</code>, activation du pare-feu UFW</li>
            <li>
              Installation et paramétrage des IDE : Visual Studio Code (extensions Python/Java),
              IntelliJ IDEA
            </li>
            <li>Mise en place de Git / GitLab : <code>git init</code>, conventions de commit, intégration CI/CD</li>
            <li>Script Bash d'automatisation : installation des paquets, sauvegarde de la configuration</li>
            <li>
              Outils de communication : conception d'une carte mentale avec XMind, préparation de slides
              (Canva)
            </li>
            <li>Validation de l'environnement par la compilation et l'exécution d'un projet Java, C et Python</li>
          </ul>
        </section>

        <section id="objectives">
          <h2>Objectifs</h2>
          <ul>
            <li>Documenter et ordonner les étapes d'installation d'un poste de développement (OS + IDE)</li>
            <li>Concevoir une carte mentale claire, hiérarchisée et colorée pour vulgariser la procédure</li>
            <li>Rédiger un guide synthétique expliquant chaque commande et choix technique</li>
          </ul>
        </section>

        <section id="group-work">
          <h2>Collaboration</h2>
          <p>
            Bien que l'évaluation soit individuelle, plusieurs séances d'atelier ont permis d'échanger
            des bonnes pratiques : revue croisée des cartes mentales, entraide pour le partitionnement
            disque et la configuration du proxy. Ces discussions ont enrichi mon propre guide et m'ont
            aidé à clarifier l'ordre des étapes.
          </p>
        </section>

        <section id="individual-work">
          <h2>Travail personnel</h2>
          <p>J'ai :</p>
          <ul>
            <li>réalisé l'installation complète d'Ubuntu 22.04 dans VirtualBox puis en dual-boot ;</li>
            <li>écrit un script Bash automatisant l'installation des dépendances (Git, Java, Python, VS Code) ;</li>
            <li>créé la carte mentale avec XMind, en appliquant une lecture horaire et un code couleur cohérent ;</li>
          </ul>
        </section>
      </article>

      <ProjectPagination currentPath="/projet-SAE3" />
    </>
  );
};

export default ProjetSAE3;
