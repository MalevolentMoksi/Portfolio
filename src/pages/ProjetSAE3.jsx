import ProjectPagination from '@/components/ProjectPagination.jsx';

const ProjetSAE3 = () => (
  <>
    <section id="project-detail">
      <h2>Description</h2>
      <p>
        Le projet d'Installation d'un poste pour le developpement avait pour objectif de preparer
        pas a pas un environnement de developpement complet : choix et installation du systeme
        d'exploitation, mise a jour et securisation de la machine, deploiement des outils (IDE,
        compilateurs, gestion de versions) et configuration reseau. Ce travail pratique s'est conclu
        par la realisation d'une carte mentale.
        <br />
        <br />
        Realise individuellement (1ere annee BUT Informatique).
      </p>
    </section>

    <section id="skills">
      <h2>Competences</h2>
      <ul>
        <li>
          Identifier les differents composants (materiels et logiciels) d'un systeme numerique
          <ul>
            <li>Reperer et nommer les elements d'une carte mere : CPU, RAM, chipset, bus, ports E/S...</li>
            <li>Distinguer micrologiciel, systeme d'exploitation, pilotes, librairies et applications</li>
          </ul>
        </li>

        <li>
          Utiliser les fonctionnalites de base d'un systeme multitaches / multi-utilisateurs
          <ul>
            <li>Naviguer dans l'arborescence Unix (<code>cd</code>, <code>ls</code>, <code>pwd</code>, completion)</li>
            <li>
              Gerer processus et permissions (<code>ps</code>, <code>kill</code>, <code>chmod</code>,
              <code>chown</code>, <code>sudo</code>)
            </li>
          </ul>
        </li>

        <li>
          Installer et configurer un systeme d'exploitation et des outils de developpement
          <ul>
            <li>Creer un support USB bootable (Ventoy) et installer Ubuntu 22.04 LTS dans VirtualBox</li>
            <li>Installer JDK 17, GCC, Python 3, Git, VS Code, IntelliJ IDEA, Node.js</li>
            <li>Configurer les variables d'environnement, les raccourcis clavier et l'integration Git dans l'IDE</li>
          </ul>
        </li>

        <li>
          Configurer un poste de travail dans un reseau d'entreprise
          <ul>
            <li>Parametrer l'adressage IP/DNS, rejoindre le Wi-Fi/filaire de l'IUT, configurer le proxy APT</li>
            <li>Generer une paire de cles SSH et cloner un depot GitLab UGA</li>
            <li>Acceder aux ressources partagees : imprimantes, partages Samba/NFS</li>
          </ul>
        </li>
      </ul>
    </section>

    <section id="techniques">
      <h2>Competences Techniques & Savoir-Faire</h2>
      <ul>
        <li>Creation de supports demarrables (Ventoy, Rufus) et configuration UEFI/Secure Boot</li>
        <li>Partitionnement disque & installation en dual-boot ou machine virtuelle (VirtualBox)</li>
        <li>Mise a jour systeme : <code>apt</code>, <code>snap</code>, activation du pare-feu UFW</li>
        <li>
          Installation et parametrage des IDE : Visual Studio Code (extensions Python/Java),
          IntelliJ IDEA
        </li>
        <li>Mise en place de Git / GitLab : <code>git init</code>, conventions de commit, integration CI/CD</li>
        <li>Script Bash d'automatisation : installation des paquets, sauvegarde de la configuration</li>
        <li>
          Outils de communication : conception d'une carte mentale avec XMind, preparation de slides
          (Canva)
        </li>
        <li>Validation de l'environnement par la compilation et l'execution d'un projet Java, C et Python</li>
      </ul>
    </section>

    <section id="objectives">
      <h2>Objectifs</h2>
      <ul>
        <li>Documenter et ordonner les etapes d'installation d'un poste de developpement (OS + IDE)</li>
        <li>Concevoir une carte mentale claire, hierarchisee et coloree pour vulgariser la procedure</li>
        <li>Rediger un guide synthetique expliquant chaque commande et choix technique</li>
      </ul>
    </section>

    <section id="group-work">
      <h2>Collaboration</h2>
      <p>
        Bien que l'evaluation soit individuelle, plusieurs seances d'atelier ont permis d'echanger
        des bonnes pratiques : revue croisee des cartes mentales, entraide pour le partitionnement
        disque et la configuration du proxy. Ces discussions ont enrichi mon propre guide et m'ont
        aide a clarifier l'ordre des etapes.
      </p>
    </section>

    <section id="individual-work">
      <h2>Travail personnel</h2>
      <p>J'ai :</p>
      <ul>
        <li>realise l'installation complete d'Ubuntu 22.04 dans VirtualBox puis en dual-boot ;</li>
        <li>ecrit un script Bash automatisant l'installation des dependances (Git, Java, Python, VS Code) ;</li>
        <li>cree la carte mentale avec XMind, en appliquant une lecture horaire et un code couleur coherent ;</li>
      </ul>
    </section>
    
    <ProjectPagination currentPath="/projet-SAE3" />
  </>
);

export default ProjetSAE3;
