import { Fragment, useEffect, useRef, useState } from 'react';
import type { KeyboardEvent as ReactKeyboardEvent, ReactNode } from 'react';
import { useTranslation } from 'react-i18next';
import ProjectPagination from '@/components/ProjectPagination';
import useReadingTimeEstimate from '@/hooks/useReadingTimeEstimate';
import { getAssetPath } from '@/utils/assetPath';
import '@styles/components/_stage.css';

/**
 * Projet phare, Stage G-SCOP, Repairtory.
 * Page vitrine premium + composants interactifs (compteurs animes, simulateur
 * de score de diagnostic F02, selecteur de profils, frise de deroulement,
 * cycle de vie d'une intervention). Texte bilingue via un objet COPY rendu une
 * seule fois. Aucun tiret cadratin dans la copie (choix editorial).
 */

const prefersReducedMotion =
  window.matchMedia?.('(prefers-reduced-motion: reduce)')?.matches ?? false;

const IMG = '/assets/images/projects/stage/';
const img = (name: string) => getAssetPath(`${IMG}${name}.webp`);

type Lang = 'fr' | 'en';

/* ══════════════════════════════════════════════════════════════
   Hook : detection d'entree dans le viewport (une fois)
   ══════════════════════════════════════════════════════════════ */
function useInView<T extends Element>(rootMargin = '0px 0px -12% 0px') {
  const ref = useRef<T | null>(null);
  const [inView, setInView] = useState(prefersReducedMotion);

  useEffect(() => {
    if (prefersReducedMotion) return;
    const el = ref.current;
    if (!el || typeof IntersectionObserver === 'undefined') {
      setInView(true);
      return;
    }
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries.some((e) => e.isIntersecting)) {
          setInView(true);
          observer.disconnect();
        }
      },
      { rootMargin, threshold: 0.2 }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, [rootMargin]);

  return { ref, inView };
}

/* ══════════════════════════════════════════════════════════════
   Compteur anime
   ══════════════════════════════════════════════════════════════ */
interface StatItem {
  value: number;
  decimals?: number;
  prefix?: string;
  suffix?: string;
  label: string;
  hint?: string;
}

