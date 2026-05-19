import { useRef } from 'react';
import { useTranslation } from 'react-i18next';
import ProjectPagination from '@/components/ProjectPagination';
import useReadingTimeEstimate from '@/hooks/useReadingTimeEstimate';
import { getAssetPath } from '@/utils/assetPath';

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
              unoptimised queries, while adding a full test suite and Docker containerisation.
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

          <section id="process">
            <h2>Process Specification</h2>
            <h3>Student Workflow (Android)</h3>
            <p>
              Students authenticate using credentials created by the administrator, then browse
              available offers, bookmark those of interest, submit applications, and track their
              status through to final acceptance.
            </p>
            <h3>Administrator Workflow (Symfony)</h3>
            <p>
              Administrators manage student accounts, companies, and offers through the
              back-office. A dashboard gives a consolidated view of all students' search
              progress in real time.
            </p>
            <h3>Team Organisation</h3>
            <p>
              The team split into two sub-groups: Android (Enzo Morello, Adéline Chaboud, Alexis
              Le Guennec) and Symfony + infrastructure (Thomas Joseph, Lucas Langlois, Rayane
              Tbatou). Daily end-of-day syncs and a shared multi-channel discussion group kept
              both sub-groups aligned.
            </p>
            <p>
              Mid-project, following imbalances in workload distribution, I took on a secondary
              project lead role to coordinate work across both groups and keep the deliverables
              on track. My overall contribution being slightly higher than my teammates' earned
              me a few extra points on the final individual score distribution.
            </p>
          </section>

          <hr />

          <section id="android">
            <h2>Android Client: Improvements</h2>
            <p>
              The mobile front-end was migrated to <strong>Material Design 3</strong> throughout.
            </p>

            <h3>(1) Activity-level Changes</h3>

            <h4>LoginActivity</h4>
            <ul>
              <li>Replaced <code>EditText</code> with <code>TextInputLayout</code> / <code>TextInputEditText</code></li>
              <li>Password toggle (<code>passwordToggleEnabled</code>), inline <code>TextWatcher</code> error reset</li>
              <li>Loading indicator during authentication; auto-login via <code>SharedPreferences</code></li>
              <li>All data pre-loaded before opening <code>MainActivity</code></li>
            </ul>

            <h4>MainActivity</h4>
            <ul>
              <li>Static views replaced by clickable <code>MaterialCardView</code> with ripple effect</li>
              <li>Automatic refresh in <code>onResume()</code>; last-login date displayed</li>
              <li>Logout button added; lifecycle corrected with <code>finish()</code></li>
            </ul>

            <h4>ListOffresActivity</h4>
            <ul>
              <li>Author and offer status shown in the list</li>
              <li>Visual check mark + colour change for already-viewed offers</li>
              <li>Pagination, empty states, null-safety on API responses</li>
              <li>Refresh via <code>onResume()</code> on return from <code>OffreActivity</code></li>
            </ul>

            <h4>OffreActivity</h4>
            <ul>
              <li>Automatic POST on open to mark the offer as viewed</li>
              <li>Button state driven by candidature status; colour selectors per state</li>
              <li>Explicit error messages</li>
            </ul>

            <h4>CandidatureActivity</h4>
            <ul>
              <li>Contextual explanatory message when status is "Offre retenue"</li>
              <li>Error messages and JavaDoc comments added; refresh via <code>onResume()</code></li>
            </ul>

            <h4>CandidatureEditActivity</h4>
            <ul>
              <li><code>Spinner</code> replaced by <code>AutoCompleteTextView</code> (Exposed Dropdown)</li>
              <li><code>DatePickerDialog</code> replaces free-text date input</li>
              <li>Date of last state change recorded; UTC timezone conversion handled</li>
              <li>Confirmation dialog before candidature deletion</li>
            </ul>

            <h4>ListCandidaturesActivity</h4>
            <ul>
              <li>Status displayed directly in the list; filter by status</li>
              <li>Colour-coded labels for each status; refresh via <code>onResume()</code></li>
            </ul>

            <h3>(2) API Layer Changes (<code>api/</code>)</h3>
            <h4>APIClient</h4>
            <ul>
              <li>In-memory GET cache to avoid redundant network calls</li>
              <li>Data pre-loaded at login; 60-second connection/read timeouts (OkHttpClient)</li>
              <li>POST endpoint added for viewed offers</li>
              <li>Centralised error handling in <code>StageAppActivity.traiterErreur(Throwable)</code> with Snackbar + retry</li>
            </ul>
            <h4>APIService / New Entities</h4>
            <ul>
              <li>New endpoint: <code>POST /offres-consultees</code></li>
              <li>New class: <code>OffreConsulteeRequest</code></li>
            </ul>

            <h3>Code Reverse Engineering</h3>
            <p>
              The app follows an Android-adapted MVC pattern: XML layouts (views), Activity
              classes (controllers), and Java entity classes mirroring JSON structures (models).
              State transitions are secured by enumerations (<code>EtatCandidatureEnum</code>,
              etc.).
            </p>

            <h3>Architecture Revision</h3>
            <p>
              A common base class <code>StageAppActivity</code> was introduced to centralise
              network error handling, <code>onRetry()</code> hooks, and logout logic. Navigation
              chains using <code>startActivity</code> were replaced with <code>finish()</code> to
              respect the back stack. <code>onResume()</code> is now systematically implemented
              for data freshness. Hard-coded IDs were replaced by <code>EtatCandidatureEnum</code>.
            </p>

            <h3>IHM and Ergonomics</h3>
            <ul>
              <li>Custom action bars with uniform back icon (<code>ic_back</code>) replacing the native ActionBar</li>
              <li>Material Design 3 throughout: <code>MaterialCardView</code>, Chips, <code>TextInputLayout</code>, <code>AutoCompleteTextView</code></li>
              <li>Snackbars replace Toasts; confirmation dialogs before deletion; empty states</li>
              <li>Progress bars in <code>LoginActivity</code> and <code>MainActivity</code></li>
              <li>Dark mode via dedicated <code>values-night/</code> palette; <code>fitsSystemWindows</code> applied everywhere</li>
            </ul>

            <h3>Android Tests</h3>
            <ul>
              <li>
                <strong>Espresso</strong> (8 scenarios):{' '}
                <code>LoginActivityTest</code>, <code>MainActivityTest</code>,{' '}
                <code>MainNavigationTest</code>, <code>ListOffresActivityTest</code>,{' '}
                <code>CandidatureActivityTest</code>, <code>CandidatureEditActivityTest</code>,{' '}
                <code>ListCandidaturesActivityTest</code>, <code>OffreActivityTest</code>
              </li>
              <li>
                <strong>JUnit</strong> (3 suites): <code>CandidatureUnitTest</code> (ID
                extraction, URI generation, status mapping), <code>EnumsUnitTest</code>,{' '}
                <code>EtatsCandidaturesUnitTest</code>
              </li>
            </ul>

            <h3>Android Optimisations</h3>
            <ul>
              <li>GET cache in <code>APIClient</code>: already-fetched responses not re-fetched</li>
              <li>All data loaded before <code>MainActivity</code> opens</li>
              <li>Correct back stack with <code>finish()</code> avoids activity accumulation</li>
              <li><code>CandidatureAdapter</code>: ViewHolder pattern for list recycling</li>
              <li>Network timeout tuned to avoid false failures on slow connections</li>
            </ul>
          </section>

          <hr />

          <section id="symfony">
            <h2>Symfony Back-Office: Improvements</h2>

            <h3>Reverse Engineering</h3>
            <p>The application is structured around five distinct layers:</p>
            <ul>
              <li><strong>Controllers</strong>: classic CRUD for core entities (Students, Companies, Offers, Applications) + state tracking + dashboard aggregation</li>
              <li><strong>Entities / Repositories</strong>: PHP 8 attributes, <code>#[ApiResource]</code>, <code>UniqueEntity</code> constraints; repositories include custom DQL queries</li>
              <li><strong>API &amp; Security</strong>: <code>FilterCompteEtudiantQueryExtension</code> ensures a student never accesses another student's data; hybrid authentication (session + JWT prep)</li>
              <li><strong>Forms</strong>: <code>FormType</code> classes with HTML5 widgets, decoupled from API logic</li>
              <li><strong>Quality</strong>: 1 600+ lines of PHPUnit + Cypress E2E; SUS score 82/100</li>
            </ul>

            <h3>Architecture and Security: Problems Found and Fixed</h3>
            <ul>
              <li>
                <strong>Controllers outside <code>/admin</code> prefix</strong>:{' '}
                <code>CandidatureController</code>, <code>OffreConsulteeController</code>,{' '}
                <code>OffreRetenueController</code> were accessible without authentication.
                Fixed with explicit rules in <code>security.yaml</code>.
              </li>
              <li>
                <strong>Incomplete API rules</strong>: candidature, offre_consultee and
                offre_retenue entities not covered by POST/DELETE/PUT/PATCH access controls;
                any authenticated user could modify them.
              </li>
              <li>
                <strong>Students in back-office</strong>: <code>LoginFormAuthenticator</code>
                had no role check; students could access the admin interface. Fixed with
                ROLE_ADMIN gate and error redirect.
              </li>
              <li>
                <strong>No rate limiting</strong>: <code>login_throttling</code> added (5 attempts /
                15 min) on both <code>api</code> and <code>main</code> firewalls;{' '}
                <code>symfony/rate-limiter</code> dependency added.
              </li>
              <li>
                <strong>Missing serialisation groups</strong>: <code>EtatCandidature</code>,{' '}
                <code>EtatOffre</code>, <code>EtatRecherche</code> had no normalisation
                contexts on their API Platform resources. Groups added; <code>CompteEtudiant</code>{' '}
                and <code>Candidature</code>/<code>Entreprise</code> corrected.
              </li>
              <li>
                <strong>Dashboard logic in controllers</strong>: extracted to a dedicated{' '}
                <code>TableauDeBordService</code> for better separation of concerns.
              </li>
            </ul>

            <h3>Regular Expressions — Offer Import</h3>
            <p>
              File: <code>src/Data/ImportOffresController.php</code>
            </p>
            <ul>
              <li>
                TXT parsing: <code>preg_match_all('/(Titre:\s*.+?)(?=Titre:|$)/s', ...)</code>{' '}
                splits the file into blocks on each <code>Titre:</code> keyword (multiline flag <code>s</code>)
              </li>
              <li>
                Per-field extraction:{' '}
                <code>preg_match('/Titre:\s*(.+?)(?=\s+\w+:|$)/i', ...)</code> captures up
                to the next label or end of block
              </li>
              <li>CSV support via <code>str_getcsv</code> + header mapping</li>
              <li>Auto-lookup or creation of <code>EtatOffre</code> and <code>Entreprise</code> if missing</li>
              <li>Form pre-filled with parsed data before manual validation</li>
            </ul>

            <h3>IHM &amp; Web Ergonomics</h3>
            <ul>
              <li>New CSS file <code>public/css/app-stages.css</code> (~800+ lines)</li>
              <li>Restructured navbar with "Interfaces CRUD" dropdown and Bootstrap Icons per entity</li>
              <li>Index pages: clickable rows, visual sorting, accessibility tooltips, standardised terminology</li>
              <li>Edit pages: Back + Delete bar moved to top of form (no scroll needed)</li>
              <li>Show pages: uniform breadcrumb, enriched offer status and viewed/saved pages</li>
              <li>New pages: shared layout <code>templates/Admin/new_layout.html.twig</code></li>
              <li>Confirmation modal before deletion; custom 403/404/500 error pages</li>
              <li>
                <strong>Dashboard</strong>: Chart.js pie chart per student (Candidatures /
                Retained / Viewed / Not viewed); KPI cards with harmonised status colours
              </li>
            </ul>

            <h3>Performance Optimisation</h3>
            <p>
              <strong>Problem</strong>: <code>TableauDeBordController::getOffreByCompte()</code>{' '}
              called <code>offreRepository-&gt;findAll()</code>, loading every offer into memory
              on each dashboard access.
            </p>
            <p>
              <strong>Fix</strong>: replaced by <code>findForDashboard(int $limit = 100)</code>{' '}
              in <code>src/Repository/OffreRepository.php</code>: Doctrine query with{' '}
              <code>setMaxResults(100)</code> and <code>orderBy('dateDepot', 'DESC')</code>.
              Added <code>isset()</code> guards to prevent PHP errors on out-of-range indices.
            </p>

            <h3>Symfony Tests</h3>
            <p>
              <strong>PHPUnit</strong> (5 suites, 1 600+ lines):
            </p>
            <ul>
              <li><code>TableauDeBordServiceTest</code>: status priority (Application &gt; Retained &gt; Viewed &gt; Not viewed), multi-offer cases, inactive offers ignored</li>
              <li><code>FilterCompteEtudiantQueryExtensionTest</code>: admin without filter, filtering by student/account ID, unmanaged resource, non-CompteEtudiant user</li>
              <li><code>CompteEtudiantTest</code>: <code>getRoles()</code> always includes ROLE_USER, no duplicates, bidirectional collection consistency</li>
              <li><code>EtudiantTest</code>: <code>__toString()</code>, initial null ID, setters/getters</li>
              <li><code>LoginFormAuthenticatorTest</code>: admin accepted, non-admin rejected with message, login URL, <code>LOGIN_ROUTE</code> constant</li>
            </ul>
            <p>
              <strong>Cypress E2E</strong> (5 scenarios):{' '}
              <code>connexion.cy.js</code>, <code>navigation.cy.js</code>,{' '}
              <code>offres.cy.js</code>, <code>comptes_etudiants.cy.js</code>,{' '}
              <code>tableau_de_bord.cy.js</code>
            </p>
            <p>
              <strong>User testing</strong> (Think Aloud, 4 participants):{' '}
              <strong>SUS score 82/100</strong>
            </p>

            <h3>Containerisation (Docker)</h3>
            <ul>
              <li>
                <strong>Images</strong>: <code>php:cli</code> (extended with Symfony CLI,
                Composer, <code>intl</code>/<code>pgsql</code>/<code>pdo_pgsql</code> extensions,
                Xdebug) and the official <code>postgres</code> image
              </li>
              <li>10 layers in the Symfony image (1 FROM, 8 RUN, 1 WORKDIR); apt-get steps merged into one RUN + cache cleanup</li>
              <li>Containers communicate over a dedicated Docker network; database persists via a named volume</li>
              <li>
                Symfony container mounts the source directory and starts with{' '}
                <code>symfony server:start --no-tls --allow-all-ip</code>; port 8000 published
              </li>
              <li>
                <code>DATABASE_URL</code> and <code>POSTGRES_PASSWORD</code> injected at
                runtime via <code>-e</code> for immediate portability on any machine
              </li>
            </ul>
          </section>

          <hr />

          <section id="database">
            <h2>Database: Normalization to 3NF</h2>
            <p>The original schema violated 1NF (non-atomic JSON columns) and used unstable natural keys. Key changes:</p>
            <ul>
              <li>
                <code>offre_consultee</code> + <code>offre_retenue</code> merged into{' '}
                <code>suivi_offre(#numero_ine, #id_offre, est_consultee, est_retenue)</code>
              </li>
              <li>
                Offer keywords extracted to{' '}
                <code>offre_mot_cle(#id_offre, mot_cle)</code> — 1NF compliant
              </li>
              <li>
                JSON <code>roles</code> column replaced by boolean <code>est_admin</code>
              </li>
              <li>
                Surrogate key <code>id_entreprise</code> introduced (raison_sociale is unstable
                as a foreign key)
              </li>
              <li>
                <code>date_action</code> added to the <code>candidature</code> primary key to
                allow multiple actions on the same offer
              </li>
            </ul>
            <h3>Improved Relational Schema (3NF)</h3>
            <pre>
{`etudiant       (numero_ine, nom, prenom, email, #id_compte)
compte         (id_compte, login, password, parcours, derniere_connexion, est_admin, #etat_recherche)
entreprise     (id_entreprise, raison_sociale, ville, pays)
offre          (id_offre, intitule, descriptif, date_depot, parcours,
                url_piece_jointe, #id_entreprise, #etat_offre)
offre_mot_cle  (#id_offre, mot_cle)
suivi_offre    (#numero_ine, #id_offre, est_consultee, est_retenue)
candidature    (#numero_ine, #id_offre, date_action, type_action, #etat_candidature)
etat_candidature (etat, descriptif)
etat_offre       (etat, descriptif)
etat_recherche   (etat, descriptif)`}
            </pre>
          </section>

          <hr />

          <section id="individual-work">
            <h2>Personal Contributions</h2>
            <ul>
              <li>Android UI migration to Material Design 3 (all layouts, Chips, Snackbar, dark mode)</li>
              <li>
                Lifecycle refactoring: <code>StageAppActivity</code> base class,{' '}
                <code>finish()</code> back-stack corrections, systematic <code>onResume()</code>
              </li>
              <li>APIClient: in-memory GET cache, timeout tuning, centralised error handling with Snackbar + retry</li>
              <li>Espresso instrumentation tests (8 scenarios) and JUnit unit tests (3 suites)</li>
              <li>Report: Android section, process specification, glossary</li>
            </ul>
          </section>

          <hr />

          <section id="demo">
            <h2>Visual Demonstration</h2>
            <div className="project-demo">
              <figure>
                <img
                  src={getAssetPath('/assets/images/projects/SAE401AvantApresMobile.png')}
                  alt="Mobile redesign: before and after"
                  loading="lazy"
                  width="1200"
                  height="600"
                />
                <figcaption>Mobile interface: before and after the Material Design 3 redesign</figcaption>
              </figure>
              <div className="project-demo-row">
                <figure>
                  <img
                    src={getAssetPath('/assets/images/projects/SAE401AvantBackOffice.png')}
                    alt="Back-office before redesign"
                    loading="lazy"
                    width="800"
                    height="500"
                  />
                  <figcaption>Back-office before redesign</figcaption>
                </figure>
                <figure>
                  <img
                    src={getAssetPath('/assets/images/projects/SAE401ApresBackOffice.png')}
                    alt="Back-office after redesign"
                    loading="lazy"
                    width="800"
                    height="500"
                  />
                  <figcaption>Back-office after redesign</figcaption>
                </figure>
              </div>
            </div>
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
            ergonomiques, failles de sécurité, violations architecturales et requêtes non optimisées,
            tout en ajoutant une suite de tests complète et une conteneurisation Docker.
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

        <section id="process">
          <h2>Spécification du processus</h2>
          <h3>Processus étudiant (Android)</h3>
          <p>
            L'étudiant se connecte avec des identifiants créés par l'administrateur, consulte les
            offres disponibles, les retient ou y candidate, suit ses candidatures jusqu'à
            l'acceptation définitive.
          </p>
          <h3>Processus administrateur (Symfony)</h3>
          <p>
            L'administrateur gère les comptes étudiants, les entreprises et les offres via le
            back-office. Un tableau de bord consolidé permet de visualiser l'avancement de
            chaque étudiant en temps réel.
          </p>
          <h3>Répartition des tâches</h3>
          <p>
            L'équipe s'est divisée en deux sous-groupes : Android (Enzo Morello, Adéline Chaboud,
            Alexis Le Guennec) et Symfony + infrastructure (Thomas Joseph, Lucas Langlois, Rayane
            Tbatou). Des bilans quotidiens et un groupe de discussion structuré par canal ont
            assuré la cohérence entre les deux parties du code.
          </p>
          <p>
            En cours de projet, face à des déséquilibres dans la répartition du travail, j'ai
            endossé un rôle de Chef de projet secondaire pour coordonner les deux groupes et
            maintenir la progression des livrables. Ma contribution globale légèrement supérieure
            à celle de mes camarades m'a permis d'obtenir quelques points de plus sur la
            distribution individuelle finale.
          </p>
        </section>

        <hr />

        <section id="android">
          <h2>Client Android : Améliorations</h2>
          <p>
            L'interface mobile a été entièrement migrée vers <strong>Material Design 3</strong>.
          </p>

          <h3>(1) Modifications aux Activités</h3>

          <h4>LoginActivity</h4>
          <ul>
            <li>Remplacement des <code>EditText</code> par des <code>TextInputLayout</code> / <code>TextInputEditText</code></li>
            <li>Toggle mot de passe, validation inline via <code>TextWatcher</code>, indicateur de chargement</li>
            <li>Auto-login via <code>SharedPreferences</code> ; pré-chargement des données avant <code>MainActivity</code></li>
          </ul>

          <h4>MainActivity</h4>
          <ul>
            <li>Vues statiques remplacées par des <code>MaterialCardView</code> cliquables avec ripple</li>
            <li>Rafraîchissement automatique dans <code>onResume()</code> ; affichage de la dernière connexion</li>
            <li>Bouton de déconnexion ; cycle de vie corrigé avec <code>finish()</code></li>
          </ul>

          <h4>ListOffresActivity</h4>
          <ul>
            <li>Auteur et état des offres affichés dans la liste</li>
            <li>Indicateur visuel (coche + changement de couleur) pour les offres déjà consultées</li>
            <li>Pagination, empty states, protection contre les valeurs nulles de l'API</li>
            <li>Rafraîchissement via <code>onResume()</code> au retour de <code>OffreActivity</code></li>
          </ul>

          <h4>OffreActivity</h4>
          <ul>
            <li>Requête POST automatique à l'ouverture pour marquer l'offre comme consultée</li>
            <li>État des boutons piloté par le statut de candidature ; sélecteurs de couleur par état</li>
            <li>Messages d'erreur explicites</li>
          </ul>

          <h4>CandidatureActivity</h4>
          <ul>
            <li>Message explicatif contextuel quand l'état est « Offre retenue »</li>
            <li>Messages d'erreur et commentaires JavaDoc ; rafraîchissement via <code>onResume()</code></li>
          </ul>

          <h4>CandidatureEditActivity</h4>
          <ul>
            <li><code>Spinner</code> remplacé par un <code>AutoCompleteTextView</code> (Exposed Dropdown Material)</li>
            <li><code>DatePickerDialog</code> natif remplace la saisie libre de date</li>
            <li>Date de modification de l'état enregistrée ; conversion fuseaux horaires (UTC)</li>
            <li>Dialogue de confirmation avant suppression d'une candidature</li>
          </ul>

          <h4>ListCandidaturesActivity</h4>
          <ul>
            <li>États des candidatures affichés directement dans la liste ; filtrage par état</li>
            <li>Couleurs + libellés par statut ; rafraîchissement via <code>onResume()</code></li>
          </ul>

          <h3>(2) Modifications au service d'interrogation (<code>api/</code>)</h3>
          <h4>APIClient</h4>
          <ul>
            <li>Cache mémoire des réponses GET pour éviter les requêtes réseau redondantes</li>
            <li>Pré-chargement des données au login ; timeouts à 60 s (OkHttpClient)</li>
            <li>Endpoint POST ajouté pour les offres consultées</li>
            <li>
              Gestion centralisée des erreurs réseau dans{' '}
              <code>StageAppActivity.traiterErreur(Throwable)</code>, Snackbar avec option « Réessayer »
            </li>
          </ul>
          <h4>APIService / Nouvelles entités</h4>
          <ul>
            <li>Nouvel endpoint : <code>POST /offres-consultees</code></li>
            <li>Nouvelle classe : <code>OffreConsulteeRequest</code></li>
          </ul>

          <h3>Rétroconception du code</h3>
          <p>
            L'application suit un modèle MVC adapté à Android : layouts XML (vues), classes
            Activity (contrôleurs), entités Java calquant les structures JSON (modèles). Les
            transitions d'état sont sécurisées par des énumérations (<code>EtatCandidatureEnum</code>,
            etc.).
          </p>

          <h3>Révision de l'architecture</h3>
          <p>
            Une classe de base <code>StageAppActivity</code> centralise la gestion des erreurs
            réseau, les hooks <code>onRetry()</code> et la déconnexion. Les chaînes de{' '}
            <code>startActivity</code> ont été remplacées par <code>finish()</code> pour respecter
            le back stack. <code>onResume()</code> est systématiquement implémenté. Les IDs
            hardcodés ont été remplacés par <code>EtatCandidatureEnum</code>.
          </p>

          <h3>IHM et Ergonomie</h3>
          <ul>
            <li>ActionBar native supprimée sur tous les écrans et remplacée par des barres personnalisées avec icône de retour uniforme (<code>ic_back</code>)</li>
            <li>Migration complète vers Material Design 3 : <code>MaterialCardView</code>, Chips, <code>TextInputLayout</code>, <code>AutoCompleteTextView</code></li>
            <li>Snackbar remplace les Toast ; dialogues de confirmation avant suppression ; empty states</li>
            <li><code>ProgressBar</code> dans <code>LoginActivity</code> et <code>MainActivity</code></li>
            <li>Mode sombre via palette dédiée <code>values-night/</code> ; <code>fitsSystemWindows</code> sur tous les layouts</li>
          </ul>

          <h3>Tests Android</h3>
          <ul>
            <li>
              <strong>Espresso</strong> (8 scénarios) :{' '}
              <code>LoginActivityTest</code>, <code>MainActivityTest</code>,{' '}
              <code>MainNavigationTest</code>, <code>ListOffresActivityTest</code>,{' '}
              <code>CandidatureActivityTest</code>, <code>CandidatureEditActivityTest</code>,{' '}
              <code>ListCandidaturesActivityTest</code>, <code>OffreActivityTest</code>
            </li>
            <li>
              <strong>JUnit</strong> (3 suites) : <code>CandidatureUnitTest</code> (extraction d'IDs,
              génération d'URIs, mapping des états), <code>EnumsUnitTest</code>,{' '}
              <code>EtatsCandidaturesUnitTest</code>
            </li>
          </ul>

          <h3>Optimisation Android</h3>
          <ul>
            <li>Cache GET dans <code>APIClient</code> : réponses déjà récupérées non rejouées</li>
            <li>Données pré-chargées avant l'affichage de <code>MainActivity</code></li>
            <li><code>finish()</code> au lieu de <code>startActivity()</code> ; évite l'accumulation d'activités</li>
            <li><code>CandidatureAdapter</code> : pattern ViewHolder pour le recyclage des vues</li>
            <li>Timeout réseau ajusté pour éviter les faux échecs sur connexion lente</li>
          </ul>
        </section>

        <hr />

        <section id="symfony">
          <h2>Back-Office Symfony : Améliorations</h2>

          <h3>Rétroconception</h3>
          <p>L'application est structurée autour de cinq couches distinctes :</p>
          <ul>
            <li><strong>Contrôleurs</strong> : CRUD classique (Étudiants, Entreprises, Offres, Candidatures) + suivi des états + agrégation tableau de bord</li>
            <li><strong>Entités / Repositories</strong> : attributs PHP 8, <code>#[ApiResource]</code>, contraintes <code>UniqueEntity</code> ; repositories avec requêtes DQL personnalisées</li>
            <li><strong>Couche API &amp; Sécurité</strong> : <code>FilterCompteEtudiantQueryExtension</code> garantit qu'un étudiant n'accède pas aux données d'un autre ; authentification hybride (session + préparation JWT)</li>
            <li><strong>Formulaires</strong> : classes <code>FormType</code> avec widgets HTML5, découplés de la logique API</li>
            <li><strong>Qualité</strong> : 1 600+ lignes de PHPUnit + Cypress E2E ; score SUS 82/100</li>
          </ul>

          <h3>Architecture et Sécurité : Problèmes identifiés et corrigés</h3>
          <ul>
            <li>
              <strong>Contrôleurs hors préfixe <code>/admin</code></strong> :{' '}
              <code>CandidatureController</code>, <code>OffreConsulteeController</code>,{' '}
              <code>OffreRetenueController</code> exposés sans authentification. Correction : règles
              explicites dans <code>security.yaml</code>.
            </li>
            <li>
              <strong>Règles API incomplètes</strong> : candidatures, offres consultées et retenues
              non couvertes par les règles POST/DELETE/PUT/PATCH ; tout utilisateur authentifié
              pouvait les modifier.
            </li>
            <li>
              <strong>Étudiants accessibles au back-office</strong> :{' '}
              <code>LoginFormAuthenticator</code> sans vérification de rôle. Ajout d'un contrôle
              ROLE_ADMIN avec redirection et message d'erreur.
            </li>
            <li>
              <strong>Rate limiting absent</strong> : <code>login_throttling</code> ajouté (5 tentatives /
              15 min) sur les firewalls <code>api</code> et <code>main</code> ; dépendance{' '}
              <code>symfony/rate-limiter</code> ajoutée.
            </li>
            <li>
              <strong>Groupes de sérialisation manquants</strong> : <code>EtatCandidature</code>,{' '}
              <code>EtatOffre</code>, <code>EtatRecherche</code> sans contextes API Platform.
              Groupes ajoutés ; <code>CompteEtudiant</code> et <code>Candidature</code>/<code>Entreprise</code>{' '}
              corrigés.
            </li>
            <li>
              <strong>Logique métier dans les contrôleurs</strong> : extraite vers un{' '}
              <code>TableauDeBordService</code> dédié.
            </li>
          </ul>

          <h3>Import par expressions régulières</h3>
          <p>
            Fichier : <code>src/Data/ImportOffresController.php</code>
          </p>
          <ul>
            <li>
              Parsing TXT par blocs :{' '}
              <code>preg_match_all('/(Titre:\s*.+?)(?=Titre:|$)/s', ...)</code> découpe le fichier sur
              chaque occurrence de <code>Titre:</code> (flag <code>s</code> pour le multilignes)
            </li>
            <li>
              Extraction de chaque champ :{' '}
              <code>preg_match('/Titre:\s*(.+?)(?=\s+\w+:|$)/i', ...)</code> capture jusqu'au
              prochain label ou fin de bloc
            </li>
            <li>Support CSV en parallèle via <code>str_getcsv</code> + mapping par en-tête</li>
            <li>Lookup ou création automatique de <code>EtatOffre</code> et <code>Entreprise</code> si absents</li>
            <li>Pré-remplissage du formulaire avant validation manuelle</li>
          </ul>

          <h3>IHM et Ergonomie Web</h3>
          <ul>
            <li>Nouveau fichier CSS <code>public/css/app-stages.css</code> (~800+ lignes)</li>
            <li>Navbar restructurée avec menu déroulant « Interfaces CRUD » et icônes Bootstrap Icons</li>
            <li>Pages index : lignes cliquables, tri visuel, tooltips accessibilité, terminologie standardisée</li>
            <li>Pages edit : barre Retour + Supprimer déplacée en haut du formulaire</li>
            <li>Pages show : fil d'Ariane uniformisé, pages état et offres enrichies</li>
            <li>Layout commun <code>templates/Admin/new_layout.html.twig</code> pour toutes les pages new</li>
            <li>Modal de confirmation avant suppression ; pages d'erreur 403/404/500 personnalisées</li>
            <li>
              <strong>Tableau de bord</strong> : graphique camembert Chart.js par étudiant
              (Candidatures / Retenues / Consultées / Pas consultées) ; cartes KPI centrées
            </li>
          </ul>

          <h3>Optimisation</h3>
          <p>
            <strong>Problème</strong> :{' '}
            <code>TableauDeBordController::getOffreByCompte()</code> appelait{' '}
            <code>offreRepository-&gt;findAll()</code>, chargement de <em>toutes</em> les offres
            en mémoire à chaque accès au tableau de bord.
          </p>
          <p>
            <strong>Correction</strong> : remplacement par{' '}
            <code>findForDashboard(int $limit = 100)</code> dans{' '}
            <code>src/Repository/OffreRepository.php</code> : requête Doctrine avec{' '}
            <code>setMaxResults(100)</code> et <code>orderBy('dateDepot', 'DESC')</code>. Ajout
            de vérifications <code>isset()</code> sur les indices avant mise à jour des statuts.
          </p>

          <h3>Tests Symfony</h3>
          <p>
            <strong>PHPUnit</strong> (5 suites, 1 600+ lignes) :
          </p>
          <ul>
            <li><code>TableauDeBordServiceTest</code> : priorité des statuts (Candidature &gt; Retenue &gt; Consultée &gt; Pas consultée), cas multi-offres, offres inactives ignorées</li>
            <li><code>FilterCompteEtudiantQueryExtensionTest</code> : admin sans filtre, filtrage par idEtudiant/idCompte/compteEtudiant, ressource non gérée, utilisateur non-CompteEtudiant</li>
            <li><code>CompteEtudiantTest</code> : <code>getRoles()</code> toujours ROLE_USER, pas de doublon, cohérence bidirectionnelle</li>
            <li><code>EtudiantTest</code> : <code>__toString()</code>, id null initial, setters/getters</li>
            <li><code>LoginFormAuthenticatorTest</code> : admin accepté, non-admin rejeté avec message, URL login, constante <code>LOGIN_ROUTE</code></li>
          </ul>
          <p>
            <strong>Cypress E2E</strong> (5 scénarios) :{' '}
            <code>connexion.cy.js</code>, <code>navigation.cy.js</code>,{' '}
            <code>offres.cy.js</code>, <code>comptes_etudiants.cy.js</code>,{' '}
            <code>tableau_de_bord.cy.js</code>
          </p>
          <p>
            <strong>Tests utilisateurs</strong> (Think Aloud, 4 participants) :{' '}
            <strong>score SUS de 82/100</strong>
          </p>

          <h3>Conteneurisation (Docker)</h3>
          <ul>
            <li>
              <strong>Images</strong> : <code>php:cli</code> enrichie (Symfony CLI, Composer,
              extensions <code>intl</code>/<code>pgsql</code>/<code>pdo_pgsql</code>, Xdebug) +
              image officielle <code>postgres</code>
            </li>
            <li>Image Symfony : 10 couches (1 FROM, 8 RUN, 1 WORKDIR) ; installations apt-get concaténées + nettoyage cache</li>
            <li>Réseau Docker dédié pour la communication inter-conteneurs ; base de données persistée via volume nommé</li>
            <li>
              Conteneur Symfony monte le répertoire source et démarre avec{' '}
              <code>symfony server:start --no-tls --allow-all-ip</code> ; port 8000 publié
            </li>
            <li>
              <code>DATABASE_URL</code> et <code>POSTGRES_PASSWORD</code> injectés via <code>-e</code>{' '}
              au lancement pour un fonctionnement immédiat sur toute machine
            </li>
          </ul>
        </section>

        <hr />

        <section id="database">
          <h2>Base de données : Normalisation en 3FN</h2>
          <p>
            Le schéma original violait la première forme normale (colonnes JSON non atomiques) et
            utilisait des clés naturelles instables. Principales corrections :
          </p>
          <ul>
            <li>
              Fusion de <code>offre_consultee</code> et <code>offre_retenue</code> en{' '}
              <code>suivi_offre(#numero_ine, #id_offre, est_consultee, est_retenue)</code>
            </li>
            <li>
              Mots-clés extraits dans <code>offre_mot_cle(#id_offre, mot_cle)</code> — 1FN respectée
            </li>
            <li>
              Colonne JSON <code>roles</code> remplacée par un booléen <code>est_admin</code>
            </li>
            <li>
              Clé de substitution <code>id_entreprise</code> introduite (<code>raison_sociale</code>{' '}
              est instable en clé étrangère)
            </li>
            <li>
              <code>date_action</code> ajoutée dans la clé primaire de <code>candidature</code>{' '}
              pour permettre plusieurs actions sur la même offre
            </li>
          </ul>
          <h3>SLR amélioré 3FN</h3>
          <pre>
{`etudiant       (numero_ine, nom, prenom, email, #id_compte)
compte         (id_compte, login, password, parcours, derniere_connexion, est_admin, #etat_recherche)
entreprise     (id_entreprise, raison_sociale, ville, pays)
offre          (id_offre, intitule, descriptif, date_depot, parcours,
                url_piece_jointe, #id_entreprise, #etat_offre)
offre_mot_cle  (#id_offre, mot_cle)
suivi_offre    (#numero_ine, #id_offre, est_consultee, est_retenue)
candidature    (#numero_ine, #id_offre, date_action, type_action, #etat_candidature)
etat_candidature (etat, descriptif)
etat_offre       (etat, descriptif)
etat_recherche   (etat, descriptif)`}
          </pre>
        </section>

        <hr />

        <section id="individual-work">
          <h2>Contributions personnelles</h2>
          <ul>
            <li>Migration de l'IHM Android vers Material Design 3 (tous les layouts, Chips, Snackbar, mode sombre)</li>
            <li>
              Refactoring du cycle de vie : classe de base <code>StageAppActivity</code>, corrections
              du back-stack avec <code>finish()</code>, rafraîchissement systématique <code>onResume()</code>
            </li>
            <li>APIClient : cache mémoire GET, réglage des timeouts à 60 s, gestion centralisée des erreurs</li>
            <li>Tests d'instrumentation Espresso (8 scénarios) et tests unitaires JUnit (3 suites)</li>
            <li>Rédaction du rapport : section Android, spécification du processus, glossaire</li>
          </ul>
        </section>

        <hr />

        <section id="demo">
          <h2>Démonstration visuelle</h2>
          <div className="project-demo">
            <figure>
              <img
                src={getAssetPath('/assets/images/projects/SAE401AvantApresMobile.png')}
                alt="Refonte mobile : avant et après"
                loading="lazy"
                width="1200"
                height="600"
              />
              <figcaption>Interface mobile : avant et après la refonte Material Design 3</figcaption>
            </figure>
            <div className="project-demo-row">
              <figure>
                <img
                  src={getAssetPath('/assets/images/projects/SAE401AvantBackOffice.png')}
                  alt="Back-office avant la refonte"
                  loading="lazy"
                  width="800"
                  height="500"
                />
                <figcaption>Back-office avant la refonte</figcaption>
              </figure>
              <figure>
                <img
                  src={getAssetPath('/assets/images/projects/SAE401ApresBackOffice.png')}
                  alt="Back-office après la refonte"
                  loading="lazy"
                  width="800"
                  height="500"
                />
                <figcaption>Back-office après la refonte</figcaption>
              </figure>
            </div>
          </div>
        </section>
      </article>

      <ProjectPagination currentPath="/projet-SAE401" />
    </>
  );
};

export default ProjetSAE401;
