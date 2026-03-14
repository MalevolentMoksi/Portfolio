import { useRef } from 'react';
import { useTranslation } from 'react-i18next';
import ProjectPagination from '@/components/ProjectPagination.jsx';
import useReadingTimeEstimate from '@/hooks/useReadingTimeEstimate.js';

const ProjetSAE3 = () => {
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
              This project focused on setting up a full development workstation step by step: OS selection and
              installation, system hardening, toolchain deployment (IDE, compilers, version control), and network
              configuration. The practical work concluded with a synthetic mind map.
              <br />
              <br />
              Completed individually (1st year Computer Science BUT).
            </p>
          </section>

          <hr />

          <section id="skills">
            <h2>Skills</h2>
            <ul>
              <li>
                Identify hardware and software components of a digital system
                <ul>
                  <li>Locate and name motherboard elements: CPU, RAM, chipset, buses, I/O ports</li>
                  <li>Differentiate firmware, OS, drivers, libraries, and applications</li>
                </ul>
              </li>
              <li>
                Use core features of a multi-user, multi-task system
                <ul>
                  <li>Navigate Unix directories with <code>cd</code>, <code>ls</code>, <code>pwd</code>, completion</li>
                  <li>
                    Manage processes and permissions with <code>ps</code>, <code>kill</code>, <code>chmod</code>,
                    <code>chown</code>, and <code>sudo</code>
                  </li>
                </ul>
              </li>
              <li>
                Install and configure an OS and development tools
                <ul>
                  <li>Create a bootable USB (Ventoy) and install Ubuntu 22.04 LTS in VirtualBox</li>
                  <li>Install JDK 17, GCC, Python 3, Git, VS Code, IntelliJ IDEA, and Node.js</li>
                  <li>Configure environment variables, shortcuts, and Git integration in the IDE</li>
                </ul>
              </li>
              <li>
                Configure a workstation in a professional network
                <ul>
                  <li>Set up IP/DNS addressing, network access, and APT proxy configuration</li>
                  <li>Generate SSH keys and clone a GitLab repository</li>
                  <li>Access shared resources such as printers and file shares</li>
                </ul>
              </li>
            </ul>
          </section>

          <hr />

          <section id="techniques">
            <h2>Technical Skills & Know-How</h2>
            <ul>
              <li>Create bootable media (Ventoy, Rufus) and configure UEFI/Secure Boot</li>
              <li>Disk partitioning and VM / dual-boot installation workflows</li>
              <li>System updates with <code>apt</code>, <code>snap</code>, and UFW firewall setup</li>
              <li>IDE setup for Visual Studio Code and IntelliJ IDEA</li>
              <li>Git / GitLab setup with commit conventions and CI/CD integration</li>
              <li>Bash automation script for dependency installation and setup backup</li>
              <li>Mind-map design with XMind and slide support with Canva</li>
              <li>Validation via compile/run tests on Java, C, and Python projects</li>
            </ul>
          </section>

          <hr />

          <section id="objectives">
            <h2>Objectives</h2>
            <ul>
              <li>Document and order all workstation setup steps (OS + IDE)</li>
              <li>Create a clear and structured educational mind map</li>
              <li>Write a concise guide explaining each command and technical decision</li>
            </ul>
          </section>

          <hr />

          <section id="group-work">
            <h2>Collaboration</h2>
            <p>
              Although assessed individually, workshop sessions enabled exchange of best practices: peer review of
              mind maps, support for partitioning, and proxy troubleshooting. These exchanges improved my own guide
              and helped clarify the execution order.
            </p>
          </section>

          <hr />

          <section id="individual-work">
            <h2>Personal Work</h2>
            <p>I:</p>
            <ul>
              <li>completed full Ubuntu 22.04 setup in VirtualBox and then dual-boot;</li>
              <li>wrote a Bash script to automate dependency installation (Git, Java, Python, VS Code);</li>
              <li>produced a consistent, color-coded mind map with clockwise reading logic.</li>
            </ul>
          </section>
        </article>

        <ProjectPagination currentPath="/projet-SAE3" />
      </>
    );
  }

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

        <hr />

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
                <li>Créer un support USB amorçable (Ventoy) et installer Ubuntu 22.04 LTS dans VirtualBox</li>
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

        <hr />

        <section id="techniques">
          <h2>Compétences Techniques & Savoir-Faire</h2>
          <ul>
            <li>Création de supports amorçables (Ventoy, Rufus) et configuration UEFI/Secure Boot</li>
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

        <hr />

        <section id="objectives">
          <h2>Objectifs</h2>
          <ul>
            <li>Documenter et ordonner les étapes d'installation d'un poste de développement (OS + IDE)</li>
            <li>Concevoir une carte mentale claire, hiérarchisée et colorée pour vulgariser la procédure</li>
            <li>Rédiger un guide synthétique expliquant chaque commande et choix technique</li>
          </ul>
        </section>

        <hr />

        <section id="group-work">
          <h2>Collaboration</h2>
          <p>
            Bien que l'évaluation soit individuelle, plusieurs séances d'atelier ont permis d'échanger
            des bonnes pratiques : revue croisée des cartes mentales, entraide pour le partitionnement
            disque et la configuration du proxy. Ces discussions ont enrichi mon propre guide et m'ont
            aidé à clarifier l'ordre des étapes.
          </p>
        </section>

        <hr />

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
