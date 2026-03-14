import { useState, useRef, useEffect, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { useTranslation } from 'react-i18next';
import Tooltip from './Tooltip';
import { getAcademicProjects, getPersonalProjects, getAllTags } from '@/data/projects';
import { discoverMusicTracks } from '@/utils/discoverMusicTracks';
import { safeLocalGet, safeSessionGet } from '@/utils/safeStorage';
import SnakeGame from './SnakeGame';

/* ── Données statiques ─────────────────────────────── */

const ALL_TRACKS = discoverMusicTracks();

const DEFAULT_DEV_JOKES = [
  "Pourquoi les développeurs détestent la nature ? Parce qu'il y a trop de bugs.",
  'Il y a 10 types de personnes : celles qui comprennent le binaire et les autres.',
  'Un développeur ne va jamais boire un café... il va exécuter un Java.',
  "!false — c'est drôle parce que c'est true.",
  "Combien de programmeurs faut-il pour changer une ampoule ? Aucun, c'est un problème hardware.",
  "['hip','hip'] — hip hip array !",
  'Un SQL query entre dans un bar, voit deux tables et demande : « Je peux joindre ? »',
  "Le Wi-Fi est tombé pendant 5 minutes, j'ai dû parler à ma famille. Ils ont l'air sympa.",
  'La première règle du code : ça marche ? On ne touche plus.',
  'Mon code fonctionne et je ne sais pas pourquoi. Mon code ne fonctionne pas et je ne sais pas pourquoi.',
];

const DEFAULT_SKILLS = [
  'JavaScript / React',
  'HTML5 / CSS3',
  'Python',
  'Java',
  'SQL / PostgreSQL',
  'Git',
  'Node.js',
  'Linux',
];

const DEFAULT_PROJECTS = [
  { name: 'Application de planification de banquets', path: '/projet-MEGASAE' },
  { name: "Implémentation d'un besoin client", path: '/projet-SAE12' },
  { name: "Installation d'un poste pour le développement", path: '/projet-SAE3' },
  { name: "Création d'une base de données", path: '/projet-SAE4' },
  { name: "Création d'un site institutionnel", path: '/projet-SAE56' },
];

const DEFAULT_HELP_TEXT = `Commandes disponibles :
  help      — afficher cette aide
  about     — à propos de moi
  projects  — lister mes projets
  skills    — compétences techniques
  stats     — statistiques portfolio & session
  joke      — une blague de dev
  date      — date et heure actuelles
  pet       — état du robot
  snake     — lancer le jeu Snake 🐍
  clear     — effacer le terminal`;

const DEFAULT_ABOUT_TEXT = `Enzo Morello / Étudiant en BUT Informatique à l'IUT2 de Grenoble.
Passionné par le développement web, les jeux vidéo et la création.
Parcours Développeur d'applications.`;

/* ── Helpers ───────────────────────────────────────── */

const formatElapsed = (ms: any) => {
  const totalSec = Math.floor(ms / 1000);
  const hours = Math.floor(totalSec / 3600);
  const min = Math.floor((totalSec % 3600) / 60);
  const sec = totalSec % 60;
  if (hours > 0)
    return `${hours}h ${min.toString().padStart(2, '0')}m ${sec.toString().padStart(2, '0')}s`;
  if (min === 0) return `${sec}s`;
  return `${min}m ${sec.toString().padStart(2, '0')}s`;
};

const calculateStats = (t: any, skills: any) => {
  const academicProjects = getAcademicProjects(t);
  const personalProjects = getPersonalProjects(t);
  // Portfolio
  const totalProjects = academicProjects.length + personalProjects.length;
  const uniqueTechs = getAllTags(t).length;

  // Session
  const sessionStart = parseInt(safeSessionGet('session-start') || String(Date.now()), 10);
  const elapsed = formatElapsed(Date.now() - sessionStart);
  let sessionPages = [];
  try {
    sessionPages = JSON.parse(safeSessionGet('session-pages') || '[]');
  } catch {
    sessionPages = [];
  }
  const pagesVisited = sessionPages.length;

  // Musique
  const trackIndex = parseInt(safeLocalGet('music-currentTrack') || '0', 10);
  const isPaused = safeLocalGet('music-isPaused') === 'true';
  const rawName = ALL_TRACKS[trackIndex] ?? `piste-${trackIndex + 1}`;
  const trackName = rawName.replace(/\.[^.]+$/, '');
  const musicStatus = `${trackName} (${isPaused ? '⏸' : '▶'} ${trackIndex + 1}/${ALL_TRACKS.length})`;

  // Robot
  const petStats = window.getPetStats?.();
  let petStatus = t('common.terminal.stats.none');
  if (petStats) {
    const labels: Record<string, string> = {
      happy: t('common.terminal.petMood.happy'),
      content: t('common.terminal.petMood.content'),
      sad: t('common.terminal.petMood.sad'),
    };
    petStatus = `${labels[petStats.mood] || petStats.mood} - ${t('common.terminal.stats.happiness')}: ${petStats.happiness}%`;
  } else if (safeLocalGet('pet-spawned') === 'false') {
    petStatus = t('common.terminal.pet.recalled');
  }

  return `${t('common.terminal.stats.title')}:

  ${t('common.terminal.stats.portfolio')}:
    ${t('common.terminal.stats.projects')}       ${totalProjects} (${academicProjects.length} ${t('common.terminal.stats.academic')}, ${personalProjects.length} ${t('common.terminal.stats.personal')})
    ${t('common.terminal.stats.skills')}   ${skills.length}
    ${t('common.terminal.stats.technologies')}  ${uniqueTechs}

  ${t('common.terminal.stats.session')}:
    ${t('common.terminal.stats.pagesVisited')} ${pagesVisited}
    ${t('common.terminal.stats.timeOnline')} ${elapsed}
    ${t('common.terminal.stats.music')}        ${musicStatus}
    ${t('common.terminal.stats.robot')}         ${petStatus}`;
};

/* ── Composant ─────────────────────────────────────── */

const MiniTerminal = () => {
  const { t, i18n } = useTranslation();
  const locale = i18n.resolvedLanguage === 'en' ? 'en-US' : 'fr-FR';
  const jokesFromI18n = t('common.terminal.jokes', { returnObjects: true });
  const skillsFromI18n = t('common.terminal.skills', { returnObjects: true });
  const projectsFromI18n = t('common.terminal.projects', { returnObjects: true });

  const DEV_JOKES = Array.isArray(jokesFromI18n) ? jokesFromI18n : DEFAULT_DEV_JOKES;
  const SKILLS = Array.isArray(skillsFromI18n) ? skillsFromI18n : DEFAULT_SKILLS;
  const PROJECTS = Array.isArray(projectsFromI18n) ? projectsFromI18n : DEFAULT_PROJECTS;
  const HELP_TEXT = t('common.terminal.helpText', { defaultValue: DEFAULT_HELP_TEXT });
  const ABOUT_TEXT = t('common.terminal.aboutText', { defaultValue: DEFAULT_ABOUT_TEXT });

  const [isOpen, setIsOpen] = useState(false);
  const [snakeMode, setSnakeMode] = useState(false);
  const [lines, setLines] = useState([{ type: 'system', text: t('common.terminal.welcome') }]);
  const [input, setInput] = useState('');
  const [iconState, setIconState] = useState('idle'); // idle | open
  const [sessionTime, setSessionTime] = useState('0s');
  const outputRef = useRef<any>(null);
  const inputRef = useRef<any>(null);
  const panelRef = useRef<any>(null);
  const panelDivRef = useRef<any>(null);
  const [panelPos, setPanelPos] = useState<any>(null);

  /* ── Timer session (titlebar) ── */
  useEffect(() => {
    if (!isOpen) return;
    const sessionStart = parseInt(safeSessionGet('session-start') || String(Date.now()), 10);
    const update = () => setSessionTime(formatElapsed(Date.now() - sessionStart));
    update();
    const id = setInterval(update, 1000);
    return () => clearInterval(id);
  }, [isOpen]);

  /* ── Scroll auto ── */
  useEffect(() => {
    setLines([{ type: 'system', text: t('common.terminal.welcome') }]);
  }, [t]);

  useEffect(() => {
    if (outputRef.current) {
      outputRef.current.scrollTop = outputRef.current.scrollHeight;
    }
  }, [lines]);

  /* ── Focus input quand ouvert ── */
  useEffect(() => {
    if (isOpen && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isOpen]);
  /* —— Position du panneau (portal → coordonnées viewport) —— */
  useEffect(() => {
    if (!isOpen || !panelRef.current) return;
    const rect = panelRef.current.getBoundingClientRect();
    if (window.innerWidth <= 768) {
      const hh =
        parseFloat(
          getComputedStyle(document.documentElement).getPropertyValue('--header-height')
        ) || 60;
      setPanelPos({ top: hh + 8, left: 0, right: 0 });
    } else {
      setPanelPos({ top: rect.bottom + 12, right: window.innerWidth - rect.right });
    }
  }, [isOpen]);
  /* ── Fermer au clic extérieur ── */
  useEffect(() => {
    if (!isOpen) return;
    const handle = (e: any) => {
      if (
        panelRef.current &&
        !panelRef.current.contains(e.target) &&
        !(panelDivRef.current && panelDivRef.current.contains(e.target))
      ) {
        setIsOpen(false);
        setIconState('idle');
        setSnakeMode(false);
      }
    };
    // Délai pour ne pas attraper le clic d'ouverture
    const id = setTimeout(() => document.addEventListener('mousedown', handle), 0);
    return () => {
      clearTimeout(id);
      document.removeEventListener('mousedown', handle);
    };
  }, [isOpen]);

  /* ── Fermer avec Escape + focus trap ── */
  useEffect(() => {
    if (!isOpen) return;
    const handle = (e: any) => {
      if (e.key === 'Escape') {
        setIsOpen(false);
        setIconState('idle');
        setSnakeMode(false);
      }
      // Focus trap : garder Tab dans le dialog
      if (e.key === 'Tab' && panelDivRef.current) {
        const focusable = panelDivRef.current.querySelectorAll(
          'input, button, [tabindex]:not([tabindex=\"-1\"])'
        );
        if (focusable.length === 0) return;
        const first = focusable[0];
        const last = focusable[focusable.length - 1];
        if (e.shiftKey) {
          if (document.activeElement === first) {
            e.preventDefault();
            last.focus();
          }
        } else {
          if (document.activeElement === last) {
            e.preventDefault();
            first.focus();
          }
        }
      }
    };
    document.addEventListener('keydown', handle);
    return () => document.removeEventListener('keydown', handle);
  }, [isOpen]);

  /* ── Commandes ── */
  const processCommand = useCallback(
    (cmd: any) => {
      const trimmed = cmd.trim().toLowerCase();
      if (!trimmed) return;

      const newLines = [{ type: 'input', text: `$ ${cmd}` }];

      switch (trimmed) {
        case 'help':
          newLines.push({ type: 'system', text: HELP_TEXT });
          break;

        case 'about':
          newLines.push({ type: 'system', text: ABOUT_TEXT });
          break;

        case 'projects': {
          const list = PROJECTS.map((p, i) => `  ${i + 1}. ${p.name}`).join('\n');
          newLines.push({
            type: 'system',
            text: `${t('common.terminal.output.projects')}:\n${list}`,
          });
          break;
        }

        case 'skills': {
          const list = SKILLS.map((s) => `  • ${s}`).join('\n');
          newLines.push({
            type: 'system',
            text: `${t('common.terminal.output.skills')}:\n${list}`,
          });
          break;
        }

        case 'stats':
          newLines.push({ type: 'system', text: calculateStats(t, SKILLS) });
          break;

        case 'joke': {
          const joke = DEV_JOKES[Math.floor(Math.random() * DEV_JOKES.length)];
          newLines.push({ type: 'joke', text: joke });
          break;
        }

        case 'date':
          newLines.push({ type: 'system', text: new Date().toLocaleString(locale) });
          break;

        case 'pet': {
          const petStats = window.getPetStats?.();
          if (!petStats) {
            newLines.push({
              type: 'system',
              text:
                safeLocalGet('pet-spawned') === 'false'
                  ? t('common.terminal.pet.recalledHint')
                  : t('common.terminal.pet.notAdoptedHint'),
            });
          } else {
            const bar = (val: any) => {
              const filled = Math.round(val / 10);
              return '█'.repeat(filled) + '░'.repeat(10 - filled);
            };
            const labels: Record<string, string> = {
              happy: t('common.terminal.petMood.happy'),
              content: t('common.terminal.petMood.content'),
              sad: t('common.terminal.petMood.sad'),
            };
            newLines.push({
              type: 'system',
              text: `${t('common.terminal.pet.state')}:\n  ${t('common.terminal.pet.hunger')} : [${bar(petStats.hunger)}] ${petStats.hunger}%\n  ${t('common.terminal.pet.happiness')} : [${bar(petStats.happiness)}] ${petStats.happiness}%\n  ${t('common.terminal.pet.mood')} : ${labels[petStats.mood] || petStats.mood}`,
            });
          }
          break;
        }

        case 'snake':
          setSnakeMode(true);
          setInput('');
          return;

        case 'clear':
          setLines([]);
          setInput('');
          return;

        default:
          newLines.push({
            type: 'error',
            text: t('common.terminal.unknownCommand', { command: trimmed }),
          });
      }

      setLines((prev) => [...prev, ...newLines]);
      setInput('');
    },
    [HELP_TEXT, ABOUT_TEXT, DEV_JOKES, PROJECTS, SKILLS, t, locale]
  );

  const handleKeyDown = (e: any) => {
    if (e.key === 'Enter') {
      processCommand(input);
    }
  };

  const toggleTerminal = () => {
    setIsOpen((prev) => {
      const next = !prev;
      setIconState(next ? 'open' : 'idle');
      if (!next) setSnakeMode(false); // fermer le snake si on ferme le terminal
      return next;
    });
  };

  const closeSnake = useCallback(() => {
    setSnakeMode(false);
    // Donner le focus à l'input terminal après fermeture du jeu
    setTimeout(() => inputRef.current?.focus(), 50);
  }, []);

  return (
    <div className="mini-terminal-wrapper" ref={panelRef}>
      {/* Bouton icône dans la barre */}
      <Tooltip text={t('common.terminal.tooltip')} position="bottom">
        <button
          className="header-action-btn"
          onClick={toggleTerminal}
          aria-label={t('common.terminal.openAria')}
          aria-expanded={isOpen}
        >
          <svg
            className={`terminal-icon terminal-icon--${iconState}`}
            viewBox="0 0 24 24"
            width="17"
            height="17"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden="true"
          >
            {/* Chevron (>) — morphs into a blinking cursor when open */}
            <polyline className="terminal-icon__chevron" points="4 17 10 11 4 5" />
            {/* Underscore (_) — slides right when open */}
            <line className="terminal-icon__cursor" x1="12" y1="19" x2="20" y2="19" />
          </svg>
        </button>
      </Tooltip>

      {/* Panneau terminal */}
      {isOpen &&
        createPortal(
          <div
            ref={panelDivRef}
            className={`mini-terminal-panel${snakeMode ? ' mini-terminal-panel--snake' : ''}`}
            role="dialog"
            aria-label={t('common.terminal.dialogAria')}
            style={
              panelPos
                ? {
                    top: `${panelPos.top}px`,
                    ...(panelPos.left !== undefined
                      ? { left: `${panelPos.left}px`, right: `${panelPos.right}px` }
                      : { right: `${panelPos.right}px` }),
                  }
                : {}
            }
          >
            <div className="mini-terminal-titlebar">
              <span className="mini-terminal-status">
                <span className="mini-terminal-status-dot" aria-hidden="true" />
                <span className="mini-terminal-status-label">{t('common.terminal.run')}</span>
              </span>
              <span className="mini-terminal-title">enzo@portfolio:~</span>
              <span className="mini-terminal-session">{sessionTime}</span>
            </div>

            {snakeMode ? (
              <SnakeGame onClose={closeSnake} />
            ) : (
              <>
                <div
                  className="mini-terminal-output"
                  ref={outputRef}
                  aria-live="polite"
                  aria-relevant="additions"
                >
                  {lines.map((line, i) => (
                    <div key={i} className={`mini-terminal-line mini-terminal-line--${line.type}`}>
                      {line.text.split('\n').map((segment: any, j: any) => (
                        <span key={j}>
                          {segment}
                          {j < line.text.split('\n').length - 1 && <br />}
                        </span>
                      ))}
                    </div>
                  ))}
                </div>

                <div className="mini-terminal-input-row">
                  <span className="mini-terminal-prompt">$</span>
                  <input
                    ref={inputRef}
                    type="text"
                    className="mini-terminal-input"
                    value={input}
                    onChange={(e: any) => setInput(e.target.value)}
                    onKeyDown={handleKeyDown}
                    placeholder={t('common.terminal.placeholder')}
                    spellCheck={false}
                    autoComplete="off"
                    aria-label={t('common.terminal.inputAria')}
                  />
                </div>
              </>
            )}
          </div>,
          document.body
        )}
    </div>
  );
};

export default MiniTerminal;
