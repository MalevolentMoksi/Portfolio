import { useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import ProjectPagination from '@/components/ProjectPagination';
import useReadingTimeEstimate from '@/hooks/useReadingTimeEstimate';
import '@styles/components/_aideme-logo.css';

const ProjetSAE301 = () => {
  const { i18n } = useTranslation();
  const contentRef = useRef<any>(null);
  const rotationRef = useRef(0);
  const comboRef = useRef(0);
  const timerRef = useRef<any>(null);

  const [transformStyle, setTransformStyle] = useState({});
  const [isCelebrating, setIsCelebrating] = useState(false);

  useReadingTimeEstimate(contentRef);

  const triggerInteraction = (e: any) => {
    e.preventDefault();

    comboRef.current += 1;
    if (navigator.vibrate) navigator.vibrate(40);

    rotationRef.current += 360;

    if (comboRef.current === 10) {
      setIsCelebrating(true);
      if (navigator.vibrate) navigator.vibrate([50, 50, 50]);
    }

    const scale = 1 + Math.min(comboRef.current * 0.05, 0.3);
    setTransformStyle({
      transition: 'transform 0.8s cubic-bezier(0.34, 1.56, 0.64, 1)',
      transform: `rotate(${rotationRef.current}deg) scale(${scale})`,
    });

    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => {
      comboRef.current = 0;
      setIsCelebrating(false);
      setTransformStyle({
        transition: 'transform 0.5s ease-out',
        transform: `rotate(${rotationRef.current}deg) scale(1)`,
      });
    }, 1500);
  };

  if (i18n.resolvedLanguage === 'en') {
    return (
      <>
        <article className="project-article" ref={contentRef}>
          <div className="aideme-logo-hero">
            <div
              className="aideme-logo-wrapper"
              onClick={triggerInteraction}
              aria-hidden="true"
              tabIndex={-1}
            >
              <div className="aideme-logo-container" style={transformStyle}>
                <div
                  className={`aideme-logo-inner ${isCelebrating ? 'anim-celebrate' : comboRef.current > 0 ? '' : 'anim-A'}`}
                >
                  <img
                    src="/assets/images/projects/Logo_Aideme_Mains.png"
                    alt=""
                    className="aideme-logo-part hands"
                  />
                  <img
                    src="/assets/images/projects/Logo_Aideme_Coeur.png"
                    alt=""
                    className="aideme-logo-part heart"
                  />
                </div>
              </div>
            </div>

            <p className="aideme-logo-title">Aideme</p>
            <p className="aideme-logo-tagline">Caring for those who care</p>
          </div>

          <hr />

          <section id="project-detail">
            <h2>Project Context</h2>
            <p>
              In France, more than 9 million informal caregivers support dependent relatives and
              face heavy mental load. Aideme was created to make this invisible work visible through
              a collaborative platform.
            </p>
            <p>
              The application allows multiple caregivers to coordinate follow-up around one person:
              shared agenda, contact management, secure documents, notifications, and moderated
              photo memories.
            </p>
            <p>
              Technical stack: React 19 (Vite), PHP 8 API layer, SQLite database with DAO
              architecture. Team project delivered in second-year BUT Computer Science (Team 08,
              IUT2 Grenoble).
            </p>
          </section>

          <hr />

          <section id="features">
            <h2>Main Features</h2>
            <ul>
              <li>Account creation and authentication (session-based).</li>
              <li>Dependent-profile management with role transfer and caregiver invitations.</li>
              <li>Contact CRUD linked to each dependent profile.</li>
              <li>Calendar with monthly/weekly views and mobile-friendly interface.</li>
              <li>Photo gallery with approval workflow by responsible caregiver.</li>
              <li>Hierarchical file vault with per-user access controls.</li>
              <li>In-app notifications and persistent accessibility preferences.</li>
            </ul>
          </section>

          <hr />

          <section id="design">
            <h2>Visual Identity & Accessibility</h2>
            <p>
              The name <em>Aideme</em> combines helping and caring. The logo uses open hand shapes
              converging toward a heart to express support without medical stereotypes.
            </p>
            <ul>
              <li>
                <strong>Color system:</strong> trust-focused emerald, warm terracotta, calm
                neutrals.
              </li>
              <li>
                <strong>Accessibility:</strong> high-contrast mode, large text, dyslexia-friendly
                mode, dark theme.
              </li>
              <li>
                <strong>Responsive UX:</strong> dedicated mobile agenda and adaptive navigation.
              </li>
            </ul>
          </section>

          <hr />

          <section id="techniques">
            <h2>Technical Architecture & Security</h2>
            <ul>
              <li>React + React Router with modular front-end components.</li>
              <li>PHP MVC backend with REST controllers.</li>
              <li>SQLite via PDO/DAO, designed for PostgreSQL migration.</li>
              <li>Strict session handling and role-based access control.</li>
              <li>Fine-grained file permissions and moderated media workflow.</li>
              <li>GDPR-oriented approach (privacy by design/default).</li>
            </ul>
          </section>

          <hr />

          <section id="skills">
            <h2>Skills Mobilized</h2>
            <ul>
              <li>Build accessible and modular UI with React.</li>
              <li>Integrate and consume REST APIs in a full-stack flow.</li>
              <li>Model relational databases and implement DAO patterns.</li>
              <li>Coordinate teamwork with GitLab workflows and code reviews.</li>
            </ul>
          </section>

          <hr />

          <section id="objectives">
            <h2>Objectives</h2>
            <ul>
              <li>Reduce caregiver mental load through centralized coordination.</li>
              <li>Provide a collaborative and accessible caregiving tool.</li>
              <li>Apply full-stack engineering in realistic constraints.</li>
              <li>Respect sensitive-data handling requirements.</li>
            </ul>
          </section>

          <hr />

          <section id="group-work">
            <h2>Team Organization</h2>
            <p>
              Team Aimedia iterated across several project phases and improved delivery speed by
              moving from split front/back work to a feature-based workflow with shared ownership.
            </p>
          </section>

          <hr />

          <section id="testing">
            <h2>User Testing & Validation</h2>
            <p>
              The product was tested with users from multiple profiles (family caregivers,
              healthcare workers, non-technical users) through guided scenarios and usability
              questionnaires.
            </p>
            <ul>
              <li>Think-aloud sessions on key journeys.</li>
              <li>SUS-based usability measurements.</li>
              <li>Interface improvements from collected feedback.</li>
            </ul>
          </section>

          <hr />

          <section id="individual-work">
            <h2>Personal Contributions</h2>
            <ul>
              <li>Need analysis, persona creation, and requirements framing.</li>
              <li>UX structure and wireframes for major user flows.</li>
              <li>Large share of front-end implementation and accessibility modes.</li>
              <li>Front/back integration work: API calls, sessions, and error handling.</li>
              <li>Participation in user testing preparation and analysis.</li>
            </ul>
          </section>

          <hr />

          <section id="perspectives">
            <h2>Retrospective & Roadmap</h2>
            <ul>
              <li>Introduce automated tests earlier in the lifecycle.</li>
              <li>Adopt feature-based organization from day one.</li>
              <li>Add staging and stronger deployment simulation earlier.</li>
              <li>
                Future roadmap: PostgreSQL migration, smarter file search, offline PWA support.
              </li>
            </ul>
          </section>

          <hr />

          <section id="preview">
            <h2>Application Preview</h2>
            <div className="aideme-preview">
              <div className="aideme-preview-item--desktop">
                <img
                  src="/assets/images/projects/AidemeApplication.png"
                  alt="Aideme main interface - desktop view"
                  className="zoomable"
                />
                <span className="aideme-preview-caption">Desktop view - light theme</span>
              </div>
              <div className="aideme-preview-item--mobile">
                <img
                  src="/assets/images/projects/AidemeAppMobileDarkmode.png"
                  alt="Aideme interface - mobile dark mode"
                  className="zoomable"
                />
                <span className="aideme-preview-caption">Mobile view - dark theme</span>
              </div>
            </div>
          </section>
        </article>

        <ProjectPagination currentPath="/projet-SAE3.01" />
      </>
    );
  }

  return (
    <>
      <article className="project-article" ref={contentRef}>
        {/* ── LOGO INTERACTIF AIDÉMÉ ────────────────────────────────────────── */}
        <div className="aideme-logo-hero">
          <div
            className="aideme-logo-wrapper"
            onClick={triggerInteraction}
            aria-hidden="true"
            tabIndex={-1}
          >
            <div className="aideme-logo-container" style={transformStyle}>
              <div
                className={`aideme-logo-inner ${isCelebrating ? 'anim-celebrate' : comboRef.current > 0 ? '' : 'anim-A'}`}
              >
                <img
                  src="/assets/images/projects/Logo_Aideme_Mains.png"
                  alt=""
                  className="aideme-logo-part hands"
                />
                <img
                  src="/assets/images/projects/Logo_Aideme_Coeur.png"
                  alt=""
                  className="aideme-logo-part heart"
                />
              </div>
            </div>
          </div>

          <p className="aideme-logo-title">Aidémé</p>
          <p className="aideme-logo-tagline">Prendre soin de ceux qui prennent soin</p>
        </div>

        <hr />

        {/* ── 1. CONTEXTE & GENÈSE ─────────────────────────────────────────── */}
        <section id="project-detail">
          <h2>Contexte &amp; genèse du projet</h2>
          <p>
            En France, <strong>9,3 millions de personnes</strong> sont aidants de proches
            dépendants, confrontées à une « double journée » qui génère une lourde charge mentale
            souvent invisible. Face aux enjeux du <em>Grand Âge</em> et aux profils{' '}
            <strong>GIR 3–4</strong> (grille AGGIR), le manque d'outils numériques collaboratifs,
            accessibles et centrés sur l'humain est criant.
          </p>
          <p>
            C'est de ce constat qu'est né <strong>Aidémé</strong> — contraction d'« Aider » et d'«
            Aimer » — une application Web permettant à plusieurs aidants de coordonner le suivi
            d'une même personne accompagnée en rendant visible ce <em>travail invisible</em>, en
            allégeant la charge mentale et en préservant le lien affectif (galerie photo pour
            stimuler la mémoire de l'aidé).
          </p>

          <h3>Pour qui ?</h3>
          <ul>
            <li>
              <strong>Claire</strong>, aidante sur place — a besoin de tout centraliser pour ne rien
              oublier entre deux visites.
            </li>
            <li>
              <strong>Antoine</strong>, aidant à distance (340 km en moyenne) — a besoin de
              notifications push et d'un suivi en temps réel depuis son téléphone.
            </li>
            <li>
              <strong>Delphine &amp; Bruno</strong>, professionnels de santé et aides à domicile —
              ont besoin d'outils simples pour communiquer avec la famille sans compte complexe.
            </li>
          </ul>

          <p>
            L'application repose sur un front-end <strong>React 19</strong> (Vite 7) communiquant
            via <code>fetch</code> avec un back-end <strong>PHP 8</strong> pur (59 contrôleurs,
            pattern DAO) et une base <strong>SQLite</strong> (10 tables + 6 tables de jonction).
            <br />
            <br />
            Réalisé en équipe de 6 – Team 08 « Aimédia », IUT2 Info, Université Grenoble Alpes (2ᵉ
            année BUT Informatique, SAÉ S3.01).
          </p>
        </section>

        <hr />

        {/* ── 2. FONCTIONNALITÉS ───────────────────────────────────────────── */}
        <section id="features">
          <h2>Fonctionnalités principales</h2>
          <ul>
            <li>
              <strong>Authentification &amp; comptes</strong> — inscription, connexion par session
              PHP, hachage SHA-256 côté client, mot de passe oublié, photo de profil
            </li>
            <li>
              <strong>Gestion des aidés</strong> — ajout / modification / suppression de fiches,
              sélection de l'aidé actif (persisté en cookie), transfert du rôle de responsable,
              invitation d'autres aidants avec validation
            </li>
            <li>
              <strong>Contacts</strong> — CRUD de contacts (médecins, proches, intervenants)
              associés à chaque aidé, liaison aux événements
            </li>
            <li>
              <strong>Agenda</strong> — événements avec date, heure, durée, lieu ; vues mois /
              semaine ; vue mobile dédiée ; tags colorés filtrables ; masquer les événements passés
              / week-ends
            </li>
            <li>
              <strong>Galerie photo</strong> — upload d'images avec statut « en attente » ;
              validation ou rejet par le responsable ; suppression et renommage
            </li>
            <li>
              <strong>Coffre-fort de fichiers</strong> — arborescence hiérarchique de dossiers,
              upload / téléchargement / renommage / suppression, prévisualisation de documents,
              droits d'accès par utilisateur (<code>auth_fichier</code> / <code>auth_dossier</code>)
            </li>
            <li>
              <strong>Notifications</strong> — alertes in-app (création, lecture, suppression)
            </li>
            <li>
              <strong>Accessibilité intégrée</strong> — mode daltonien / contraste élevé, grandes
              polices, mode dyslexie, thème sombre ; réglages persistés en <code>localStorage</code>
            </li>
          </ul>
        </section>

        <hr />

        {/* ── 3. IDENTITÉ VISUELLE & ACCESSIBILITÉ ─────────────────────────── */}
        <section id="design">
          <h2>Identité visuelle &amp; accessibilité</h2>

          <h3>Nom &amp; logo</h3>
          <p>
            Le nom <em>Aidémé</em> est la contraction d'« Aider » et d'« Aimer ». Le logo représente
            des <strong>mains stylisées convergeant vers un cœur central</strong>, avec des lignes
            ouvertes symbolisant que l'aidant n'est pas enfermé dans son rôle. Ce parti pris visuel
            fuit délibérément les clichés hospitaliers (croix, stéthoscope) pour adopter un registre
            chaleureux et familial.
          </p>

          <h3>Psychologie des couleurs</h3>
          <ul>
            <li>
              <strong>Vert Émeraude (#17BFA3)</strong> — confiance et santé ; casse le bleu froid
              des interfaces médicales traditionnelles
            </li>
            <li>
              <strong>Terre Cuite (#CD5334)</strong> — chaleur humaine, foyer, douceur
            </li>
            <li>
              <strong>Beige</strong> — apaisement, cadre familier
            </li>
            <li>
              <strong>Gris Anthracite (#2E282A)</strong> — préféré au noir pur pour reposer les yeux
              lors d'une utilisation prolongée
            </li>
          </ul>

          <h3>Accessibilité (WCAG)</h3>
          <ul>
            <li>
              <strong>Mode daltonien / contraste élevé</strong> — couleurs primaires saturées,
              bordures noires épaisses, classe CSS <code>mode-colorblind</code> sur{' '}
              <code>&lt;body&gt;</code>
            </li>
            <li>
              <strong>Grandes polices</strong> — classe <code>mode-largetext</code> appliquée
              globalement ; tous les éléments héritent de la mise à l'échelle
            </li>
            <li>
              <strong>Mode dyslexie</strong> — police Verdana (espacement de caractères élargi),
              augmentation de l'interligne, fond « coquille d'œuf » <code>#FDFCF0</code> pour
              réduire l'éblouissement ; classe <code>mode-dyslexia</code>
            </li>
            <li>
              <strong>Thème sombre</strong> — toggle complet avec persistance
              <code>localStorage</code>
            </li>
            <li>
              <strong>Responsive</strong> — composant <code>MobileAgendaView</code> dédié ;
              navigation adaptée mobile
            </li>
          </ul>
        </section>

        <hr />

        {/* ── 4. ARCHITECTURE & SÉCURITÉ ───────────────────────────────────── */}
        <section id="techniques">
          <h2>Architecture technique &amp; sécurité</h2>

          <h3>Stack technique</h3>
          <ul>
            <li>
              React 19, React Router 7, hooks (<code>useState</code>, <code>useEffect</code>,{' '}
              <code>useContext</code>), <code>createBrowserRouter</code>
            </li>
            <li>
              Vite 7 — bundling, HMR et proxy <code>/api/*</code> → <code>localhost:8000</code>
            </li>
            <li>
              PHP 8.4 — architecture MVC sans framework, routage via <code>index.php</code>, 59
              contrôleurs REST
            </li>
            <li>
              SQLite 3 via PDO — 16 tables, pattern DAO (9 classes modèle/DAO), singleton{' '}
              <code>DAL.class.php</code>
            </li>
            <li>
              <strong>Note architecturale</strong> : SQLite a été retenu pour la contrainte
              d'hébergement de l'IUT ; l'architecture DAO/PDO est conçue pour migrer vers{' '}
              <strong>PostgreSQL</strong> (gestion avancée des utilisateurs et des accès
              concurrents) sans modifier les couches supérieures
            </li>
            <li>date-fns pour la manipulation des dates dans l'agenda</li>
            <li>Git / GitLab UGA : branches feature, merge requests, CI</li>
          </ul>

          <h3>Sécurité &amp; conformité RGPD</h3>
          <p>
            Les données gérées par Aidémé (informations médicales, documents personnels) entrent
            dans le champ de l'<strong>Article 9 du RGPD</strong> (données sensibles). L'application
            adopte une approche <em>Privacy by Design / by Default</em> :
          </p>
          <ul>
            <li>
              Hachage des mots de passe <strong>SHA-256</strong> côté client avant transmission
            </li>
            <li>
              <strong>RBAC</strong> (Contrôle d'accès basé sur les rôles) : rôle responsable
              (validation des aidants, modération photos, coffre-fort) vs aidant standard
            </li>
            <li>
              Droits d'accès granulaires aux fichiers et dossiers via tables{' '}
              <code>auth_fichier</code> / <code>auth_dossier</code>
            </li>
            <li>
              Sessions PHP avec CORS strict et <code>credentials: &quot;include&quot;</code>
            </li>
            <li>Workflow de validation photos (statut « en attente » → approbation responsable)</li>
            <li>
              Gestion du consentement ; prévu : <em>Age Gating</em> pour les mineurs
            </li>
          </ul>
        </section>

        <hr />

        {/* ── 5. COMPÉTENCES MOBILISÉES ────────────────────────────────────── */}
        <section id="skills">
          <h2>Compétences mobilisées</h2>
          <ul>
            <li>
              Développer des interfaces utilisateur dynamiques et accessibles
              <ul>
                <li>
                  Composer des écrans avec des composants React réutilisables (30+ composants,
                  sous-dossiers par domaine)
                </li>
                <li>
                  Gérer l'état global via <code>AppContext</code> (aidé sélectionné, rôle
                  responsable, préférences d'accessibilité)
                </li>
                <li>Implémenter WCAG : daltonisme, grandes polices, dyslexie, thème sombre</li>
              </ul>
            </li>
            <li>
              Concevoir et consommer une API REST
              <ul>
                <li>Définir 59 routes PHP mappées à des contrôleurs individuels (pattern MVC)</li>
                <li>Appeler l'API via proxy Vite, gérer les sessions et le CORS</li>
              </ul>
            </li>
            <li>
              Organiser un projet en équipe avec des outils de versioning
              <ul>
                <li>Dépôt GitLab UGA : branches feature, merge requests, revues de code</li>
                <li>Pivot méthodologique de « Front / Back séparés » vers Feature-based</li>
              </ul>
            </li>
            <li>
              Modéliser et interroger une base de données relationnelle
              <ul>
                <li>Schéma SQLite de 16 tables + RGPD (Privacy by Design)</li>
                <li>
                  Pattern DAO avec singleton PDO (<code>DAL.class.php</code>)
                </li>
              </ul>
            </li>
          </ul>
        </section>

        <hr />

        {/* ── 6. OBJECTIFS ─────────────────────────────────────────────────── */}
        <section id="objectives">
          <h2>Objectifs</h2>
          <ul>
            <li>Rendre visible le travail invisible des aidants et alléger leur charge mentale</li>
            <li>Fournir un outil centralisé, collaboratif et accessible pour le suivi des aidés</li>
            <li>
              Mettre en pratique le développement full-stack (React + PHP + SQL) en conditions
              réelles
            </li>
            <li>Respecter les contraintes RGPD pour des données médicales sensibles</li>
            <li>
              Garantir l'accessibilité à un public potentiellement peu à l'aise avec le numérique
            </li>
          </ul>
        </section>

        <hr />

        {/* ── 7. GESTION DE PROJET & ÉQUIPE ────────────────────────────────── */}
        <section id="group-work">
          <h2>Gestion de projet &amp; équipe</h2>

          <h3>L'équipe Aimédia</h3>
          <ul>
            <li>
              <strong>Paolo</strong> — Chef de projet, coordination générale
            </li>
            <li>
              <strong>Jérémie</strong> — Responsable Qualité
            </li>
            <li>
              <strong>Simon</strong> — Référent Technique (back-end)
            </li>
            <li>
              <strong>Enzo</strong> — Responsable IHM &amp; accessibilité (front-end)
            </li>
            <li>
              <strong>Macéo</strong> — Communication &amp; Documentation
            </li>
            <li>
              <strong>Noam</strong> — Réseau &amp; Système, déploiement
            </li>
          </ul>

          <h3>Méthodologie &amp; évolution</h3>
          <p>
            Le projet a évolué en trois phases. En <strong>phase 1</strong>, des séances de travail
            nocturnes intensives ont mis en évidence la nécessité d'une meilleure organisation. En{' '}
            <strong>phase 2</strong>, l'équipe a d'abord séparé les développements « Front » et «
            Back », ce qui a généré des frictions d'intégration. En <strong>phase 3</strong>, nous
            avons pivoté vers un développement <em>feature-based</em> (par fonctionnalité complète),
            ce qui a considérablement accéléré la production et amélioré la cohésion de l'équipe.
          </p>
          <p>
            Chaque phase a fait l'objet d'un livrable documenté (cahier des charges, dossier
            ergonomique, dossier technique) évalué par les enseignants.
          </p>
        </section>

        <hr />

        {/* ── 8. TESTS UTILISATEURS ────────────────────────────────────────── */}
        <section id="testing">
          <h2>Tests utilisateurs &amp; validation</h2>
          <p>
            L'application n'a pas seulement été codée : elle a été{' '}
            <strong>testée auprès de 15 utilisateurs</strong> aux profils variés (aidants familiaux,
            professionnels de santé, personnes peu à l'aise avec le numérique).
          </p>
          <ul>
            <li>
              <strong>Tests qualitatifs « Think Aloud »</strong> — les participants verbalisent
              leurs actions et blocages en temps réel, sur des <em>scénarios d'usage</em> définis
              (connexion, ajout d'un contact, upload d'un document)
            </li>
            <li>
              <strong>Méthode SUS</strong> (System Usability Scale) — questionnaire standardisé pour
              mesurer la facilité d'utilisation perçue ; a permis de valider que l'interface restait
              compréhensible pour le persona Bruno (auxiliaire de vie)
            </li>
            <li>
              Les retours ont conduit à plusieurs itérations : simplification du sélecteur d'aidé,
              ajout de messages d'erreur explicites et révision des contrastes de couleurs
            </li>
          </ul>
        </section>

        <hr />

        {/* ── 9. CONTRIBUTIONS PERSONNELLES ────────────────────────────────── */}
        <section id="individual-work">
          <h2>Contributions personnelles</h2>

          <h3>Phase 1 — Recueil des besoins</h3>
          <ul>
            <li>
              Enquête terrain et collecte de données qualitatives auprès d'aidants et de
              professionnels de santé pour identifier les problématiques réelles
            </li>
            <li>Analyse statistique des résultats et synthèse des grands axes d'usage</li>
            <li>
              Création des <strong>personas</strong> (Claire, Antoine, Delphine &amp; Bruno) à
              partir des données recueillies, pour ancrer les décisions de conception dans des
              besoins réels
            </li>
          </ul>

          <h3>Phase 2 — Conception UX &amp; wireframes</h3>
          <ul>
            <li>
              Conception de l'architecture des écrans et production des{' '}
              <strong>wireframes basse et haute fidélité</strong> sur <strong>Whimsical</strong>
            </li>
            <li>
              Définition des parcours utilisateurs (user flows) pour les scénarios critiques :
              connexion, sélection d'un aidé, ajout d'un contact, upload d'un fichier
            </li>
            <li>
              Constat des <strong>limites de Whimsical</strong> lors de cette phase : manque de
              composants réutilisables, gestion des variantes peu ergonomique et collaboration en
              temps réel perfectible. Pour les prochains projets, je souhaite migrer vers{' '}
              <strong>Figma</strong>, plus adapté à la conception d'interfaces complexes
              (composants, auto-layout, design tokens, prototypage avancé)
            </li>
          </ul>

          <h3>Phase 3 — Développement</h3>
          <ul>
            <li>
              <strong>Développement du front-end en très grande partie</strong> : architecture React
              (<code>createBrowserRouter</code>), contexte global <code>AppContext</code>,
              organisation en sous-dossiers par domaine, composants partagés
            </li>
            <li>
              Implémentation des <strong>4 modes d'accessibilité</strong> (daltonien, grandes
              polices, dyslexie, thème sombre) avec persistance <code>localStorage</code>
            </li>
            <li>
              Développement des vues CRUD complètes côté front (contacts, événements, fichiers,
              galerie, agenda)
            </li>
            <li>
              Rôle de <strong>connecteur Front / Back-end</strong> : intégration de l'API PHP via
              proxy Vite, uniformisation des appels <code>fetch</code>, gestion des sessions et des
              erreurs, liaison entre les composants React et les 59 contrôleurs PHP
            </li>
            <li>
              Participation aux tests utilisateurs : rédaction des scénarios et dépouillement des
              résultats SUS
            </li>
            <li>Tests manuels et corrections de bugs avant chaque livraison de phase</li>
          </ul>
        </section>

        <hr />

        {/* ── 10. BILAN CRITIQUE & PERSPECTIVES ───────────────────────────── */}
        <section id="perspectives">
          <h2>Bilan critique &amp; perspectives</h2>

          <h3>Ce que nous ferions différemment</h3>
          <ul>
            <li>
              Intégrer des tests automatisés (Jest, PHPUnit) dès le début pour réduire la dette
              technique
            </li>
            <li>
              Adopter le développement feature-based dès la phase 1 plutôt que de séparer Front /
              Back
            </li>
            <li>
              Prévoir un environnement de staging (Docker) pour simuler les contraintes serveur IUT
              plus tôt
            </li>
          </ul>

          <h3>Roadmap envisagée</h3>
          <ul>
            <li>
              <strong>Déploiement réel</strong> : achat d'un nom de domaine et migration vers un
              serveur avec <strong>PostgreSQL</strong>
            </li>
            <li>
              <strong>Gestionnaire de fichiers</strong> : moteur de recherche full-text et
              glisser-déposer (Drag &amp; Drop)
            </li>
            <li>
              <strong>Dashboard dynamique</strong> : page d'accueil avec les prochains événements,
              les derniers documents ajoutés et les photos récentes
            </li>
            <li>
              <strong>Serveur SMTP</strong> : emails transactionnels pour la réinitialisation de mot
              de passe, les notifications importantes et la vérification parentale
            </li>
            <li>
              <strong>Progressive Web App</strong> : mode hors-ligne pour les aidants en zone rurale
              ou à connectivité limitée
            </li>
          </ul>
        </section>

        <hr />

        {/* ── APERÇU DE L'APPLICATION ──────────────────────────────────────────── */}
        <section id="preview">
          <h2>Aperçu de l&apos;application</h2>
          <div className="aideme-preview">
            <div className="aideme-preview-item--desktop">
              <img
                src="/assets/images/projects/AidemeApplication.png"
                alt="Interface principale d'Aidémé — vue bureau"
                className="zoomable"
              />
              <span className="aideme-preview-caption">Vue bureau — thème clair</span>
            </div>
            <div className="aideme-preview-item--mobile">
              <img
                src="/assets/images/projects/AidemeAppMobileDarkmode.png"
                alt="Interface d'Aidémé — vue mobile en mode sombre"
                className="zoomable"
              />
              <span className="aideme-preview-caption">Vue mobile — thème sombre</span>
            </div>
          </div>
        </section>
      </article>

      <ProjectPagination currentPath="/projet-SAE3.01" />
    </>
  );
};

export default ProjetSAE301;
