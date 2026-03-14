import { useRef } from 'react';
import { useTranslation } from 'react-i18next';
import ProjectPagination from '@/components/ProjectPagination';
import useReadingTimeEstimate from '@/hooks/useReadingTimeEstimate';

const ProjetSAE56 = () => {
  const { i18n } = useTranslation();
  const contentRef = useRef<any>(null);
  useReadingTimeEstimate(contentRef);

  if (i18n.resolvedLanguage === 'en') {
    return (
      <>
        <article className="project-article" ref={contentRef}>
          <section id="project-overview">
            <h2>Project Context</h2>
            <p>
              Each team (3 to 4 students) selected a digital-services company (Capgemini, Sopra
              Steria, Atos, etc.) and created an institutional website for a non-technical audience
              (middle-school students), presenting the company activity, organization, values, and
              digital/ecological transition in an accessible way.
            </p>
            <p>The objective was to produce a website that respected both:</p>
            <ul>
              <li>
                <strong>Form</strong>: consistent mockup, sober visual identity, eco-aware choices,
                and standards compliance.
              </li>
              <li>
                <strong>Content</strong>: factual accuracy and clear vulgarization for
                non-specialists.
              </li>
            </ul>
          </section>

          <hr />

          <section id="skills">
            <h2>Skills Mobilized</h2>
            <h3>Responsibility, Sustainability, Project Management</h3>
            <ul>
              <li>Understand client and end-user needs</li>
              <li>Set up project-management tools</li>
              <li>Identify actors and phases in a development lifecycle</li>
            </ul>

            <h3>Professional Integration, Teamwork</h3>
            <ul>
              <li>Understand the digital ecosystem</li>
              <li>Discover required aptitudes across IT sectors</li>
              <li>Identify roles and responsibilities in multidisciplinary teams</li>
              <li>Develop interpersonal collaboration skills</li>
            </ul>
          </section>

          <hr />

          <section id="organization">
            <h2>Project Organization</h2>
            <p>
              The project was split into three phases: <strong>requirements gathering</strong>,
              <strong>mockup design</strong>, then <strong>website implementation</strong>. Each
              phase lasted around 2 to 3 weeks with intermediate deliverables and feedback.
            </p>
            <ul>
              <li>
                <strong>Phase 1 - Requirements gathering (September to October)</strong>
                <ul>
                  <li>
                    Research sessions, information collection, and a two-column synthesis document.
                  </li>
                  <li>Final deliverable: Word + PDF file.</li>
                </ul>
              </li>
              <li>
                <strong>Phase 2 - Mockup design (November)</strong>
                <ul>
                  <li>Work sessions focused on site architecture and UX/UI.</li>
                  <li>Intermediate mockup submission with instructor feedback and iteration.</li>
                </ul>
              </li>
              <li>
                <strong>Phase 3 - Implementation (December to January)</strong>
                <ul>
                  <li>Supervised coding sessions in HTML/CSS/JS.</li>
                  <li>Final testing, delivery, and group oral presentation.</li>
                </ul>
              </li>
            </ul>
          </section>

          <hr />

          <section id="objectives">
            <h2>Detailed Objectives</h2>
            <ul>
              <li>
                <strong>Collect and synthesize</strong> key company information using vocabulary
                adapted to younger audiences.
              </li>
              <li>
                <strong>Vulgarize</strong> non-technical content into accessible explanations.
              </li>
              <li>
                <strong>Design an ergonomic mockup</strong> aligned with accessibility, eco-design,
                and responsive constraints.
              </li>
              <li>
                <strong>Develop the website</strong> with lightweight code and media optimization
                best practices.
              </li>
              <li>
                <strong>Collaborate effectively</strong> through planning, documentation, and
                coordinated contribution.
              </li>
              <li>
                <strong>Present the process orally</strong>: design decisions, implementation,
                feedback, and retrospective.
              </li>
            </ul>
          </section>

          <hr />

          <section id="techniques">
            <h2>Technical Skills & Know-How</h2>
            <ul>
              <li>
                <strong>Prototyping:</strong> Figma, Adobe XD, Balsamiq, or Canva.
              </li>
              <li>
                <strong>Front-end:</strong> HTML5, CSS3 (responsive grids, flexbox), JavaScript
                basics, WCAG practices.
              </li>
              <li>
                <strong>Version control:</strong> Git and GitLab (repo setup, branching, merge
                requests, issue tracking).
              </li>
              <li>
                <strong>Eco-design:</strong> image compression, CSS/JS minification, controlled
                webfont usage, lazy loading.
              </li>
              <li>
                <strong>Technical writing:</strong> sourced bibliography, glossary, and annotated
                mockups/screenshots.
              </li>
            </ul>
          </section>

          <hr />

          <section id="group-work">
            <h2>Teamwork</h2>
            <p>Each team member contributed to:</p>
            <ul>
              <li>
                <strong>Planning</strong> and role distribution (research, writing, mockup,
                integration).
              </li>
              <li>
                <strong>Collaborative writing</strong> of the company synthesis documentation.
              </li>
              <li>
                <strong>Iterative mockup design</strong> based on teacher feedback.
              </li>
              <li>
                <strong>Shared development</strong> with CSS/navigation/HTML consistency and
                responsive validation.
              </li>
              <li>
                <strong>GitLab workflow</strong> with dedicated branches and final merge review.
              </li>
            </ul>
          </section>

          <hr />

          <section id="individual-work">
            <h2>Individual Work</h2>
            <ul>
              <li>
                <strong>Research work:</strong> each student investigated a specific angle (ecology,
                legal structure, competition, etc.).
              </li>
              <li>
                <strong>Glossary writing:</strong> management, GDPR, digital transition, and
                eco-design terms for non-specialists.
              </li>
              <li>
                <strong>Testing and validation:</strong> accessibility, contrast, and mobile
                compatibility checks before final integration.
              </li>
              <li>
                <strong>Oral preparation:</strong> each student prepared a dedicated pitch segment.
              </li>
            </ul>
          </section>
        </article>

        <ProjectPagination currentPath="/projet-SAE56" />
      </>
    );
  }

  return (
    <>
      <article className="project-article" ref={contentRef}>
        <section id="project-overview">
          <h2>Contexte du projet</h2>
          <p>
            Chaque équipe (3 ou 4 étudiants) choisit une entreprise du secteur numérique (Capgemini,
            Sopra Steria, Atos, ...) et réalise un site web institutionnel à destination d'un public
            non technique (élèves de 3e), pour présenter de façon sobre et vulgarisée l'activité,
            l'organisation, les valeurs, la transition numérique et écologique de l'entreprise.
          </p>
          <p>L'objectif est de produire un site web qui respecte à la fois :</p>
          <ul>
            <li>
              <strong>La forme</strong> : maquette conforme, charte graphique sobre et écologique,
              respect des standards.
            </li>
            <li>
              <strong>Le fond</strong> : contenu en adéquation avec les informations réelles de
              l'entreprise, vulgarisation pour un public non initié.
            </li>
          </ul>
        </section>

        <hr />

        <section id="skills">
          <h2>Compétences mobilisées</h2>
          <h3>Être responsable - Durable - Gestion de projet</h3>
          <ul>
            <li>Appréhender les besoins du client et de l'utilisateur</li>
            <li>Mettre en place les outils de gestion de projet</li>
            <li>Identifier les acteurs et les différentes phases d'un cycle de développement</li>
          </ul>

          <h3>S'insérer dans son environnement professionnel - Travail en équipe</h3>
          <ul>
            <li>Appréhender l'écosystème numérique</li>
            <li>Découvrir les aptitudes requises selon les différents secteurs informatiques</li>
            <li>
              Identifier les statuts, fonctions et rôles de chaque membre d'une équipe
              pluridisciplinaire
            </li>
            <li>Acquérir les compétences interpersonnelles pour travailler en équipe</li>
          </ul>
        </section>

        <hr />

        <section id="organization">
          <h2>Organisation du projet</h2>
          <p>
            Le projet se déroule en trois phases : <strong>recueil des besoins</strong>,
            <strong>conception de la maquette</strong>, puis{' '}
            <strong>implémentation du site web</strong>. Chaque phase s'étale sur 2-3 semaines, avec
            rendus et retours intermédiaires :
          </p>
          <ul>
            <li>
              <strong>Phase 1 - Recueil des besoins (septembre -&gt; octobre)</strong>
              <ul>
                <li>
                  Présentations en TD, recherche d'informations, réalisation d'une fiche "synthèse
                  entreprise" (2 colonnes : données brutes ↇƒ contenu vulgarisé).
                </li>
                <li>Rendu final : document Word + PDF (25 octobre, 18 h 30).</li>
              </ul>
            </li>

            <li>
              <strong>Phase 2 - Conception de la maquette (novembre)</strong>
              <ul>
                <li>
                  3 séances TP consacrées à l'architecture du site et à l'UX/UI (30 septembre -&gt;
                  29 novembre).
                </li>
                <li>
                  Rendu intermédiaire de la maquette (29 novembre, 17 h 00). Un retour enseignant
                  permet de l'affiner.
                </li>
              </ul>
            </li>

            <li>
              <strong>Phase 3 - Implémentation du site (décembre -&gt; janvier)</strong>
              <ul>
                <li>
                  Sessions AA encadrées pour codage HTML/CSS/JS (2 décembre -&gt; 16 décembre).
                </li>
                <li>
                  Finalisation et tests : rendu final du site (6 janvier 2025, 17 h 00).
                  Présentation orale en groupe.
                </li>
              </ul>
            </li>
          </ul>
        </section>

        <hr />

        <section id="objectives">
          <h2>Objectifs détaillés</h2>
          <ul>
            <li>
              <strong>Collecter et synthétiser</strong> les informations clés de l'entreprise
              (activité, organisation, concurrents, clients, valeurs, etc.) en utilisant un
              vocabulaire de management adapté à des élèves de 3e.
            </li>
            <li>
              <strong>Vulgariser</strong> pour un public non technique en transformant les données
              brutes en contenu accessible et compréhensible.
            </li>
            <li>
              <strong>Concevoir une maquette</strong> ergonomique et sobre, répondant aux retours du
              client et aux critères d'accessibilité, d'écoconception et de design responsive.
            </li>
            <li>
              <strong>Développer le site web</strong> en respectant la maquette, la charte
              graphique, l'accessibilité et la sobriété écologique (optimisation des images, code
              léger, bonnes pratiques HTML5/CSS3).
            </li>
            <li>
              <strong>Collaborer en équipe</strong> : planifier les tâches (planning, jalons), tenir
              compte des feedbacks enseignant, partager, documenter le code et coordonner les
              contributions.
            </li>
            <li>
              <strong>Présenter oralement</strong> à l'oral de groupe la démarche (conception,
              implémentation, retours, bilan).
            </li>
          </ul>
        </section>

        <hr />

        <section id="techniques">
          <h2>Compétences Techniques & Savoir-Faire</h2>
          <ul>
            <li>
              <strong>Outils de prototypage :</strong> Figma (ou Adobe XD), Balsamiq, ou Canva pour
              la maquette.
            </li>
            <li>
              <strong>Front-end web :</strong> HTML5, CSS3 (grilles responsive, flexbox), JavaScript
              (interactions de base), bonnes pratiques d'accessibilité WCAG.
            </li>
            <li>
              <strong>Gestion de versions :</strong> Git & GitLab (création de dépôt, branches,
              merge requests, suivi des issues).
            </li>
            <li>
              <strong>Écoconception / sobriété :</strong> compression d'images (WebP), minification
              CSS/JS, utilisation limitée des polices web, chargement différé (lazy loading).
            </li>
            <li>
              <strong>Rédaction technique :</strong> sitographie (sources classées, URL + date de
              consultation), glossaire, légendes pour maquettes / captures d'écran.
            </li>
          </ul>
        </section>

        <hr />

        <section id="group-work">
          <h2>Travail en groupe</h2>
          <p>Chaque équipe (3-4 élèves) a assumé collectivement :</p>
          <ul>
            <li>
              <strong>Planification</strong> des tâches (répartition des rôles : recueil, rédaction,
              maquette, integration).
            </li>
            <li>
              <strong>Rédaction collaborative</strong> de la fiche "synthèse entreprise" (partage
              sur Google Docs ou equivalent, relectures croisees, respect des normes de mise en
              page).
            </li>
            <li>
              <strong>Conception de la maquette</strong> par itérations : feedback enseignants -&gt;
              ajustements (UX/UI, charte graphique, accessibilite).
            </li>
            <li>
              <strong>Développement</strong> partagé du site (chaque membre a codé des pages ou
              sections différentes, en assurant la cohérence du CSS, de la navigation et de la
              structure HTML, et en s'assurant que la version finale est responsive).
            </li>
            <li>
              <strong>Gestion des versions</strong> via GitLab : branches dédiées pour la maquette,
              la page "Accueil", la page "Qui sommes-nous", etc., puis fusion et relecture avant
              rendu final.
            </li>
          </ul>
        </section>

        <hr />

        <section id="individual-work">
          <h2>Travail individuel</h2>
          <ul>
            <li>
              <strong>Recherche documentaire</strong> : chaque étudiant a enquêté sur un aspect
              précis (exemple : bilan écologique de l'entreprise, organisation juridique,
              concurrents majeurs) pour alimenter la sitographie.
            </li>
            <li>
              <strong>Rédaction d'un glossaire</strong> : terminologie management, RGPD, transition
              numérique, écoconception, explicatifs pour les non-initiés.
            </li>
            <li>
              <strong>Test et validation</strong> : chaque membre a effectué des tests unitaires
              (ex. accessibilité, contraste des couleurs, compatibilité mobile) avant l'intégration
              finale.
            </li>
            <li>
              <strong>Préparation de l'oral</strong> : chaque étudiant a rédigé sa partie du pitch
              (1 à 2 minutes chacun) pour l'evaluation orale de debut janvier.
            </li>
          </ul>
        </section>
      </article>

      <ProjectPagination currentPath="/projet-SAE56" />
    </>
  );
};

export default ProjetSAE56;
