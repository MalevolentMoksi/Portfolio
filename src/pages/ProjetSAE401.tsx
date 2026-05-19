import { useRef } from 'react';
import { useTranslation } from 'react-i18next';
import ProjectPagination from '@/components/ProjectPagination';
import useReadingTimeEstimate from '@/hooks/useReadingTimeEstimate';

const ProjetSAE401 = () => {
  const { i18n } = useTranslation();
  const contentRef = useRef<any>(null);
  useReadingTimeEstimate(contentRef);

  if (i18n.resolvedLanguage === 'en') {
    return (
      <>
        <article className="project-article" ref={contentRef}>
          <section id="project-detail">
            <h2>Description</h2>
            <p>
              SAE 4.01 tasked a team of six with improving the quality and performance of an
              existing internship-tracking application. The system comprised an Android mobile
              app for students, a Symfony back-office for administrators, a REST API, and a
              PostgreSQL database hosted on a Debian VM.
            </p>
            <p>
              Rather than rewriting from scratch, the goal was to identify and fix concrete
              defects: ergonomic flaws, security holes, architectural violations, and
              unoptimised queries — while adding a full test suite and Docker containerisation.
            </p>
          </section>

          <hr />

          <section id="skills">
            <h2>Skills Mobilized</h2>
            <ul>
              <li>Develop complex applications (mobile + web + API)</li>
              <li>Optimize an existing application (performance, architecture, security)</li>
              <li>Design and normalize a relational database (3NF)</li>
              <li>Deploy services using containerization (Docker)</li>
              <li>Write functional and end-to-end tests (JUnit, Espresso, PHPUnit, Cypress)</li>
              <li>Apply quality criteria from the SQuaRE (ISO/IEC 25000) standard</li>
            </ul>
          </section>

          <hr />

          <section id="android">
            <h2>Android Client — Improvements</h2>
            <p>
              The mobile front-end was migrated to <strong>Material Design 3</strong> throughout.
              Key changes included:
            </p>
            <ul>
              <li>
                <strong>LoginActivity</strong>: <code>TextInputLayout</code> with inline validation,
                password-toggle, loading indicator, auto-login via <code>SharedPreferences</code>.
              </li>
              <li>
                <strong>ListOffresActivity</strong>: visual check mark for already-viewed offers,
                pagination, empty states, and null-safety on API responses.
              </li>
              <li>
                <strong>CandidatureEditActivity</strong>: <code>AutoCompleteTextView</code> dropdown
                and a <code>DatePickerDialog</code> replacing free-text date input.
              </li>
              <li>
                <strong>Lifecycle</strong>: fixed improper activity stacking by replacing{' '}
                <code>startActivity</code> chains with <code>finish()</code>; added{' '}
                <code>onResume()</code> refreshes throughout.
              </li>
              <li>
                <strong>APIClient</strong>: in-memory GET cache, 60-second timeouts, centralised
                error handling with <code>Snackbar</code> + retry.
              </li>
              <li>
                <strong>Dark mode</strong>: dedicated <code>values-night/</code> palette,
                <code>fitsSystemWindows</code> applied to all layouts.
              </li>
            </ul>
            <h3>Android Tests</h3>
            <ul>
              <li>
                <strong>Espresso</strong> (8 scenarios): LoginActivity, ListOffres, Candidature,
                MainActivity, navigation flows.
              </li>
              <li>
                <strong>JUnit</strong>: CandidatureUnitTest, EnumsUnitTest,
                EtatsCandidaturesUnitTest — covering ID extraction, URI generation, status mapping.
              </li>
            </ul>
          </section>

          <hr />

          <section id="symfony">
            <h2>Symfony Back-Office — Improvements</h2>
            <h3>Architecture &amp; Security</h3>
            <ul>
              <li>
                Controllers outside <code>/admin</code> prefix were exposed to unauthenticated
                requests — fixed with explicit ROLE_ADMIN rules in <code>security.yaml</code>.
              </li>
              <li>
                Students could access the back-office web login — blocked by role check in{' '}
                <code>LoginFormAuthenticator</code>.
              </li>
              <li>
                API entities lacked serialisation groups — added normalisation contexts on{' '}
                <code>EtatCandidature</code>, <code>EtatOffre</code>, <code>EtatRecherche</code>.
              </li>
              <li>
                Rate limiting added: 5 login attempts / 15 min on both <code>api</code> and{' '}
                <code>main</code> firewalls.
              </li>
              <li>
                Dashboard logic extracted from controllers into a dedicated{' '}
                <code>TableauDeBordService</code>.
              </li>
            </ul>
            <h3>Performance</h3>
            <p>
              The dashboard previously called <code>offreRepository-&gt;findAll()</code> —
              loading every offer into memory per page view. Replaced by{' '}
              <code>findForDashboard(int $limit = 100)</code> with Doctrine{' '}
              <code>setMaxResults</code> and <code>orderBy('dateDepot', 'DESC')</code>.
            </p>
            <h3>Regex Import</h3>
            <p>
              A file-upload feature was added to the offer creation form, parsing{' '}
              <code>.txt</code> or <code>.csv</code> files with <code>preg_match_all</code>{' '}
              (multiline flag) to extract fields (title, company, location, duration, description)
              and pre-fill the form before manual validation.
            </p>
            <h3>UI / UX</h3>
            <ul>
              <li>Full CSS redesign (~800+ lines in <code>public/css/app-stages.css</code>).</li>
              <li>
                Restructured navbar with dropdown, Bootstrap Icons, clickable table rows, accessibility
                tooltips.
              </li>
              <li>
                <strong>Chart.js</strong> pie chart per student: Candidatures / Retained / Viewed /
                Not viewed.
              </li>
              <li>Custom 403/404/500 error pages, confirmation modals before deletion.</li>
            </ul>
            <h3>Symfony Tests</h3>
            <ul>
              <li>
                <strong>PHPUnit</strong> (5 suites, 1 600+ lines): TableauDeBordService,
                FilterCompteEtudiantQueryExtension, CompteEtudiant, Etudiant,
                LoginFormAuthenticator.
              </li>
              <li>
                <strong>Cypress E2E</strong> (5 scenarios): login, navigation, CRUD offers, account
                management, dashboard.
              </li>
              <li>User testing (Think Aloud, 4 participants): <strong>SUS score 82/100</strong>.</li>
            </ul>
          </section>

          <hr />

          <section id="database">
            <h2>Database — Normalization to 3NF</h2>
            <p>
              The original schema violated the first normal form (non-atomic JSON columns) and
              contained unstable natural keys. The revised schema:
            </p>
            <ul>
              <li>
                Merged <code>offre_consultee</code> + <code>offre_retenue</code> into a single{' '}
                <code>suivi_offre</code> table with two boolean flags.
              </li>
              <li>
                Extracted offer keywords into <code>offre_mot_cle(#id_offre, mot_cle)</code>.
              </li>
              <li>
                Replaced the JSON <code>roles</code> column with a boolean <code>est_admin</code>.
              </li>
              <li>
                Introduced a surrogate key <code>id_entreprise</code> to stabilize the company
                foreign key.
              </li>
              <li>
                Added <code>date_action</code> to the <code>candidature</code> primary key to allow
                multiple actions on the same offer.
              </li>
            </ul>
          </section>

          <hr />

          <section id="docker">
            <h2>Containerization (Docker)</h2>
            <p>
              The application was containerised with two images: <code>php:cli</code> (extended with
              Symfony CLI, Composer, intl/pgsql extensions, Xdebug) and the official{' '}
              <code>postgres</code> image. Containers communicate over a dedicated Docker network;
              the database persists via a named volume. The Symfony container mounts the source
              directory and starts with <code>symfony server:start --no-tls --allow-all-ip</code>.
            </p>
          </section>

          <hr />

          <section id="group-work">
            <h2>Team Organization</h2>
            <p>
              The six-person team split into two sub-groups: one focused on the Android client
              (Enzo Morello, Adéline Chaboud, Alexis Le Guennec), the other on the Symfony
              back-office and infrastructure (Thomas Joseph, Lucas Langlois, Rayane Tbatou).
              Daily end-of-day syncs and a shared messaging channel with per-team channels
              ensured continuous alignment between the two parts of the codebase.
            </p>
          </section>

          <hr />

          <section id="individual-work">
            <h2>Personal Contributions</h2>
            <ul>
              <li>Android UI migration to Material Design 3 (layouts, Chips, Snackbar, dark mode)</li>
              <li>
                Lifecycle refactoring: <code>StageAppActivity</code> base class, <code>finish()</code>{' '}
                back-stack corrections, <code>onResume()</code> data refresh
              </li>
              <li>
                APIClient improvements: in-memory cache, timeout tuning, centralised error handling
              </li>
              <li>Espresso instrumentation tests and JUnit unit tests</li>
              <li>Contribution to the report: Android section, process specification, glossary</li>
            </ul>
          </section>
        </article>

        <ProjectPagination currentPath="/projet-SAE401" />
      </>
    );
  }

  return (
    <>
      <article className="project-article" ref={contentRef}>
        <section id="project-detail">
          <h2>Description</h2>
          <p>
            La SAE 4.01 consistait à améliorer la qualité et les performances d'une application
            existante de recherche de stage, en équipe de six. Le système comprenait une application
            mobile Android pour les étudiants, un back-office Symfony pour les administrateurs, une
            API REST, et une base de données PostgreSQL hébergée sur une VM Debian.
          </p>
          <p>
            L'objectif n'était pas de tout réécrire, mais de cibler des défauts concrets : défauts
            ergonomiques, failles de sécurité, violations architecturales et requêtes non optimisées
            — tout en ajoutant une suite de tests complète et une conteneurisation Docker.
          </p>
        </section>

        <hr />

        <section id="skills">
          <h2>Compétences mobilisées</h2>
          <ul>
            <li>Développer des applications complexes (mobile + web + API)</li>
            <li>Optimiser une application existante (performances, architecture, sécurité)</li>
            <li>Concevoir et normaliser une base de données relationnelle (3FN)</li>
            <li>Déployer des services par conteneurisation (Docker)</li>
            <li>Rédiger des tests fonctionnels et E2E (JUnit, Espresso, PHPUnit, Cypress)</li>
            <li>Appliquer les critères qualité de la norme SQuaRE (ISO/CEI 25000)</li>
          </ul>
        </section>

        <hr />

        <section id="android">
          <h2>Client Android — Améliorations</h2>
          <p>
            L'interface mobile a été entièrement migrée vers <strong>Material Design 3</strong>.
            Principaux changements :
          </p>
          <ul>
            <li>
              <strong>LoginActivity</strong> : <code>TextInputLayout</code> avec validation inline,
              toggle mot de passe, indicateur de chargement, auto-login via{' '}
              <code>SharedPreferences</code>.
            </li>
            <li>
              <strong>ListOffresActivity</strong> : indicateur visuel (coche + couleur) pour les
              offres déjà consultées, pagination, empty states, protection contre les valeurs nulles.
            </li>
            <li>
              <strong>CandidatureEditActivity</strong> : dropdown <code>AutoCompleteTextView</code>{' '}
              et <code>DatePickerDialog</code> natif à la place de la saisie libre de date.
            </li>
            <li>
              <strong>Cycle de vie</strong> : correction de l'empilement d'activités en remplaçant
              les chaînes <code>startActivity</code> par <code>finish()</code> ; ajout de{' '}
              <code>onResume()</code> pour le rafraîchissement systématique des données.
            </li>
            <li>
              <strong>APIClient</strong> : cache mémoire des requêtes GET, timeouts à 60 s, gestion
              centralisée des erreurs réseau avec <code>Snackbar</code> + bouton « Réessayer ».
            </li>
            <li>
              <strong>Mode sombre</strong> : palette dédiée <code>values-night/</code>,{' '}
              <code>fitsSystemWindows</code> appliqué sur tous les layouts.
            </li>
          </ul>
          <h3>Tests Android</h3>
          <ul>
            <li>
              <strong>Espresso</strong> (8 scénarios) : LoginActivity, ListOffres, Candidature,
              MainActivity, navigation intra-application.
            </li>
            <li>
              <strong>JUnit</strong> : CandidatureUnitTest, EnumsUnitTest,
              EtatsCandidaturesUnitTest — extraction d'IDs, génération d'URIs, mapping d'états.
            </li>
          </ul>
        </section>

        <hr />

        <section id="symfony">
          <h2>Back-Office Symfony — Améliorations</h2>
          <h3>Architecture &amp; Sécurité</h3>
          <ul>
            <li>
              Contrôleurs hors préfixe <code>/admin</code> exposés sans contrôle — corrigés par
              des règles ROLE_ADMIN explicites dans <code>security.yaml</code>.
            </li>
            <li>
              Les étudiants pouvaient accéder à la connexion web du back-office — bloqué par une
              vérification de rôle dans <code>LoginFormAuthenticator</code>.
            </li>
            <li>
              Groupes de sérialisation manquants sur les entités <code>EtatCandidature</code>,{' '}
              <code>EtatOffre</code>, <code>EtatRecherche</code> — ajoutés avec les contextes API
              Platform.
            </li>
            <li>
              Rate limiting ajouté : 5 tentatives / 15 min sur les firewalls <code>api</code> et{' '}
              <code>main</code>.
            </li>
            <li>
              Logique métier du tableau de bord extraite des contrôleurs vers un{' '}
              <code>TableauDeBordService</code> dédié.
            </li>
          </ul>
          <h3>Optimisation</h3>
          <p>
            Le tableau de bord appelait <code>offreRepository-&gt;findAll()</code> — chargeant
            toutes les offres en mémoire à chaque accès. Remplacé par{' '}
            <code>findForDashboard(int $limit = 100)</code> avec Doctrine{' '}
            <code>setMaxResults</code> et <code>orderBy('dateDepot', 'DESC')</code>.
          </p>
          <h3>Import par expressions régulières</h3>
          <p>
            Un bouton d'import a été ajouté au formulaire de création d'offre. Il parse des
            fichiers <code>.txt</code> ou <code>.csv</code> avec <code>preg_match_all</code> (flag
            multilignes) pour extraire les champs (titre, entreprise, lieu, durée, descriptif) et
            pré-remplir automatiquement le formulaire avant validation manuelle.
          </p>
          <h3>IHM &amp; Ergonomie</h3>
          <ul>
            <li>
              Refonte CSS complète (~800+ lignes dans <code>public/css/app-stages.css</code>).
            </li>
            <li>
              Navbar restructurée avec menu déroulant « Interfaces CRUD », icônes Bootstrap Icons,
              lignes de tableau cliquables, tooltips d'accessibilité.
            </li>
            <li>
              Graphique camembert <strong>Chart.js</strong> par étudiant : Candidatures / Retenues
              / Consultées / Pas consultées.
            </li>
            <li>Pages d'erreur 403/404/500 personnalisées, modals de confirmation avant suppression.</li>
          </ul>
          <h3>Tests Symfony</h3>
          <ul>
            <li>
              <strong>PHPUnit</strong> (5 suites, 1 600+ lignes) : TableauDeBordService,
              FilterCompteEtudiantQueryExtension, CompteEtudiant, Etudiant,
              LoginFormAuthenticator.
            </li>
            <li>
              <strong>Cypress E2E</strong> (5 scénarios) : connexion, navigation, CRUD offres,
              gestion des comptes, tableau de bord.
            </li>
            <li>
              Tests utilisateurs (Think Aloud, 4 participants) :{' '}
              <strong>score SUS de 82/100</strong>.
            </li>
          </ul>
        </section>

        <hr />

        <section id="database">
          <h2>Base de données — Normalisation en 3FN</h2>
          <p>
            Le schéma original violait la première forme normale (colonnes JSON non atomiques) et
            utilisait des clés naturelles instables. Le schéma révisé :
          </p>
          <ul>
            <li>
              Fusionne <code>offre_consultee</code> et <code>offre_retenue</code> en une table{' '}
              <code>suivi_offre</code> avec deux booléens.
            </li>
            <li>
              Extrait les mots-clés des offres dans <code>offre_mot_cle(#id_offre, mot_cle)</code>.
            </li>
            <li>
              Remplace la colonne JSON <code>roles</code> par un booléen <code>est_admin</code>.
            </li>
            <li>
              Introduit une clé de substitution <code>id_entreprise</code> pour stabiliser la clé
              étrangère entreprise.
            </li>
            <li>
              Ajoute <code>date_action</code> dans la clé primaire de <code>candidature</code> pour
              autoriser plusieurs actions sur la même offre.
            </li>
          </ul>
        </section>

        <hr />

        <section id="docker">
          <h2>Conteneurisation (Docker)</h2>
          <p>
            L'application a été conteneurisée avec deux images : <code>php:cli</code> (enrichie
            avec Symfony CLI, Composer, extensions intl/pgsql, Xdebug) et l'image officielle{' '}
            <code>postgres</code>. Les conteneurs communiquent via un réseau Docker dédié ; la base
            de données persiste grâce à un volume nommé. Le conteneur Symfony monte le répertoire
            source et démarre avec{' '}
            <code>symfony server:start --no-tls --allow-all-ip</code>.
          </p>
        </section>

        <hr />

        <section id="group-work">
          <h2>Organisation de l'équipe</h2>
          <p>
            L'équipe de six membres s'est divisée en deux sous-groupes : l'un dédié au client
            Android (Enzo Morello, Adéline Chaboud, Alexis Le Guennec), l'autre au back-office
            Symfony et à l'infrastructure (Thomas Joseph, Lucas Langlois, Rayane Tbatou). Des
            bilans quotidiens en fin de journée et un groupe de discussion structuré par canal ont
            assuré la cohérence entre les deux parties du code.
          </p>
        </section>

        <hr />

        <section id="individual-work">
          <h2>Contributions personnelles</h2>
          <ul>
            <li>Migration de l'IHM Android vers Material Design 3 (layouts, Chips, Snackbar, mode sombre)</li>
            <li>
              Refactoring du cycle de vie : classe de base <code>StageAppActivity</code>, corrections
              du back-stack avec <code>finish()</code>, rafraîchissement <code>onResume()</code>
            </li>
            <li>
              Améliorations de l'APIClient : cache mémoire, réglage des timeouts, gestion centralisée
              des erreurs
            </li>
            <li>Tests d'instrumentation Espresso et tests unitaires JUnit</li>
            <li>Rédaction du rapport : section Android, spécification du processus, glossaire</li>
          </ul>
        </section>
      </article>

      <ProjectPagination currentPath="/projet-SAE401" />
    </>
  );
};

export default ProjetSAE401;