function AnimatedNumber({
  value,
  decimals = 0,
  prefix = '',
  suffix = '',
  run,
}: {
  value: number;
  decimals?: number;
  prefix?: string;
  suffix?: string;
  run: boolean;
}) {
  const [display, setDisplay] = useState(prefersReducedMotion ? value : 0);

  useEffect(() => {
    if (prefersReducedMotion) {
      setDisplay(value);
      return;
    }
    if (!run) return;
    let raf = 0;
    const duration = 1250;
    const start = performance.now();
    const tick = (now: number) => {
      const t = Math.min(1, (now - start) / duration);
      const eased = 1 - Math.pow(1 - t, 3);
      setDisplay(value * eased);
      if (t < 1) raf = requestAnimationFrame(tick);
      else setDisplay(value);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [run, value]);

  const formatted = display.toLocaleString('fr-FR', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  });

  return (
    <span className="stage-stat-value">
      {prefix}
      {formatted}
      {suffix}
    </span>
  );
}

function StatBand({ items, kicker }: { items: StatItem[]; kicker: string }) {
  const { ref, inView } = useInView<HTMLDivElement>();
  return (
    <div className="stage-stats-wrap" ref={ref}>
      <p className="stage-eyebrow">{kicker}</p>
      <div className="stage-stats-grid">
        {items.map((s) => (
          <div className="stage-stat" key={s.label}>
            <AnimatedNumber
              value={s.value}
              decimals={s.decimals}
              prefix={s.prefix}
              suffix={s.suffix}
              run={inView}
            />
            <span className="stage-stat-label">{s.label}</span>
            {s.hint ? <span className="stage-stat-hint">{s.hint}</span> : null}
          </div>
        ))}
      </div>
    </div>
  );
}

/* ══════════════════════════════════════════════════════════════
   Simulateur de score de diagnostic (F02)
   ══════════════════════════════════════════════════════════════ */
interface Criterion {
  key: string;
  label: string;
  points: number;
  cycle?: number[];
  base?: boolean;
}

function DiagnosticSimulator({ c }: { c: DiagnosticCopy }) {
  const criteria: Criterion[] = [
    { key: 'type', label: c.crit.type, points: 5, base: true },
    { key: 'fonction', label: c.crit.fonction, points: 3 },
    { key: 'comportement', label: c.crit.comportement, points: 3 },
    { key: 'observations', label: c.crit.observations, points: 2, cycle: [0, 1, 2] },
    { key: 'marque', label: c.crit.marque, points: 1 },
    { key: 'modele', label: c.crit.modele, points: 1 },
    { key: 'composant', label: c.crit.composant, points: 1 },
  ];
  const MAX = 16;

  const [active, setActive] = useState<Record<string, number>>({
    type: 5,
    fonction: 3,
    comportement: 3,
    observations: 1,
    marque: 0,
    modele: 0,
    composant: 0,
  });

  const score = Object.values(active).reduce((a, b) => a + b, 0);
  const pct = Math.round((score / MAX) * 100);

  const toggle = (crit: Criterion) => {
    if (crit.base) return;
    setActive((prev) => {
      const next = { ...prev };
      if (crit.cycle) {
        const current = prev[crit.key] ?? 0;
        const idx = crit.cycle.indexOf(current);
        next[crit.key] = crit.cycle[(idx + 1) % crit.cycle.length];
      } else {
        next[crit.key] = prev[crit.key] ? 0 : crit.points;
      }
      return next;
    });
  };

  const R = 52;
  const CIRC = 2 * Math.PI * R;
  const offset = CIRC * (1 - score / MAX);

  const terms = criteria
    .filter((cr) => (active[cr.key] ?? 0) > 0)
    .map((cr) => `${active[cr.key]}·${cr.key}`);

  return (
    <div className="stage-sim">
      <div className="stage-sim-controls">
        <p className="stage-sim-instruction">{c.instruction}</p>
        <div className="stage-sim-chips">
          {criteria.map((cr) => {
            const val = active[cr.key] ?? 0;
            const on = val > 0;
            return (
              <button
                type="button"
                key={cr.key}
                className={`stage-sim-chip${on ? ' is-on' : ''}${cr.base ? ' is-base' : ''}`}
                onClick={() => toggle(cr)}
                aria-pressed={on}
                disabled={cr.base}
              >
                <span className="stage-sim-chip-label">{cr.label}</span>
                <span className="stage-sim-chip-pts">{cr.cycle ? `+${val}` : `+${cr.points}`}</span>
              </button>
            );
          })}
        </div>
        <p className="stage-sim-formula" aria-live="polite">
          <span className="stage-sim-formula-s">S</span> = {terms.join(' + ') || '0'}
        </p>
        <p className="stage-sim-note">{c.note}</p>
      </div>

      <div className="stage-sim-ring" role="img" aria-label={c.ringAria(score, MAX)}>
        <svg viewBox="0 0 120 120" width="150" height="150">
          <circle className="stage-sim-ring-track" cx="60" cy="60" r={R} />
          <circle
            className="stage-sim-ring-fill"
            cx="60"
            cy="60"
            r={R}
            style={{ strokeDasharray: CIRC, strokeDashoffset: offset }}
          />
        </svg>
        <div className="stage-sim-ring-center">
          <strong>{score}</strong>
          <span>/ {MAX}</span>
          <em>{pct}%</em>
        </div>
      </div>
    </div>
  );
}

/* ══════════════════════════════════════════════════════════════
   Selecteur de profils
   ══════════════════════════════════════════════════════════════ */
interface ProfileEntry {
  id: string;
  tag: string;
  name: string;
  role: string;
  blurb: string;
  can: string[];
  image: string;
  alt: string;
}

function ProfileTabs({ profiles, label }: { profiles: ProfileEntry[]; label: string }) {
  const [active, setActive] = useState(0);
  const current = profiles[active];

  const selectTab = (index: number) => {
    setActive(index);
    // Roving tabindex : le focus suit la selection lors de la navigation flechee
    document.getElementById(`stage-profile-tab-${profiles[index].id}`)?.focus();
  };

  const handleTabKeyDown = (event: ReactKeyboardEvent<HTMLButtonElement>, currentIndex: number) => {
    if (!['ArrowRight', 'ArrowDown', 'ArrowLeft', 'ArrowUp', 'Home', 'End'].includes(event.key)) {
      return;
    }
    event.preventDefault();
    if (event.key === 'Home') {
      selectTab(0);
      return;
    }
    if (event.key === 'End') {
      selectTab(profiles.length - 1);
      return;
    }
    const direction = event.key === 'ArrowRight' || event.key === 'ArrowDown' ? 1 : -1;
    selectTab((currentIndex + direction + profiles.length) % profiles.length);
  };

  return (
    <div className="stage-profiles">
      <div className="stage-profiles-tabs" role="tablist" aria-label={label}>
        {profiles.map((p, i) => (
          <button
            key={p.id}
            type="button"
            role="tab"
            id={`stage-profile-tab-${p.id}`}
            aria-selected={i === active}
            aria-controls="stage-profile-panel"
            tabIndex={i === active ? 0 : -1}
            className={`stage-profile-tab${i === active ? ' is-active' : ''}`}
            onClick={() => setActive(i)}
            onKeyDown={(event) => handleTabKeyDown(event, i)}
          >
            <span className="stage-profile-tab-tag">{p.tag}</span>
            <span className="stage-profile-tab-name">{p.name}</span>
          </button>
        ))}
      </div>

      <div
        className="stage-profile-panel"
        role="tabpanel"
        id="stage-profile-panel"
        aria-labelledby={`stage-profile-tab-${current.id}`}
      >
        <div className="stage-profile-copy">
          <p className="stage-profile-role">{current.role}</p>
          <p className="stage-profile-blurb">{current.blurb}</p>
          <ul className="stage-profile-can">
            {current.can.map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ul>
        </div>
        <figure className="stage-shot stage-profile-shot">
          {/* Pas de `key` ni de lazy : on garde le meme <img> et on change src,
              le navigateur affiche l'ancienne image jusqu'au chargement de la
              nouvelle (aucun flash de texte alternatif / image cassee). */}
          <img
            src={img(current.image)}
            alt={current.alt}
            className="zoomable"
            loading="eager"
            decoding="async"
            width="1600"
            height="1000"
          />
        </figure>
      </div>
    </div>
  );
}

/* ══════════════════════════════════════════════════════════════
   Frise de deroulement
   ══════════════════════════════════════════════════════════════ */
interface Phase {
  period: string;
  tag: string;
  title: string;
  text: string;
  kind?: 'plan' | 'added' | 'iut';
}

function Timeline({ phases }: { phases: Phase[] }) {
  return (
    <ol className="stage-timeline">
      {phases.map((p) => (
        <li
          className={`stage-timeline-item stage-timeline-item--${p.kind ?? 'plan'}`}
          key={p.title}
        >
          <span className="stage-timeline-period">{p.period}</span>
          <div className="stage-timeline-card">
            <span className="stage-timeline-tag">{p.tag}</span>
            <strong>{p.title}</strong>
            <p>{p.text}</p>
          </div>
        </li>
      ))}
    </ol>
  );
}

/* ══════════════════════════════════════════════════════════════
   Cycle de vie d'une intervention
   ══════════════════════════════════════════════════════════════ */
function Lifecycle({
  flow,
  outcomes,
  branchLabel,
  orLabel,
  notes,
}: {
  flow: { s: string; d: string }[];
  outcomes: { s: string; d: string }[];
  branchLabel: string;
  orLabel: string;
  notes: string[];
}) {
  return (
    <div className="stage-lifecycle">
      {/* Partie lineaire : brouillon -> soumise */}
      <div className="stage-lifecycle-linear">
        {flow.map((st, i) => (
          <Fragment key={st.s}>
            <div className="stage-lifecycle-box">
              <strong>{st.s}</strong>
              <span>{st.d}</span>
            </div>
            {i < flow.length - 1 ? (
              <span className="stage-lifecycle-arrow" aria-hidden="true">
                →
              </span>
            ) : null}
          </Fragment>
        ))}
      </div>
      {/* Branche : deux issues terminales alternatives */}
      <p className="stage-lifecycle-branch">{branchLabel}</p>
      <div className="stage-lifecycle-outcomes">
        {outcomes.map((st, i) => (
          <Fragment key={st.s}>
            {i > 0 ? (
              <span className="stage-lifecycle-or" aria-hidden="true">
                {orLabel}
              </span>
            ) : null}
            <div className="stage-lifecycle-box stage-lifecycle-box--outcome">
              <strong>{st.s}</strong>
              <span>{st.d}</span>
            </div>
          </Fragment>
        ))}
      </div>
      <ul className="stage-arrow-list stage-lifecycle-notes">
        {notes.map((n) => (
          <li key={n}>{n}</li>
        ))}
      </ul>
    </div>
  );
}

/* ══════════════════════════════════════════════════════════════
   Petits blocs
   ══════════════════════════════════════════════════════════════ */
function Shot({
  name,
  caption,
  w = 1800,
  h = 1125,
}: {
  name: string;
  caption: string;
  w?: number;
  h?: number;
}) {
  return (
    <figure className="stage-shot">
      <img src={img(name)} alt={caption} className="zoomable" loading="lazy" width={w} height={h} />
      <figcaption>{caption}</figcaption>
    </figure>
  );
}

function Pillars({ items }: { items: { icon: ReactNode; title: string; text: string }[] }) {
  return (
    <div className="stage-pillars">
      {items.map((p) => (
        <div className="stage-pillar" key={p.title}>
          <span className="stage-pillar-icon" aria-hidden="true">
            {p.icon}
          </span>
          <strong>{p.title}</strong>
          <p>{p.text}</p>
        </div>
      ))}
    </div>
  );
}

function TeamGrid({ members }: { members: { name: string; role: string; note?: string }[] }) {
  return (
    <div className="stage-team">
      {members.map((m) => (
        <div className="stage-team-member" key={m.name}>
          <strong>{m.name}</strong>
          <span>{m.role}</span>
          {m.note ? <em>{m.note}</em> : null}
        </div>
      ))}
    </div>
  );
}

function Numbered({ items }: { items: { t: string; d: string }[] }) {
  return (
    <div className="stage-steps">
      {items.map((s, i) => (
        <div className="stage-step" key={s.t}>
          <span className="stage-step-num" aria-hidden="true">
            {i + 1}
          </span>
          <div>
            <strong>{s.t}</strong>
            <p>{s.d}</p>
          </div>
        </div>
      ))}
    </div>
  );
}

function FeatureList({ items }: { items: { t: string; d: string }[] }) {
  return (
    <div className="stage-feature-list">
      {items.map((f) => (
        <div className="stage-feature" key={f.t}>
          <strong>{f.t}</strong>
          <span>{f.d}</span>
        </div>
      ))}
    </div>
  );
}

/* ── Types de la copie ────────────────────────────────────────── */
interface DiagnosticCopy {
  instruction: string;
  note: string;
  crit: {
    type: string;
    fonction: string;
    comportement: string;
    observations: string;
    marque: string;
    modele: string;
    composant: string;
  };
  ringAria: (s: number, max: number) => string;
}

/* ══════════════════════════════════════════════════════════════
   COPIE bilingue (aucun tiret cadratin)
   ══════════════════════════════════════════════════════════════ */
const COPY = {
  fr: {
    hookKicker: 'L’anecdote qui résume tout',
    hook: '« 79 façons d’écrire le même objet. »',
    hookBody:
      'Sur un seul tableur de Repair Café, j’ai trouvé soixante-dix-neuf orthographes différentes pour « cafetière ». Un savoir de réparation précieux, mais éparpillé, local et impossible à partager. Pendant douze semaines au laboratoire G-SCOP, j’ai conçu et développé, seul, l’application web qui y répond : Repairtory.',
    metaChips: [
      { k: 'Rôle', v: 'Développeur unique, 100 % du code' },
      { k: 'Durée', v: '12 semaines, du 20 avr. au 10 juil. 2026' },
      { k: 'Structure', v: 'Laboratoire G-SCOP (CNRS · Grenoble INP · UGA)' },
      { k: 'Cadre', v: 'Stage de 2ᵉ année, BUT Informatique (IUT2 Grenoble)' },
    ],
    heroAlt:
      'Écran de connexion de Repairtory : identité de marque, laboratoire G-SCOP et statistiques en direct',
    scrollCue: 'Explorer le projet',

    statsKicker: 'Le stage en chiffres (état final, 10 juillet 2026)',
    stats: [
      {
        value: 100,
        suffix: ' %',
        label: 'du code écrit seul',
        hint: '0 développeur dans l’encadrement',
      },
      { value: 137, label: 'endpoints d’API', hint: '11 routeurs' },
      { value: 53, label: 'migrations SQL', hint: '52 tables en base' },
      { value: 8, label: 'langues livrées', hint: 'i18n complète' },
      { value: 2000, prefix: '≈ ', label: 'tests automatisés', hint: '≈ 96 % côté serveur' },
      { value: 40, label: 'règles métier', hint: '+ 7 missions bonus' },
      { value: 562, label: 'commits', hint: '2 dépôts, code + spécification' },
      { value: 77.7, decimals: 1, label: 'score SUS d’utilisabilité', hint: '12 participants' },
    ] as StatItem[],

    /* ── Contexte ── */
    contextTitle: 'Le contexte : un laboratoire, une thèse, des ateliers',
    contextLead:
      'Ce stage ne sort pas de nulle part. Il s’inscrit dans un projet de recherche du laboratoire G-SCOP, au service d’un réseau d’ateliers associatifs bien réels : les Repair Cafés grenoblois.',
    contextRC:
      'Un Repair Café est un atelier bénévole où l’on répare un objet plutôt que de le jeter, contre le gaspillage et l’obsolescence. Le bassin grenoblois en compte seize, dont quatre pilotes pour ce projet : Grenoble Centre (qui fournit le formulaire papier de référence), Pinal et Saint-Égrève (visités sur le terrain) et Fontaine.',
    contextLabTitle: 'Le laboratoire G-SCOP',
    contextLab:
      'G-SCOP (Sciences pour la Conception, l’Optimisation et la Production) est une unité mixte de recherche sous tutelle de l’Université Grenoble Alpes, de Grenoble INP et du CNRS, qui réunissait 168 personnes fin 2024. J’ai été accueilli dans l’équipe CIPP (Conception et Intégration Produit-Process), une vingtaine de personnes dont l’un des axes est la formalisation des connaissances : transformer un savoir-faire en connaissance structurée et partageable. C’est exactement l’objet du projet.',
    contextThesis:
      'Le projet est rattaché à la thèse d’Héloïse Dauvillaire, qui porte sur l’amélioration du diagnostic en Repair Café par une collecte structurée des données. Il s’appuie sur un constat de la recherche : les pannes des produits de consommation sont difficiles à diagnostiquer, et les réparateurs raisonnent surtout par analogie, en reconnaissant des cas déjà vus.',
    contextTeamTitle: 'Un encadrement de chercheurs, aucun développeur',
    team: [
      {
        name: 'Héloïse Dauvillaire',
        role: 'Doctorante, contact quotidien',
        note: 'Projet rattaché à sa thèse',
      },
      { name: 'El-Haddi Mechekour', role: 'Maître de conférences, tuteur officiel' },
      { name: 'Cédric Masclet', role: 'Professeur des universités' },
      { name: 'Amira Barhoumi', role: 'Tutrice IUT2 Grenoble' },
    ],
    contextTeamNote:
      'Aucun de mes encadrants n’est développeur logiciel : ce sont des chercheurs en conception et en génie industriel. J’ai donc écrit 100 % du code, seul. Le service informatique du laboratoire (SMIT) m’a accompagné uniquement sur le déploiement. Les orientations étaient arrêtées en réunions hebdomadaires ; les détails métier se réglaient au fil de l’eau avec Héloïse Dauvillaire.',

    /* ── Problème ── */
    problemTitle: 'Le problème et l’existant',
    problemLead:
      'Aujourd’hui, chaque intervention est notée sur une fiche papier, puis recopiée dans un tableur propre à chaque café, sans format commun. Cette fragmentation rend impossible tout partage d’expérience entre bénévoles, et rend les données inexploitables statistiquement.',
    existingBody:
      'J’ai étudié l’outil de référence mondial, Repair Monitor (Repair Café International Foundation), qui totalise environ 187 600 réparations pour 425 cafés en avril 2026. Mais il décrit la panne dans un champ de texte libre, sans vocabulaire contrôlé, sans le niveau du composant défaillant, et sans prévention des doublons. Son tableau de bord public propose huit visualisations figées. Ces limites ont directement orienté trois partis pris qui font l’originalité du projet :',
    partisPris: [
      {
        icon: '◧',
        title: 'Symptômes structurés',
        text: 'Trois zones distinctes (panne, observations sensorielles, historique d’usage) plutôt qu’un champ de texte libre.',
      },
      {
        icon: '⚙',
        title: 'Diagnostic au composant',
        text: 'Le défaut est rattaché au composant défaillant et classé par famille, une granularité absente de l’existant.',
      },
      {
        icon: '⧉',
        title: 'Anti-doublon actif',
        text: 'Un référentiel qui reste propre à la saisie, condition d’une comparaison fiable entre cafés.',
      },
    ],
    monitorStats: [
      { value: 187600, label: 'réparations mondiales' },
      { value: 425, label: 'cafés participants' },
      { value: 63, suffix: ' %', label: 'taux de réparation' },
    ] as StatItem[],

    /* ── Mission ── */
    missionTitle: 'La mission et son cadre',
    missionBody:
      'L’objectif fixé par l’équipe : remplacer les tableurs par une base commune et structurée, offrir deux interfaces (saisie et consultation/export), gérer plusieurs cafés avec des accès différenciés par rôle, et proposer cette aide au diagnostic fondée sur l’historique partagé.',
    missionConstraints: [
      {
        t: 'Les choix techniques, un livrable',
        d: 'Le sujet imposait de justifier framework et architecture au regard de l’évolutivité et de la reprise du code après mon départ.',
      },
      {
        t: 'Un code repris par d’autres',
        d: 'Contrainte forte dès le départ : un code clair, documenté, maintenable, à vocation ouverte (open source assumé, licence à finaliser).',
      },
      {
        t: 'Une architecture préparée',
        d: 'Monolithe pour maîtriser la complexité, mais exposant des endpoints pour préparer une évolution modulaire ultérieure.',
      },
    ],
    reductiveNote:
      'On résume souvent le projet à « six fonctionnalités » (F01 à F06). C’est très réducteur : derrière ces six briques vivent une quarantaine de règles métier formalisées, sept missions bonus documentées, et des dizaines de sous-fonctionnalités apparues en cours de route.',

    /* ── Deroulement ── */
    processTitle: 'Comment le stage s’est déroulé',
    processLead:
      'J’ai travaillé en cycles courts rythmés par les réunions hebdomadaires, selon un principe « la spécification d’abord » : mettre à jour le cahier des charges avant d’implémenter, puis réaligner diagrammes, wireframes et code. Un même changement métier se propageait ainsi partout.',
    phases: [
      {
        period: 'Sem. 1 à 2',
        tag: 'Analyse',
        kind: 'plan',
        title: 'Besoins et cahier des charges',
        text: 'Entretiens avec les encadrants, visites de Repair Cafés, étude de Repair Monitor, première version du cahier des charges (v8).',
      },
      {
        period: 'Sem. 2 à 3',
        tag: 'Conception',
        kind: 'plan',
        title: 'Modélisation',
        text: 'Diagrammes de cas d’utilisation, d’activité, d’états et de séquence, plus un diagramme entité-association en notation pied-de-corbeau. Wireframes de la cible UX.',
      },
      {
        period: 'Sem. 3 à 10',
        tag: 'Développement',
        kind: 'plan',
        title: 'Développement de F01 à F06',
        text: 'Fonctionnalité par fonctionnalité, avec le cahier des charges tenu vivant en parallèle (v9 à v14) et réaligné à chaque évolution.',
      },
      {
        period: 'Fin mai',
        tag: 'Ajout',
        kind: 'added',
        title: 'Audit de sécurité et durcissement',
        text: 'Mené de ma propre initiative, il chevauche le développement et débouche sur plusieurs lots de correctifs de sécurité.',
      },
      {
        period: 'Fin mai',
        tag: 'Ajout',
        kind: 'added',
        title: 'Audit ergonomique « Delight UX »',
        text: 'Cinquante-six opportunités d’amélioration priorisées : accessibilité, continuité de navigation, états vides guidés.',
      },
      {
        period: '2 juin',
        tag: 'IUT',
        kind: 'iut',
        title: 'Remise du mémoire de stage',
        text: 'Rédaction du rapport rendu à l’IUT, appuyé sur des références normatives (ISO 25010, ISO 27002) et académiques.',
      },
      {
        period: '22 juin',
        tag: 'IUT',
        kind: 'iut',
        title: 'Soutenance devant le jury',
        text: 'Présentation orale, cahier des charges devenu un site web avec diagrammes interactifs.',
      },
      {
        period: 'Juillet',
        tag: 'Validation',
        kind: 'added',
        title: 'Tests d’utilisabilité et déploiement',
        text: 'Campagne Think Aloud + SUS, correctifs des derniers points de friction, mise en production HTTPS sur une VM du laboratoire.',
      },
    ] as Phase[],
    cdcTitle: 'Un cahier des charges vivant',
    cdcBody:
      'Point dont je suis fier : mon cahier des charges n’est pas un document Word figé. Je l’ai commencé sous Word, puis transformé en véritable site web (HTML et React), hébergé en ligne, consultable par toute l’équipe à tout moment, avec des diagrammes recodés en interactif. Surtout, je l’ai gardé vivant, révisé de la version 8 à la version 14 jusqu’à la dernière semaine. Cette discipline a permis d’intégrer proprement les fonctionnalités apparues en cours de route.',

    /* ── Volet IUT ── */
    academicTitle: 'Le volet académique',
    academicLead:
      'En parallèle du développement, le stage est un exercice évalué du BUT Informatique de l’IUT2 de Grenoble (parcours Développement d’applications). Il se conclut par deux livrables devant un double regard : celui de la recherche et celui de l’enseignement.',
    academicItems: [
      {
        t: 'Le mémoire de stage',
        d: 'Un rapport rendu le 2 juin, qui présente le contexte, les choix techniques et les réalisations, et les inscrit dans des normes de qualité et de sécurité (ISO 25010, ISO 27002).',
      },
      {
        t: 'La soutenance',
        d: 'Une présentation orale le 22 juin devant un jury de trois membres, dont mon tuteur laboratoire et ma tutrice IUT.',
      },
      {
        t: 'Un double public',
        d: 'J’ai appris à argumenter mes choix devant des chercheurs et devant des utilisateurs finaux, les bénévoles seniors des cafés, avec des registres très différents.',
      },
    ],
    academicJury:
      'Jury de soutenance : M. Jean-Pierre Chevallet (IUT), Mme Amira Barhoumi (IUT), M. El-Haddi Mechekour (laboratoire).',

    /* ── F02 ── */
    diagTitle: 'F02 · L’aide au diagnostic',
    diagStar: 'La fonctionnalité vedette',
    diagLead:
      'Le point de départ est un constat de terrain, confirmé par la recherche : les réparateurs raisonnent par analogie, ils reconnaissent des symptômes déjà rencontrés. Repairtory leur propose, pendant la saisie, les cas similaires déjà résolus par l’ensemble des cafés. C’est la fonctionnalité que Repair Monitor, justement, ne propose pas.',
    diagKey:
      'Le cœur du système est un barème volontairement explicable : un simple score par somme pondérée, sans aucune intelligence artificielle. Chaque critère commun ajoute des points ; une fenêtre documente le calcul avec ses formules, pour une transparence totale envers le réparateur comme envers le futur mainteneur.',
    diagSimKicker: 'Essayez : composez un cas et regardez le score se construire',
    diag: {
      instruction: 'Activez les critères communs entre le cas saisi et un cas passé :',
      note: 'Le « même type d’objet » est la condition de base (+5) : seuls les cas résolus du même type sont comparés. Tri secondaire par date la plus récente.',
      crit: {
        type: 'Même type d’objet',
        fonction: 'Même fonction impactée',
        comportement: 'Même comportement',
        observations: 'Observations sensorielles',
        marque: 'Même marque',
        modele: 'Même modèle',
        composant: 'Même composant',
      },
      ringAria: (s: number, max: number) => `Score de correspondance : ${s} sur ${max} points`,
    } as DiagnosticCopy,
    diagWeights:
      'Les pondérations traduisent le pouvoir discriminant de chaque critère, pas leur simple disponibilité. Le type d’objet conditionne la recherche (5 points) ; la fonction impactée et le comportement décrivent la panne elle-même (3 points chacun) ; les observations sensorielles ajoutent jusqu’à 2 points, plafonnées pour ne pas écraser le symptôme principal ; la marque, le modèle et le composant ne valent qu’un point, car deux cafetières de marques différentes tombent souvent en panne de la même façon.',
    diagShotResults:
      'Résultats classés par pertinence : chaque cas passé affiche son anneau S/Sₘₐₓ, son diagnostic et son résultat.',
    diagShotModal:
      'La modale « Comprendre les scores » : barème pondéré et formules LaTeX, y compris la distance de Damerau-Levenshtein.',
    diagRejectedTitle: 'Pistes explorées puis écartées',
    diagRejectedIntro:
      'Avant d’arrêter ce choix, j’ai étudié plusieurs alternatives, et je les ai écartées pour des raisons documentées dans le cahier des charges :',
    diagRejected: [
      {
        t: 'Recherche sémantique (pgvector, embeddings)',
        d: 'Proposée en mission bonus. Corpus initial trop petit, coût d’inférence par saisie, et surtout des résultats opaques, incompatibles avec l’exigence d’explicabilité.',
      },
      {
        t: 'Recherche plein texte native (tsvector)',
        d: 'Plus légère, mais superflue au vu du faible volume de texte libre réellement comparable.',
      },
      {
        t: 'Trigrammes seuls (pg_trgm)',
        d: 'Jugés équivalents sans le barème métier, qui reste ce qui apporte le vrai pouvoir discriminant.',
      },
    ],
    diagLimits:
      'J’assume les limites : un type d’objet jamais saisi ne renvoie rien, et le score ne juge pas si le diagnostic passé était juste, ce que seule une relecture humaine corrige. La calibration empirique des poids sur données réelles fait partie des suites du projet.',

    /* ── F01 ── */
    saisieTitle: 'F01 · La saisie d’un cas',
    saisieLead:
      'Un même formulaire, alimenté par deux interfaces adaptées au terrain. Toute saisie commence par un rappel de la clause réglementaire : réparation bénévole, sans obligation de résultat, risque de dégradation possible.',
    saisieSteps: [
      {
        t: 'Produit et contexte',
        d: 'Catégorie, type d’objet, marque, modèle, plus l’historique d’usage (âge de l’objet, événements avant la panne).',
      },
      {
        t: 'Symptômes constatés',
        d: 'Trois zones indépendantes : description de la panne, observations sensorielles, comportement. Au moins une doit être renseignée.',
      },
      {
        t: 'Panne identifiée',
        d: 'Composant défectueux, défauts constatés classés par famille, et cause probable en texte libre optionnel.',
      },
      {
        t: 'Réparation et résultat',
        d: 'Actions réalisées, pièces éventuelles, puis résultat : objet fonctionnel, non fonctionnel, ou réparation en attente.',
      },
    ],
    saisieWizard: {
      t: 'Le Wizard',
      d: 'Un assistant pas-à-pas en quatre étapes, pensé pour le réparateur, avec rendu conditionnel des champs.',
    },
    saisieTableur: {
      t: 'La vue Tableur',
      d: 'Une grille condensée proche du formulaire papier, réservée au profil Accueil, pour saisir vite plusieurs objets en séance.',
    },
    saisiePoints: [
      'Règles métier vérifiées deux fois : côté saisie pour guider en temps réel, puis revalidées côté serveur pour garantir l’intégrité (dépendances conditionnelles, par exemple un comportement obligatoire dès qu’une fonction impactée est renseignée).',
      'Brouillon local sauvegardé automatiquement à chaque section : aucune perte si une séance est interrompue.',
      'Génération du PDF du formulaire papier depuis la version de schéma adoptée par le café, pour que papier et numérique restent cohérents.',
    ],
    saisieShotClause: 'Étape de clause : le visiteur est informé avant toute intervention.',
    saisieShotTableur:
      'La vue Tableur : une ligne par intervention, colonnes groupées par bloc métier.',

    /* ── Cycle de vie ── */
    lifecycleTitle: 'Le cycle de vie d’une intervention',
    lifecycleLead:
      'Une intervention n’est pas un simple enregistrement figé. Son cycle de vie, modélisé par un diagramme d’états, encadre qui peut modifier quoi et quand, pour protéger l’intégrité des statistiques historiques.',
    lifecycleFlow: [
      { s: 'Brouillon local', d: 'Sauvegardé dans le navigateur, jamais perdu.' },
      { s: 'Intervention soumise', d: 'Enregistrée en base, visible de tous les cafés.' },
    ],
    lifecycleOutcomes: [
      { s: 'Résultat final', d: 'Objet fonctionnel ou non fonctionnel.' },
      {
        s: 'Réparation en attente',
        d: 'Pièce à commander ; sa reprise crée une intervention liée.',
      },
    ],
    lifecycleBranch: 'L’intervention soumise aboutit à l’une des deux issues :',
    lifecycleOr: 'ou',
    lifecycleNotes: [
      'Une attente n’est jamais rouverte : sa reprise crée une nouvelle intervention liée à la précédente, pour comptabiliser deux séances distinctes.',
      'La modification reste ouverte vingt-quatre heures au Réparateur et à l’Accueil ; ensuite, seule la correction du bloc résultat par le Gestionnaire est permise.',
      'Une intervention provenant d’un autre Repair Café reste en lecture seule. Le retrait d’un cas sensible se fait par suppression logique, restaurable et journalisée.',
    ],

    /* ── Profils ── */
    profilesTitle: 'Cinq profils, une interface qui s’adapte',
    profilesLead:
      'L’authentification (F06) repose sur un compte partagé par café, décliné en sous-profils de session ; les comptes administrateurs restent strictement séparés. La session persiste trente jours, et la connexion est protégée contre la force brute par une temporisation progressive par couple (compte, IP), plutôt qu’un verrouillage sec qui gèlerait toute une séance. Chaque profil ne voit que ce dont il a besoin.',
    profilesTablabel: 'Profils utilisateurs de Repairtory',
    profiles: [
      {
        id: 'reparateur',
        tag: 'F01 · F02',
        name: 'Réparateur',
        role: 'Au cœur de la séance',
        blurb:
          'Saisit un cas via le Wizard, reprend une réparation en attente et consulte l’aide au diagnostic pour s’appuyer sur l’expérience de tous les cafés.',
        can: [
          'Saisie guidée (Wizard)',
          'Aide au diagnostic (F02)',
          'Reprise des réparations en attente',
        ],
        image: 'diagnostic',
        alt: 'Écran d’aide au diagnostic avec des cas similaires classés par score',
      },
      {
        id: 'accueil',
        tag: 'F01',
        name: 'Accueil',
        role: 'La saisie rapide',
        blurb:
          'Enregistre plusieurs objets en début de séance via la vue Tableur, plus proche du formulaire papier, ou en Wizard selon sa préférence.',
        can: ['Vue Tableur ou Wizard', 'Saisie multi-lignes', 'Reprise des cas en attente'],
        image: 'tableur',
        alt: 'Vue Tableur de saisie rapide, une ligne par intervention',
      },
      {
        id: 'gestionnaire',
        tag: 'F03',
        name: 'Gestionnaire',
        role: 'Le pilotage',
        blurb:
          'Suit l’activité de son café : statistiques, tableaux filtrables, bilans par séance, exports durables et graphiques personnalisables. Peut corriger le bloc résultat d’une intervention et gérer les valeurs de référentiel ajoutées par son café.',
        can: [
          'Tableau de bord et KPI',
          'Graphiques composables',
          'Exports documentés (CSV/JSON)',
          'Bilans de séance et journal d’activité',
        ],
        image: 'gestionnaire',
        alt: 'Tableau de bord du gestionnaire avec indicateurs et graphiques',
      },
      {
        id: 'public',
        tag: 'F04',
        name: 'Public',
        role: 'La vitrine anonymisée',
        blurb:
          'Un tableau de bord public, agrégé et totalement anonymisé (seuil de k-anonymat), sans jamais révéler l’identité des réparateurs, avec export du jeu de données ouvert.',
        can: ['Données agrégées', 'Anonymisation (k-anonymat)', 'Export ouvert CSV/JSON'],
        image: 'public',
        alt: 'Tableau de bord public anonymisé avec données agrégées',
      },
      {
        id: 'admin',
        tag: 'F05',
        name: 'Administrateur',
        role: 'La gouvernance',
        blurb:
          'Le back-office du laboratoire : comptes, Repair Cafés, référentiels, formulaire versionné, traductions et journal d’audit, entièrement pensé pour des non-techniciens.',
        can: [
          'Comptes et demandes de compte',
          'Référentiels et formulaire versionné',
          'Traductions (8 langues)',
          'Journal d’audit (ISO 27002)',
        ],
        image: 'admin-status',
        alt: 'Back-office d’administration, page de statut système',
      },
    ] as ProfileEntry[],

    /* ── Données ── */
    dataTitle: 'Le modèle de données et l’anti-doublon',
    dataLead:
      'Le cœur du travail. Une intervention se décrit en quatre temps : produit, symptômes (trois zones), diagnostic (composant et défauts par famille) et résultat, sur une trentaine de tables métier ayant évolué par 53 migrations SQL versionnées.',
    dataGuardsTitle: 'Des garde-fous dans la base elle-même',
    dataGuards:
      'Une part importante, peu visible, a consisté à poser l’intégrité directement en base : contraintes CHECK croisées (par exemple des pièces commandées uniquement sur une réparation en attente) et clés étrangères composites (une marque ne peut pas être incohérente avec un type d’objet). Les référentiels restent extensibles : un bénévole peut ajouter une valeur, immédiatement visible, qui sera ensuite revue au back-office.',
    dedupTitle: 'La prévention des doublons, la pièce dont je suis le plus fier',
    dedupBody:
      'Le risque : que deux bénévoles saisissent « Cafetière », « cafetiere » et « Café-tière » comme trois entrées distinctes. Chaque libellé est normalisé (minuscules, sans accent ni ponctuation) vers une forme de référence unique. À la saisie, une recherche floue maison, en deux temps, propose la bonne valeur existante :',
    dedupSteps: [
      {
        t: '1 · Présélection',
        d: 'La base présélectionne les candidats par similarité de trigrammes (extension pg_trgm de PostgreSQL), rapide sur toute la base.',
      },
      {
        t: '2 · Reclassement',
        d: 'Un classement plus fin combine égalité exacte, préfixe, sous-chaîne, recouvrement de mots et distance de Damerau-Levenshtein (fautes de frappe et inversions de lettres).',
      },
    ],
    dedupOutro:
      'Le tout déterministe, explicable, sans aucune IA, et complété par une gestion de synonymes. Le référentiel des types d’objets a par ailleurs été bâti à partir d’une taxonomie officielle de plus de 4 000 entrées brutes, ramenée par un nettoyage intensif (OpenRefine et traitement par lot) à 14 catégories exploitables.',
    taxo: { from: 4000, to: 14 },

    /* ── Back-office ── */
    backTitle: 'Un back-office pensé pour des non-techniciens',
    backLead:
      'L’administration (F05) est utilisée par l’encadrante du laboratoire, pas par un informaticien. J’ai donc remplacé les fenêtres prompt et confirm natives par des modales explicites, ajouté des panneaux d’aide contextuels et une page de guide, et soigné chaque libellé.',
    backFeatures: [
      {
        t: 'Demandes de compte',
        d: 'Flux complet : approuver en créant un café ou en liant à un existant, rejeter avec note, ou rejeter et bannir un e-mail. Domaines jetables bloqués.',
      },
      {
        t: 'Référentiels curatables',
        d: 'Revue, fusion, alias et masquage des valeurs proposées par les cafés, pour garder un vocabulaire propre.',
      },
      {
        t: 'Formulaire versionné',
        d: 'Le schéma de saisie est configurable et versionné ; chaque café adopte sa version, et les anciennes saisies gardent leur sens. Génération du PDF papier associé.',
      },
      {
        t: 'Traductions',
        d: 'Une interface de gestion des traductions, l’i18n couvrant huit langues (mission bonus BM-01 réalisée).',
      },
      {
        t: 'Journal d’audit',
        d: 'Toute action sensible est journalisée avec son auteur et son sous-profil (ISO 27002), pour la traçabilité et la non-répudiation.',
      },
      {
        t: 'Vue laboratoire',
        d: 'Une synthèse de l’activité par café, filtrable et exportable, pour l’équipe de recherche.',
      },
    ],

    /* ── Stack ── */
    stackTitle: 'Les choix techniques et l’architecture',
    stackLead:
      'Les choix techniques étaient un livrable à part entière. La décision structurante : un seul langage, TypeScript, du client au serveur.',
    stackDry:
      '1 source, 3 usages. Les types et les règles de validation (Zod) sont écrits une seule fois dans un domaine partagé, puis réutilisés côté formulaire, côté API et côté schéma de base. Quand le formulaire compte des dizaines de champs à dépendances conditionnelles, cela élimine le risque que client et serveur divergent, atout décisif quand on développe seul.',
    stackDjango:
      'Django (Python) a été envisagé pour son back-office presque clé en main, puis écarté : deux langages distincts, et la perte de l’avantage décisif des types partagés.',
    stackArchi:
      'Le backend est découpé en couches (routes, contrôleurs, repositories, base) avec un domaine partagé avec le frontend ; le serveur reste toujours l’autorité sur les règles, les droits critiques étant revalidés côté serveur derrière des routes protégées. Le déploiement s’appuie sur Docker et une intégration continue GitHub Actions sur un runner auto-hébergé du laboratoire, avec une étape de tests bloquante avant toute mise en production.',
    techTitle: 'La pile',
    tech: [
      { n: 'TypeScript', d: 'client + serveur' },
      { n: 'React + Vite', d: 'interface' },
      { n: 'Node + Express', d: 'autorité des règles' },
      { n: 'PostgreSQL 16', d: 'intégrité et analytique' },
      { n: 'Zod', d: 'validation partagée' },
      { n: 'Radix', d: 'accessibilité' },
      { n: 'Docker', d: 'conteneurisation' },
      { n: 'GitHub Actions', d: 'CI, gate de tests' },
    ],

    /* ── Qualité ── */
    qualityTitle: 'Sécurité, RGPD et qualité',
    qualityLead:
      'Le prototype a fait l’objet d’un audit complet suivi d’un vrai travail de durcissement, puis d’un audit ergonomique. Les décisions sont documentées et rattachées à des normes.',
    qualityCols: [
      {
        t: 'Durcissement de sécurité',
        items: [
          'Refus de démarrage en production si la configuration de sécurité est invalide',
          'Session revérifiée à chaque requête, login immunisé contre l’énumération de comptes',
          'JWT HS256, CORS strict, rate-limiting, anti-injection de formules dans les exports CSV',
          'Résidence des données en UE : autocomplétion ville basculée vers la Base Adresse Nationale',
        ],
      },
      {
        t: 'RGPD et conformité',
        items: [
          'Pages légales et politique de confidentialité (composant partagé)',
          'Politique de conservation limitée (art. 5.1.e) et anonymisation des comptes inactifs',
          'Suppression logique des données sensibles, sauvegardes chiffrées (RPO et RTO d’un jour)',
          'Séparation stricte des environnements de qualification et de production',
        ],
      },
      {
        t: 'Qualité et accessibilité',
        items: [
          '≈ 2 000 tests automatisés (unitaires, intégration, bout en bout), ≈ 96 % côté serveur',
          'Suite bloquante : si elle échoue, on ne déploie pas',
          'Chaque exigence non fonctionnelle associée à un critère de validation mesurable',
          'Accessibilité WCAG : combobox ARIA au clavier, focus visible, mode sombre et haut contraste',
        ],
      },
    ],
    qualityNorms:
      'Normes mobilisées : ISO 25010 (qualité et utilisabilité), ISO 27002 (sécurité de l’information), NIST SP 800-63B et recommandations CNIL/ANSSI (mots de passe), et le standard ORDS pour l’interopérabilité des données de réparation.',

    /* ── Eval ── */
    evalTitle: 'L’évaluation par les utilisateurs',
    evalBody:
      'J’ai conçu un protocole d’évaluation complet, un livrable en soi. Il combine la pensée à voix haute (Think Aloud) et le questionnaire standardisé SUS (System Usability Scale), sur des missions définies à l’avance.',
    evalSus: '77,7',
    evalSusLabel: '/ 100 · score SUS',
    evalSusHint: 'auprès de 12 participants',
    evalNuance:
      'Ces tests ont été menés avec douze volontaires du laboratoire, de métiers très variés. Le score réel auprès de bénévoles de Repair Cafés pourrait différer : plus haut, car ils sont familiers de la fiche et du déroulé d’une séance (la principale cause du peu de blocages) ; ou plus bas, un public souvent senior et moins ancré dans le numérique. L’application a aussi été montrée à des personnes de Repair Cafés, en exploration libre : les retours ont été très positifs.',

    /* ── Futur ── */
    futureTitle: 'Déploiement et perspectives',
    futureDeployTitle: 'Déployée, sécurisée, en attente d’ouverture',
    futureDeploy:
      'Repairtory tourne en production sur une machine virtuelle du laboratoire, en HTTPS. Elle est pour l’instant accessible via le VPN de l’INP, en attendant une réunion en septembre avec le délégué à la protection des données de l’UGA et la Cellule Données de Grenoble Alpes : elle tranchera les derniers points RGPD et le choix de la licence libre avant toute ouverture au public.',
    futureRoadmapTitle: 'La suite documentée',
    futureRoadmap: [
      'Calibration empirique des poids du diagnostic sur des données réelles, une fois l’historique constitué.',
      'Missions bonus prévues : import des bases existantes, QR codes de connexion, application installable hors-ligne (PWA), recherche sémantique, saisie hybride accueil vers réparateur, photos des interventions.',
      'Points ouverts à trancher avec le laboratoire : conformité au standard ORDS en export, et scénario d’ouverture des données publiques.',
    ],

    /* ── Compétences ── */
    skillsTitle: 'Ce que ce stage m’a apporté',
    skillsLead:
      'Un projet web complet, de l’analyse des besoins jusqu’au durcissement avant production, qui a mobilisé et fait progresser des compétences très diverses.',
    skillsGroups: [
      {
        t: 'Conception et données',
        items: [
          'Modèle relationnel garantissant l’intégrité de données hétérogènes',
          'Référentiels extensibles et anti-doublon',
          'Nettoyage d’une taxonomie de milliers d’entrées',
        ],
      },
      {
        t: 'Développement fullstack',
        items: [
          'TypeScript de bout en bout, types et validation partagés',
          'React, Node, Express, PostgreSQL',
          'Rendu conditionnel d’un formulaire complexe',
        ],
      },
      {
        t: 'Qualité et industrialisation',
        items: [
          'Audit de sécurité et durcissement',
          'Suite de tests et CI à gate bloquante',
          'Conteneurisation et déploiement, conformité RGPD',
        ],
      },
      {
        t: 'Conduite et communication',
        items: [
          'Faire vivre une spécification en cohérence avec le code',
          'Argumenter ses choix devant des chercheurs',
          'Présenter à un public non technicien et senior',
        ],
      },
    ],
    closing:
      'Ce stage m’a permis de transformer un savoir jusque-là oral et éparpillé en données fiables, partagées et exploitables, dans un projet pensé pour durer au-delà de mon départ. Il a confirmé mon goût pour le développement web orienté utilisateur, au service d’un usage réel et d’une dimension sociétale.',

    /* ── Galerie ── */
    galleryTitle: 'Galerie',
    galleryLead:
      'Quelques écrans supplémentaires, tous issus de captures fraîches du produit livré.',
    gallery: [
      {
        name: 'wizard-step',
        cap: 'Le Wizard en cours de saisie : première étape, produit et contexte.',
        w: 1600,
        h: 1000,
      },
      {
        name: 'diagnostic-full',
        cap: 'L’aide au diagnostic : liste complète des cas similaires trouvés.',
        w: 1400,
        h: 875,
      },
      {
        name: 'gestionnaire-tableau',
        cap: 'Tableau des interventions, filtrable et triable par le gestionnaire.',
        w: 1600,
        h: 1000,
      },
      {
        name: 'gestionnaire-export',
        cap: 'Exports documentés et durables (CSV / JSON).',
        w: 1600,
        h: 1000,
      },
      {
        name: 'pending',
        cap: 'Les réparations en attente, prêtes à être reprises.',
        w: 1600,
        h: 1000,
      },
      {
        name: 'admin-guide',
        cap: 'Page Guide du back-office, pensée pour des administrateurs non techniciens.',
        w: 1600,
        h: 1000,
      },
      {
        name: 'admin-traductions',
        cap: 'Gestion des traductions : l’i18n couvre huit langues.',
        w: 1600,
        h: 1000,
      },
      {
        name: 'admin-laboratoire',
        cap: 'Vue « Laboratoire » : activité par café pour l’équipe de recherche.',
        w: 1600,
        h: 1000,
      },
    ],

    cdcLink:
      'Le cahier des charges complet (spécification, diagrammes et wireframes) reste consultable en ligne.',
    cdcUrl: 'https://malevolentmoksi.github.io/cahier-des-charges-repair-cafe/#cahier',
  },

  en: {
    hookKicker: 'The anecdote that says it all',
    hook: '“79 ways to spell the same object.”',
    hookBody:
      'In a single Repair Café spreadsheet, I found seventy-nine different spellings of “coffee maker”. A precious repair know-how, but scattered, local and impossible to share. For twelve weeks at the G-SCOP research lab, I designed and built, alone, the web application that answers it: Repairtory.',
    metaChips: [
      { k: 'Role', v: 'Sole developer, 100 % of the code' },
      { k: 'Duration', v: '12 weeks, 20 Apr to 10 Jul 2026' },
      { k: 'Host', v: 'G-SCOP research lab (CNRS · Grenoble INP · UGA)' },
      { k: 'Context', v: '2nd-year internship, BUT Computer Science (IUT2 Grenoble)' },
    ],
    heroAlt: 'Repairtory login screen: brand identity, G-SCOP lab and live statistics',
    scrollCue: 'Explore the project',

    statsKicker: 'The internship in numbers (final state, 10 July 2026)',
    stats: [
      {
        value: 100,
        suffix: ' %',
        label: 'of the code written solo',
        hint: '0 developers among supervisors',
      },
      { value: 137, label: 'API endpoints', hint: '11 routers' },
      { value: 53, label: 'SQL migrations', hint: '52 tables in the database' },
      { value: 8, label: 'languages shipped', hint: 'full i18n' },
      { value: 2000, prefix: '≈ ', label: 'automated tests', hint: '≈ 96 % server-side' },
      { value: 40, label: 'business rules', hint: '+ 7 bonus missions' },
      { value: 562, label: 'commits', hint: '2 repos, code + spec' },
      { value: 77.7, decimals: 1, label: 'SUS usability score', hint: '12 participants' },
    ] as StatItem[],

    contextTitle: 'The setting: a lab, a PhD, and workshops',
    contextLead:
      'This internship did not come out of nowhere. It is part of a research project at the G-SCOP lab, serving a very real network of volunteer workshops: Grenoble’s Repair Cafés.',
    contextRC:
      'A Repair Café is a volunteer workshop where you fix an object rather than throw it away, against waste and obsolescence. The Grenoble area has sixteen of them, four of which are pilots for this project: Grenoble Centre (which provides the reference paper form), Pinal and Saint-Égrève (visited in the field) and Fontaine.',
    contextLabTitle: 'The G-SCOP laboratory',
    contextLab:
      'G-SCOP (Sciences for Design, Optimisation and Production) is a joint research unit under the University Grenoble Alpes, Grenoble INP and the CNRS, with 168 people at the end of 2024. I joined the CIPP team (Product-Process Design and Integration), around twenty people, one of whose focuses is knowledge formalisation: turning know-how into structured, shareable knowledge. That is exactly the project’s purpose.',
    contextThesis:
      'The project is attached to Héloïse Dauvillaire’s PhD, on improving diagnosis in Repair Cafés through structured data collection. It builds on a research finding: faults in consumer products are hard to diagnose, and repairers reason mostly by analogy, recognising cases they have seen before.',
    contextTeamTitle: 'Supervised by researchers, not developers',
    team: [
      {
        name: 'Héloïse Dauvillaire',
        role: 'PhD student, day-to-day contact',
        note: 'Project attached to her thesis',
      },
      { name: 'El-Haddi Mechekour', role: 'Senior lecturer, official tutor' },
      { name: 'Cédric Masclet', role: 'University professor' },
      { name: 'Amira Barhoumi', role: 'IUT2 Grenoble tutor' },
    ],
    contextTeamNote:
      'None of my supervisors is a software developer: they are researchers in design and industrial engineering. So I wrote 100 % of the code, alone. The lab’s IT service (SMIT) only assisted with deployment. Direction was set in weekly meetings; business details were settled continuously with Héloïse Dauvillaire.',

    problemTitle: 'The problem and the prior art',
    problemLead:
      'Today, each repair is logged on paper, then re-typed into a spreadsheet specific to each café, with no shared format. This fragmentation makes any experience sharing between volunteers impossible, and the data statistically unusable.',
    existingBody:
      'I studied the world reference tool, Repair Monitor (Repair Café International Foundation), which holds about 187,600 repairs across 425 cafés in April 2026. But it describes faults in a free-text field, with no controlled vocabulary, no failing-component level, and no duplicate prevention. Its public dashboard offers eight fixed visualisations. These limits directly shaped three design stances that make the project original:',
    partisPris: [
      {
        icon: '◧',
        title: 'Structured symptoms',
        text: 'Three distinct zones (fault, sensory observations, usage history) instead of a free-text field.',
      },
      {
        icon: '⚙',
        title: 'Component-level diagnosis',
        text: 'The defect is tied to the failing component and classed by family, a granularity absent from the prior art.',
      },
      {
        icon: '⧉',
        title: 'Active de-duplication',
        text: 'A referential that stays clean at entry time, the prerequisite for reliable cross-café comparison.',
      },
    ],
    monitorStats: [
      { value: 187600, label: 'repairs worldwide' },
      { value: 425, label: 'participating cafés' },
      { value: 63, suffix: ' %', label: 'repair rate' },
    ] as StatItem[],

    missionTitle: 'The mission and its constraints',
    missionBody:
      'The goal set by the team: replace the spreadsheets with a shared, structured database; provide two interfaces (entry and consultation/export); manage several cafés with role-based access; and offer this diagnostic aid drawing on the shared history.',
    missionConstraints: [
      {
        t: 'Technical choices as a deliverable',
        d: 'The brief required justifying framework and architecture against maintainability and code handover after my departure.',
      },
      {
        t: 'Code taken over by others',
        d: 'A strong constraint from the start: clear, documented, maintainable code, meant to be open (open source assumed, licence to be finalised).',
      },
      {
        t: 'An architecture prepared to grow',
        d: 'A monolith to master complexity, but exposing endpoints to prepare a later modular evolution.',
      },
    ],
    reductiveNote:
      'The project is often reduced to “six features” (F01 to F06). That is very reductive: behind those six bricks live around forty formalised business rules, seven documented bonus missions, and dozens of sub-features that appeared along the way.',

    processTitle: 'How the internship unfolded',
    processLead:
      'I worked in short cycles paced by weekly meetings, on a “spec first” principle: update the specification before implementing, then realign diagrams, wireframes and code. A single business change thus propagated everywhere.',
    phases: [
      {
        period: 'Wk 1 to 2',
        tag: 'Analysis',
        kind: 'plan',
        title: 'Needs and specification',
        text: 'Interviews with supervisors, Repair Café visits, study of Repair Monitor, first version of the specification (v8).',
      },
      {
        period: 'Wk 2 to 3',
        tag: 'Design',
        kind: 'plan',
        title: 'Modelling',
        text: 'Use-case, activity, state and sequence diagrams, plus an entity-relationship diagram in crow’s-foot notation. UX target wireframes.',
      },
      {
        period: 'Wk 3 to 10',
        tag: 'Development',
        kind: 'plan',
        title: 'Building F01 to F06',
        text: 'Feature by feature, with the specification kept alive in parallel (v9 to v14) and realigned at each change.',
      },
      {
        period: 'Late May',
        tag: 'Added',
        kind: 'added',
        title: 'Security audit and hardening',
        text: 'Run on my own initiative, overlapping development, leading to several security fix batches.',
      },
      {
        period: 'Late May',
        tag: 'Added',
        kind: 'added',
        title: '“Delight UX” ergonomics audit',
        text: 'Fifty-six prioritised improvement opportunities: accessibility, navigation continuity, guided empty states.',
      },
      {
        period: '2 Jun',
        tag: 'IUT',
        kind: 'iut',
        title: 'Internship report submitted',
        text: 'Report handed to the IUT, grounded in quality and security standards (ISO 25010, ISO 27002) and academic references.',
      },
      {
        period: '22 Jun',
        tag: 'IUT',
        kind: 'iut',
        title: 'Defense before the jury',
        text: 'Oral presentation, with the specification turned into a website with interactive diagrams.',
      },
      {
        period: 'July',
        tag: 'Validation',
        kind: 'added',
        title: 'Usability tests and deployment',
        text: 'Think Aloud + SUS campaign, fixes for the last friction points, HTTPS deployment on a lab VM.',
      },
    ] as Phase[],
    cdcTitle: 'A living specification',
    cdcBody:
      'A point I am proud of: my specification is not a frozen Word document. I started it in Word, then turned it into a real website (HTML and React), hosted online, available to the whole team at any time, with diagrams re-coded as interactive. Above all, I kept it alive, revised from version 8 to version 14 up to the final week. This discipline let features that appeared along the way be integrated cleanly.',

    academicTitle: 'The academic side',
    academicLead:
      'Alongside development, the internship is a graded exercise of the IUT2 Grenoble Computer Science degree (Application Development track). It concludes with two deliverables before a dual audience: research and teaching.',
    academicItems: [
      {
        t: 'The internship report',
        d: 'A report submitted on 2 June, presenting the context, the technical choices and the achievements, grounded in quality and security standards (ISO 25010, ISO 27002).',
      },
      {
        t: 'The defense',
        d: 'An oral presentation on 22 June before a three-member jury, including my lab tutor and my IUT tutor.',
      },
      {
        t: 'A dual audience',
        d: 'I learned to argue my choices before researchers and before end users, the senior café volunteers, in very different registers.',
      },
    ],
    academicJury:
      'Defense jury: Mr Jean-Pierre Chevallet (IUT), Ms Amira Barhoumi (IUT), Mr El-Haddi Mechekour (lab).',

    diagTitle: 'F02 · The diagnostic aid',
    diagStar: 'The flagship feature',
    diagLead:
      'The starting point is a field observation, confirmed by research: repairers reason by analogy, they recognise symptoms they have seen before. Repairtory offers them, during entry, similar cases already solved across all the cafés. It is precisely the feature Repair Monitor does not provide.',
    diagKey:
      'The heart of the system is a deliberately explainable scale: a simple weighted-sum score, with no artificial intelligence whatsoever. Each shared criterion adds points; a modal documents the calculation with its formulas, for full transparency to the repairer and to the future maintainer alike.',
    diagSimKicker: 'Try it: compose a case and watch the score build up',
    diag: {
      instruction: 'Toggle the criteria shared between the entered case and a past case:',
      note: 'The “same object type” is the base condition (+5): only solved cases of the same type are compared. Secondary sort by most recent date.',
      crit: {
        type: 'Same object type',
        fonction: 'Same impacted function',
        comportement: 'Same behaviour',
        observations: 'Sensory observations',
        marque: 'Same brand',
        modele: 'Same model',
        composant: 'Same component',
      },
      ringAria: (s: number, max: number) => `Match score: ${s} out of ${max} points`,
    } as DiagnosticCopy,
    diagWeights:
      'The weights reflect each criterion’s discriminating power, not merely its availability. The object type conditions the search (5 points); the impacted function and behaviour describe the fault itself (3 points each); sensory observations add up to 2 points, capped so they do not overwhelm the main symptom; brand, model and component are worth just one point, since two coffee makers of different brands often fail the same way.',
    diagShotResults:
      'Results ranked by relevance: each past case shows its S/Sₘₐₓ ring, its diagnosis and its outcome.',
    diagShotModal:
      'The “Understand the scores” modal: weighted scale and LaTeX formulas, including the Damerau-Levenshtein distance.',
    diagRejectedTitle: 'Approaches explored, then set aside',
    diagRejectedIntro:
      'Before settling on this design, I studied several alternatives, and rejected them for reasons documented in the specification:',
    diagRejected: [
      {
        t: 'Semantic search (pgvector, embeddings)',
        d: 'Proposed as a bonus mission. Initial corpus too small, per-entry inference cost, and above all opaque results, incompatible with the explainability requirement.',
      },
      {
        t: 'Native full-text search (tsvector)',
        d: 'Lighter, but superfluous given the low volume of truly comparable free text.',
      },
      {
        t: 'Trigrams alone (pg_trgm)',
        d: 'Judged equivalent without the business scale, which is what provides the real discriminating power.',
      },
    ],
    diagLimits:
      'I own the limits: an object type never entered returns nothing, and the score does not judge whether the past diagnosis was correct, which only a human review fixes. Empirically calibrating the weights on real data is part of the project’s follow-ups.',

    saisieTitle: 'F01 · Entering a case',
    saisieLead:
      'A single form, fed by two field-adapted interfaces. Every entry starts with a reminder of the regulatory clause: volunteer repair, no obligation of result, possible risk of further damage.',
    saisieSteps: [
      {
        t: 'Product and context',
        d: 'Category, object type, brand, model, plus usage history (object age, events before the fault).',
      },
      {
        t: 'Observed symptoms',
        d: 'Three independent zones: fault description, sensory observations, behaviour. At least one must be filled.',
      },
      {
        t: 'Identified fault',
        d: 'Faulty component, observed defects classed by family, and an optional free-text probable cause.',
      },
      {
        t: 'Repair and result',
        d: 'Actions taken, any parts, then the result: object functional, non-functional, or repair pending.',
      },
    ],
    saisieWizard: {
      t: 'The Wizard',
      d: 'A step-by-step assistant in four stages, designed for the repairer, with conditional field rendering.',
    },
    saisieTableur: {
      t: 'The Spreadsheet view',
      d: 'A condensed grid close to the paper form, reserved for the Front-desk profile, to quickly log several objects during a session.',
    },
    saisiePoints: [
      'Business rules checked twice: at entry to guide in real time, then revalidated server-side to guarantee integrity (conditional dependencies, e.g. a behaviour required once an impacted function is set).',
      'Local draft saved automatically at each section: nothing is lost if a session is interrupted.',
      'Paper-form PDF generated from the schema version adopted by the café, so paper and digital stay consistent.',
    ],
    saisieShotClause: 'Clause step: the visitor is informed before any intervention.',
    saisieShotTableur:
      'The Spreadsheet view: one row per repair, columns grouped by business block.',

    lifecycleTitle: 'The lifecycle of a repair',
    lifecycleLead:
      'A repair is not a frozen record. Its lifecycle, modelled by a state diagram, frames who can change what and when, to protect the integrity of historical statistics.',
    lifecycleFlow: [
      { s: 'Local draft', d: 'Saved in the browser, never lost.' },
      { s: 'Submitted repair', d: 'Stored in the database, visible to all cafés.' },
    ],
    lifecycleOutcomes: [
      { s: 'Final result', d: 'Object functional or non-functional.' },
      { s: 'Repair pending', d: 'Part to order; resuming it creates a linked repair.' },
    ],
    lifecycleBranch: 'The submitted repair reaches one of two outcomes:',
    lifecycleOr: 'or',
    lifecycleNotes: [
      'A pending repair is never reopened: resuming it creates a new repair linked to the previous one, to count two distinct sessions.',
      'Editing stays open for twenty-four hours to the Repairer and Front-desk; afterwards, only the Manager may correct the result block.',
      'A repair from another Repair Café stays read-only. Removing a sensitive case is done by logical deletion, restorable and logged.',
    ],

    profilesTitle: 'Five profiles, one interface that adapts',
    profilesLead:
      'Authentication (F06) relies on a shared account per café, split into session sub-profiles; administrator accounts stay strictly separate. The session persists for thirty days, and login is protected against brute force by a progressive delay per (account, IP) pair, rather than a hard lockout that would freeze a whole session. Each profile only sees what it needs.',
    profilesTablabel: 'Repairtory user profiles',
    profiles: [
      {
        id: 'reparateur',
        tag: 'F01 · F02',
        name: 'Repairer',
        role: 'At the heart of the session',
        blurb:
          'Enters a case via the Wizard, resumes a pending repair, and consults the diagnostic aid to draw on the experience of every café.',
        can: ['Guided entry (Wizard)', 'Diagnostic aid (F02)', 'Resume pending repairs'],
        image: 'diagnostic',
        alt: 'Diagnostic aid screen with similar cases ranked by score',
      },
      {
        id: 'accueil',
        tag: 'F01',
        name: 'Front desk',
        role: 'Rapid entry',
        blurb:
          'Logs several objects at the start of a session via the Spreadsheet view, closer to the paper form, or via the Wizard depending on preference.',
        can: ['Spreadsheet or Wizard', 'Multi-row entry', 'Resume pending cases'],
        image: 'tableur',
        alt: 'Spreadsheet rapid-entry view, one row per repair',
      },
      {
        id: 'gestionnaire',
        tag: 'F03',
        name: 'Manager',
        role: 'Steering',
        blurb:
          'Tracks the café’s activity: statistics, filterable tables, per-session summaries, durable exports and customisable charts. Can correct a repair’s result block and manage the referential values added by their café.',
        can: [
          'Dashboard and KPIs',
          'Composable charts',
          'Documented exports (CSV/JSON)',
          'Session summaries and activity log',
        ],
        image: 'gestionnaire',
        alt: 'Manager dashboard with indicators and charts',
      },
      {
        id: 'public',
        tag: 'F04',
        name: 'Public',
        role: 'The anonymised showcase',
        blurb:
          'A public dashboard, aggregated and fully anonymised (k-anonymity threshold), never revealing repairer identities, with open dataset export.',
        can: ['Aggregated data', 'Anonymisation (k-anonymity)', 'Open CSV/JSON export'],
        image: 'public',
        alt: 'Anonymised public dashboard with aggregated data',
      },
      {
        id: 'admin',
        tag: 'F05',
        name: 'Administrator',
        role: 'Governance',
        blurb:
          'The lab’s back-office: accounts, Repair Cafés, referentials, versioned form, translations and audit log, entirely designed for non-technical users.',
        can: [
          'Accounts and account requests',
          'Referentials and versioned form',
          'Translations (8 languages)',
          'Audit log (ISO 27002)',
        ],
        image: 'admin-status',
        alt: 'Administration back-office, system status page',
      },
    ] as ProfileEntry[],

    dataTitle: 'The data model and de-duplication',
    dataLead:
      'The core of the work. A repair is described in four moments: product, symptoms (three zones), diagnosis (component and defects by family) and result, across about thirty domain tables evolved through 53 versioned SQL migrations.',
    dataGuardsTitle: 'Guardrails inside the database itself',
    dataGuards:
      'A large, low-visibility part of the work was putting integrity straight into the database: cross CHECK constraints (e.g. parts ordered only on a pending repair) and composite foreign keys (a brand cannot be inconsistent with an object type). Referentials stay extensible: a volunteer can add a value, immediately visible, later reviewed in the back-office.',
    dedupTitle: 'Duplicate prevention, the part I am proudest of',
    dedupBody:
      'The risk: two volunteers entering “Coffee maker”, “coffeemaker” and “Coffee-maker” as three distinct entries. Each label is normalised (lowercase, no accents or punctuation) into a single reference form. At entry time, a home-grown two-stage fuzzy search suggests the right existing value:',
    dedupSteps: [
      {
        t: '1 · Pre-selection',
        d: 'The database pre-selects candidates by trigram similarity (PostgreSQL’s pg_trgm extension), fast across the whole base.',
      },
      {
        t: '2 · Re-ranking',
        d: 'A finer ranking combines exact match, prefix, substring, word overlap and Damerau-Levenshtein distance (typos and letter swaps).',
      },
    ],
    dedupOutro:
      'All deterministic, explainable, with no AI, and complemented by synonym management. The object-type referential was also built from an official taxonomy of 4,000+ raw entries, cleaned intensively (OpenRefine and batch processing) down to 14 usable categories.',
    taxo: { from: 4000, to: 14 },

    backTitle: 'A back-office designed for non-technical users',
    backLead:
      'The administration (F05) is used by the lab supervisor, not by an IT engineer. So I replaced native prompt and confirm windows with explicit modals, added contextual help panels and a guide page, and polished every label.',
    backFeatures: [
      {
        t: 'Account requests',
        d: 'Full flow: approve by creating a café or linking to an existing one, reject with a note, or reject and ban an email. Disposable domains blocked.',
      },
      {
        t: 'Curatable referentials',
        d: 'Review, merge, alias and hide the values proposed by cafés, to keep a clean vocabulary.',
      },
      {
        t: 'Versioned form',
        d: 'The entry schema is configurable and versioned; each café adopts its version, and old entries keep their meaning. Associated paper-form PDF generation.',
      },
      {
        t: 'Translations',
        d: 'A translation management interface, i18n covering eight languages (bonus mission BM-01 delivered).',
      },
      {
        t: 'Audit log',
        d: 'Every sensitive action is logged with its author and sub-profile (ISO 27002), for traceability and non-repudiation.',
      },
      {
        t: 'Laboratory view',
        d: 'A per-café activity summary, filterable and exportable, for the research team.',
      },
    ],

    stackTitle: 'Technical choices and architecture',
    stackLead:
      'The technical choices were a deliverable in their own right. The structuring decision: a single language, TypeScript, from client to server.',
    stackDry:
      '1 source, 3 uses. Types and validation rules (Zod) are written once in a shared domain, then reused by the form, the API and the database schema. When the form has dozens of fields with conditional dependencies, this eliminates any risk of client and server diverging, a decisive asset when working solo.',
    stackDjango:
      'Django (Python) was considered for its near-turnkey back-office, then set aside: two separate languages, and the loss of the decisive advantage of shared types.',
    stackArchi:
      'The backend is split into layers (routes, controllers, repositories, database) with a domain shared with the frontend; the server always remains the authority on the rules, critical permissions revalidated server-side behind protected routes. Deployment relies on Docker and GitHub Actions continuous integration on a self-hosted lab runner, with a blocking test step before any production release.',
    techTitle: 'The stack',
    tech: [
      { n: 'TypeScript', d: 'client + server' },
      { n: 'React + Vite', d: 'interface' },
      { n: 'Node + Express', d: 'authority on rules' },
      { n: 'PostgreSQL 16', d: 'integrity and analytics' },
      { n: 'Zod', d: 'shared validation' },
      { n: 'Radix', d: 'accessibility' },
      { n: 'Docker', d: 'containerisation' },
      { n: 'GitHub Actions', d: 'CI, test gate' },
    ],

    qualityTitle: 'Security, GDPR and quality',
    qualityLead:
      'The prototype went through a full audit followed by real hardening, then an ergonomics audit. The decisions are documented and tied to standards.',
    qualityCols: [
      {
        t: 'Security hardening',
        items: [
          'Refuses to start in production if the security configuration is invalid',
          'Session re-verified on every request, login immune to account enumeration',
          'JWT HS256, strict CORS, rate-limiting, CSV formula-injection prevention',
          'EU data residency: city autocomplete moved to the French national address base',
        ],
      },
      {
        t: 'GDPR and compliance',
        items: [
          'Legal notice and privacy policy (shared component)',
          'Limited retention policy (art. 5.1.e) and anonymisation of inactive accounts',
          'Logical deletion of sensitive data, encrypted backups (one-day RPO and RTO)',
          'Strict separation of staging and production environments',
        ],
      },
      {
        t: 'Quality and accessibility',
        items: [
          '≈ 2,000 automated tests (unit, integration, end-to-end), ≈ 96 % server-side',
          'Blocking suite: if it fails, we do not deploy',
          'Every non-functional requirement tied to a measurable validation criterion',
          'WCAG accessibility: ARIA keyboard combobox, visible focus, dark and high-contrast modes',
        ],
      },
    ],
    qualityNorms:
      'Standards used: ISO 25010 (quality and usability), ISO 27002 (information security), NIST SP 800-63B and CNIL/ANSSI guidance (passwords), and the ORDS standard for repair-data interoperability.',

    evalTitle: 'Evaluation by users',
    evalBody:
      'I designed a complete evaluation protocol, a deliverable in itself. It combines Think Aloud with the standardised SUS questionnaire (System Usability Scale), over pre-defined missions.',
    evalSus: '77.7',
    evalSusLabel: '/ 100 · SUS score',
    evalSusHint: 'with 12 participants',
    evalNuance:
      'These tests were run with twelve lab volunteers from very varied backgrounds. The real score among Repair Café volunteers could differ: higher, as they are familiar with the form and the flow of a session (the main reason for the few blockers); or lower, an often-senior audience less anchored in technology. The app was also shown to Repair Café members, in free exploration: the feedback was very positive.',

    futureTitle: 'Deployment and outlook',
    futureDeployTitle: 'Deployed, secured, awaiting opening',
    futureDeploy:
      'Repairtory runs in production on a lab virtual machine, over HTTPS. For now it is reachable through the INP VPN, pending a September meeting with the UGA’s data protection officer and the Grenoble Alpes Data Cell: it will settle the final GDPR points and the choice of open-source licence before any public opening.',
    futureRoadmapTitle: 'The documented follow-ups',
    futureRoadmap: [
      'Empirical calibration of the diagnostic weights on real data, once history has built up.',
      'Planned bonus missions: import of existing databases, QR login codes, installable offline app (PWA), semantic search, hybrid front-desk to repairer entry, repair photos.',
      'Open points to settle with the lab: ORDS export conformity, and the public data opening scenario.',
    ],

    skillsTitle: 'What this internship taught me',
    skillsLead:
      'A complete web project, from needs analysis to pre-production hardening, which mobilised and grew a wide range of skills.',
    skillsGroups: [
      {
        t: 'Design and data',
        items: [
          'Relational model guaranteeing the integrity of heterogeneous data',
          'Extensible referentials and de-duplication',
          'Cleaning a taxonomy of thousands of entries',
        ],
      },
      {
        t: 'Full-stack development',
        items: [
          'End-to-end TypeScript, shared types and validation',
          'React, Node, Express, PostgreSQL',
          'Conditional rendering of a complex form',
        ],
      },
      {
        t: 'Quality and industrialisation',
        items: [
          'Security audit and hardening',
          'Test suite and CI with a blocking gate',
          'Containerisation and deployment, GDPR compliance',
        ],
      },
      {
        t: 'Leadership and communication',
        items: [
          'Keeping a specification consistent with the code',
          'Arguing choices before researchers',
          'Presenting to a non-technical, senior audience',
        ],
      },
    ],
    closing:
      'This internship let me turn know-how that was until then oral and scattered into reliable, shared, exploitable data, in a project built to outlast my departure. It confirmed my taste for user-oriented web development, serving a real use with a societal dimension.',

    galleryTitle: 'Gallery',
    galleryLead: 'A few extra screens, all from fresh captures of the delivered product.',
    gallery: [
      {
        name: 'wizard-step',
        cap: 'The Wizard mid-entry: first step, product and context.',
        w: 1600,
        h: 1000,
      },
      {
        name: 'diagnostic-full',
        cap: 'The diagnostic aid: full list of similar cases found.',
        w: 1400,
        h: 875,
      },
      {
        name: 'gestionnaire-tableau',
        cap: 'Interventions table, filterable and sortable by the manager.',
        w: 1600,
        h: 1000,
      },
      {
        name: 'gestionnaire-export',
        cap: 'Documented, durable exports (CSV / JSON).',
        w: 1600,
        h: 1000,
      },
      { name: 'pending', cap: 'Pending repairs, ready to be resumed.', w: 1600, h: 1000 },
      {
        name: 'admin-guide',
        cap: 'Back-office Guide page, designed for non-technical admins.',
        w: 1600,
        h: 1000,
      },
      {
        name: 'admin-traductions',
        cap: 'Translation management: i18n covers eight languages.',
        w: 1600,
        h: 1000,
      },
      {
        name: 'admin-laboratoire',
        cap: '“Laboratory” view: activity per café for the research team.',
        w: 1600,
        h: 1000,
      },
    ],

    cdcLink: 'The full specification (spec, diagrams and wireframes) remains available online.',
    cdcUrl: 'https://malevolentmoksi.github.io/cahier-des-charges-repair-cafe/#cahier',
  },
};

/* ══════════════════════════════════════════════════════════════
   Page
   ══════════════════════════════════════════════════════════════ */
const ProjetStage = () => {
  const { i18n } = useTranslation();
  const lang: Lang = (i18n.language || i18n.resolvedLanguage || 'fr').toLowerCase().startsWith('en')
    ? 'en'
    : 'fr';
  const c = COPY[lang];
  const contentRef = useRef<HTMLElement>(null);
  useReadingTimeEstimate(contentRef);

  return (
    <>
      <article className="project-article stage" ref={contentRef}>
        {/* ── Hero ─────────────────────────────────────────── */}
        <section className="stage-hero" aria-label="Repairtory">
          <div className="stage-hero-text">
            <p className="stage-eyebrow">{c.hookKicker}</p>
            <p className="stage-hook">{c.hook}</p>
            <p className="stage-hook-body">{c.hookBody}</p>
            <dl className="stage-meta">
              {c.metaChips.map((m) => (
                <div className="stage-meta-item" key={m.k}>
                  <dt>{m.k}</dt>
                  <dd>{m.v}</dd>
                </div>
              ))}
            </dl>
          </div>
          <figure className="stage-hero-shot">
            <img
              src={img('login')}
              alt={c.heroAlt}
              className="zoomable"
              loading="eager"
              width="1800"
              height="1125"
            />
          </figure>
          <p className="stage-scroll-cue" aria-hidden="true">
            {c.scrollCue} <span>↓</span>
          </p>
        </section>

        {/* ── Stat band ────────────────────────────────────── */}
        <section className="stage-stats-section">
          <StatBand items={c.stats} kicker={c.statsKicker} />
        </section>

        {/* ── Contexte ─────────────────────────────────────── */}
        <section className="stage-context">
          <h2>{c.contextTitle}</h2>
          <p className="stage-lead">{c.contextLead}</p>
          <p>{c.contextRC}</p>
          <h3>{c.contextLabTitle}</h3>
          <p>{c.contextLab}</p>
          <p>{c.contextThesis}</p>
          <h3>{c.contextTeamTitle}</h3>
          <TeamGrid members={c.team} />
          <p className="stage-team-note">{c.contextTeamNote}</p>
        </section>

        {/* ── Problème ─────────────────────────────────────── */}
        <section className="stage-problem">
          <h2>{c.problemTitle}</h2>
          <p className="stage-lead">{c.problemLead}</p>
          <p>{c.existingBody}</p>
          <Pillars
            items={c.partisPris.map((p) => ({ icon: p.icon, title: p.title, text: p.text }))}
          />
          <div className="stage-mini-stats">
            {c.monitorStats.map((s) => (
              <div className="stage-mini-stat" key={s.label}>
                <AnimatedNumber value={s.value} suffix={s.suffix} run />
                <span>{s.label}</span>
              </div>
            ))}
          </div>
        </section>

        {/* ── Mission ──────────────────────────────────────── */}
        <section className="stage-mission">
          <h2>{c.missionTitle}</h2>
          <p className="stage-lead">{c.missionBody}</p>
          <FeatureList items={c.missionConstraints} />
          <blockquote className="stage-callout stage-callout--solo">{c.reductiveNote}</blockquote>
        </section>

        {/* ── Déroulement ──────────────────────────────────── */}
        <section className="stage-process">
          <h2>{c.processTitle}</h2>
          <p className="stage-lead">{c.processLead}</p>
          <Timeline phases={c.phases} />
          <div className="stage-cdc">
            <strong>{c.cdcTitle}</strong>
            <p>{c.cdcBody}</p>
          </div>
        </section>

        {/* ── Volet académique ─────────────────────────────── */}
        <section className="stage-academic">
          <h2>{c.academicTitle}</h2>
          <p className="stage-lead">{c.academicLead}</p>
          <FeatureList items={c.academicItems} />
          <p className="stage-jury">{c.academicJury}</p>
        </section>

        {/* ── F02 diagnostic ★ ─────────────────────────────── */}
        <section className="stage-diagnostic">
          <p className="stage-star-badge">★ {c.diagStar}</p>
          <h2>{c.diagTitle}</h2>
          <p className="stage-lead">{c.diagLead}</p>
          <p>{c.diagKey}</p>

          <p className="stage-sim-kicker">{c.diagSimKicker}</p>
          <DiagnosticSimulator c={c.diag} />
          <p>{c.diagWeights}</p>

          <div className="stage-shot-duo">
            <Shot name="diagnostic" caption={c.diagShotResults} />
            <Shot name="diagnostic-score" caption={c.diagShotModal} />
          </div>

          <div className="stage-rejected">
            <h3>{c.diagRejectedTitle}</h3>
            <p>{c.diagRejectedIntro}</p>
            <ul className="stage-rejected-list">
              {c.diagRejected.map((r) => (
                <li key={r.t}>
                  <strong>{r.t}</strong>
                  <span>{r.d}</span>
                </li>
              ))}
            </ul>
            <p className="stage-limits">{c.diagLimits}</p>
          </div>
        </section>

        {/* ── F01 saisie ───────────────────────────────────── */}
        <section className="stage-saisie">
          <h2>{c.saisieTitle}</h2>
          <p className="stage-lead">{c.saisieLead}</p>
          <Numbered items={c.saisieSteps} />
          <div className="stage-duo-cards">
            <div className="stage-duo-card">
              <strong>{c.saisieWizard.t}</strong>
              <p>{c.saisieWizard.d}</p>
            </div>
            <div className="stage-duo-card">
              <strong>{c.saisieTableur.t}</strong>
              <p>{c.saisieTableur.d}</p>
            </div>
          </div>
          <ul className="stage-check">
            {c.saisiePoints.map((p) => (
              <li key={p}>{p}</li>
            ))}
          </ul>
          <div className="stage-shot-duo">
            <Shot name="wizard-clause" caption={c.saisieShotClause} w={1600} h={1000} />
            <Shot name="tableur" caption={c.saisieShotTableur} w={1600} h={1000} />
          </div>
        </section>

        {/* ── Cycle de vie ─────────────────────────────────── */}
        <section className="stage-lifecycle-section">
          <h2>{c.lifecycleTitle}</h2>
          <p className="stage-lead">{c.lifecycleLead}</p>
          <Lifecycle
            flow={c.lifecycleFlow}
            outcomes={c.lifecycleOutcomes}
            branchLabel={c.lifecycleBranch}
            orLabel={c.lifecycleOr}
            notes={c.lifecycleNotes}
          />
        </section>

        {/* ── Profils ──────────────────────────────────────── */}
        <section className="stage-profiles-section">
          <h2>{c.profilesTitle}</h2>
          <p className="stage-lead">{c.profilesLead}</p>
          <ProfileTabs profiles={c.profiles} label={c.profilesTablabel} />
        </section>

        {/* ── Données & anti-doublon ───────────────────────── */}
        <section className="stage-data">
          <h2>{c.dataTitle}</h2>
          <p className="stage-lead">{c.dataLead}</p>
          <h3>{c.dataGuardsTitle}</h3>
          <p>{c.dataGuards}</p>

          <h3>{c.dedupTitle}</h3>
          <p>{c.dedupBody}</p>
          <div className="stage-dedup-steps">
            {c.dedupSteps.map((s) => (
              <div className="stage-dedup-step" key={s.t}>
                <strong>{s.t}</strong>
                <p>{s.d}</p>
              </div>
            ))}
          </div>
          <div className="stage-taxo">
            <div className="stage-taxo-from">
              <AnimatedNumber value={c.taxo.from} suffix="+" run />
              <span>{lang === 'fr' ? 'entrées brutes' : 'raw entries'}</span>
            </div>
            <span className="stage-taxo-arrow" aria-hidden="true">
              →
            </span>
            <div className="stage-taxo-to">
              <AnimatedNumber value={c.taxo.to} run />
              <span>{lang === 'fr' ? 'catégories propres' : 'clean categories'}</span>
            </div>
          </div>
          <p>{c.dedupOutro}</p>
        </section>

        {/* ── Back-office ──────────────────────────────────── */}
        <section className="stage-backoffice">
          <h2>{c.backTitle}</h2>
          <p className="stage-lead">{c.backLead}</p>
          <FeatureList items={c.backFeatures} />
        </section>

        {/* ── Stack ────────────────────────────────────────── */}
        <section className="stage-stack">
          <h2>{c.stackTitle}</h2>
          <p className="stage-lead">{c.stackLead}</p>
          <div className="stage-dry">
            <span className="stage-dry-source">domain.ts</span>
            <span className="stage-dry-arrows" aria-hidden="true">
              ⇒
            </span>
            <div className="stage-dry-targets">
              <span>{lang === 'fr' ? 'Formulaire' : 'Form'}</span>
              <span>API</span>
              <span>{lang === 'fr' ? 'Schéma BD' : 'DB schema'}</span>
            </div>
          </div>
          <p>{c.stackDry}</p>
          <blockquote className="stage-callout">{c.stackDjango}</blockquote>
          <p>{c.stackArchi}</p>
          <h3>{c.techTitle}</h3>
          <div className="stage-tech-grid">
            {c.tech.map((t) => (
              <div className="stage-tech" key={t.n}>
                <strong>{t.n}</strong>
                <span>{t.d}</span>
              </div>
            ))}
          </div>
        </section>

        {/* ── Sécurité & qualité ───────────────────────────── */}
        <section className="stage-quality">
          <h2>{c.qualityTitle}</h2>
          <p className="stage-lead">{c.qualityLead}</p>
          <div className="stage-quality-cols">
            {c.qualityCols.map((col) => (
              <div className="stage-quality-col" key={col.t}>
                <strong>{col.t}</strong>
                <ul>
                  {col.items.map((i) => (
                    <li key={i}>{i}</li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
          <p className="stage-norms">{c.qualityNorms}</p>
        </section>

        {/* ── Évaluation ───────────────────────────────────── */}
        <section className="stage-eval">
          <h2>{c.evalTitle}</h2>
          <p className="stage-lead">{c.evalBody}</p>
          <div className="stage-sus">
            <div className="stage-sus-score">
              <strong>{c.evalSus}</strong>
              <span>{c.evalSusLabel}</span>
              <em>{c.evalSusHint}</em>
            </div>
            <p className="stage-sus-nuance">{c.evalNuance}</p>
          </div>
        </section>

        {/* ── Déploiement & perspectives ───────────────────── */}
        <section className="stage-future">
          <h2>{c.futureTitle}</h2>
          <div className="stage-future-deploy">
            <strong>{c.futureDeployTitle}</strong>
            <p>{c.futureDeploy}</p>
          </div>
          <h3>{c.futureRoadmapTitle}</h3>
          <ul className="stage-arrow-list">
            {c.futureRoadmap.map((r) => (
              <li key={r}>{r}</li>
            ))}
          </ul>
        </section>

        {/* ── Bilan / compétences ──────────────────────────── */}
        <section className="stage-skills">
          <h2>{c.skillsTitle}</h2>
          <p className="stage-lead">{c.skillsLead}</p>
          <div className="stage-skills-grid">
            {c.skillsGroups.map((g) => (
              <div className="stage-skills-card" key={g.t}>
                <strong>{g.t}</strong>
                <ul>
                  {g.items.map((i) => (
                    <li key={i}>{i}</li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
          <p className="stage-closing">{c.closing}</p>
        </section>

        {/* ── Galerie ──────────────────────────────────────── */}
        <section className="stage-gallery-section">
          <h2>{c.galleryTitle}</h2>
          <p className="stage-lead">{c.galleryLead}</p>
          <div className="stage-gallery">
            {c.gallery.map((g) => (
              <Shot key={g.name} name={g.name} caption={g.cap} w={g.w} h={g.h} />
            ))}
          </div>
          <p className="stage-cdc-link">
            {c.cdcLink}{' '}
            <a href={c.cdcUrl} target="_blank" rel="noopener noreferrer">
              cahier-des-charges <span aria-hidden="true">↗</span>
            </a>
          </p>
        </section>
      </article>

      <ProjectPagination currentPath="/projet-stage" />
    </>
  );
};

export default ProjetStage;
