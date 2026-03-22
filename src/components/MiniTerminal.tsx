import '@styles/components/_mini-terminal.css';
import { useState, useRef, useEffect, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { useTranslation } from 'react-i18next';
import Tooltip from './Tooltip';
import { useAccessibility } from '@/contexts/AccessibilityContext';
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

const CRT_BOOT_DURATION_MIN_MS = 760;
const CRT_BOOT_DURATION_MAX_MS = 1480;
const CRT_BOOT_TICK_MS = 70;
const CRT_COMMAND_DELAY_MIN_MS = 42;
const CRT_COMMAND_DELAY_MAX_MS = 118;

type TerminalLineType = 'system' | 'input' | 'error' | 'joke';

interface TerminalLine {
  type: TerminalLineType;
  text: string;
}

interface BootProfile {
  durationMs: number;
  modeLabel: string;
  channelLabel: string;
  lines: string[];
}

const DEFAULT_BOOT_LINES = [
  'init://display.pipeline .. ok',
  'sync://prompt.engine ..... ok',
  'mount://portfolio.session  ok',
  'check://ambient.fx ....... ok',
  'route://ui.shell ......... ok',
];

const DEFAULT_BOOT_MODES = ['BOOT', 'SYNC', 'SCAN'];
const DEFAULT_BOOT_CHANNELS = ['crt://warmup', 'crt://signal', 'crt://vector'];

const randomInt = (min: number, max: number): number =>
  Math.floor(Math.random() * (max - min + 1)) + min;

const pickRandomEntry = (items: string[], fallback: string): string => {
  if (!items.length) return fallback;
  return items[Math.floor(Math.random() * items.length)] ?? fallback;
};

const pickRandomLines = (items: string[], minCount: number, maxCount: number): string[] => {
  if (items.length <= minCount) {
    return items.slice(0, Math.max(1, items.length));
  }

  const count = Math.min(items.length, randomInt(minCount, maxCount));
  const pool = [...items];
  for (let i = pool.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    const temp = pool[i];
    pool[i] = pool[j];
    pool[j] = temp;
  }
  return pool.slice(0, count);
};

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
  const sessionStart = parseInt(
    safeLocalGet('portfolio-analytics-session-start') || String(Date.now()),
    10
  );
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
  const { settings: a11ySettings } = useAccessibility();
  const noMotion = a11ySettings.noMotion;
  const locale = i18n.resolvedLanguage === 'en' ? 'en-US' : 'fr-FR';
  const jokesFromI18n = t('common.terminal.jokes', { returnObjects: true });
  const skillsFromI18n = t('common.terminal.skills', { returnObjects: true });
  const projectsFromI18n = t('common.terminal.projects', { returnObjects: true });

  const DEV_JOKES = Array.isArray(jokesFromI18n) ? jokesFromI18n : DEFAULT_DEV_JOKES;
  const SKILLS = Array.isArray(skillsFromI18n) ? skillsFromI18n : DEFAULT_SKILLS;
  const PROJECTS = Array.isArray(projectsFromI18n) ? projectsFromI18n : DEFAULT_PROJECTS;
  const HELP_TEXT = t('common.terminal.helpText', { defaultValue: DEFAULT_HELP_TEXT });
  const ABOUT_TEXT = t('common.terminal.aboutText', { defaultValue: DEFAULT_ABOUT_TEXT });
  const bootProgressLabel = t('common.terminal.boot.progressLabel', { defaultValue: 'Signal' });

  const [isOpen, setIsOpen] = useState(false);
  const [snakeMode, setSnakeMode] = useState(false);
  const [lines, setLines] = useState<TerminalLine[]>([
    { type: 'system', text: t('common.terminal.welcome') },
  ]);
  const [input, setInput] = useState('');
  const [iconState, setIconState] = useState('idle'); // idle | open
  const [sessionTime, setSessionTime] = useState('0s');
  const [isBooting, setIsBooting] = useState(false);
  const [bootProgress, setBootProgress] = useState(0);
  const [bootProfile, setBootProfile] = useState<BootProfile>(() => ({
    durationMs: CRT_BOOT_DURATION_MIN_MS,
    modeLabel: DEFAULT_BOOT_MODES[0],
    channelLabel: DEFAULT_BOOT_CHANNELS[0],
    lines: DEFAULT_BOOT_LINES.slice(0, 3),
  }));
  const outputRef = useRef<any>(null);
  const inputRef = useRef<any>(null);
  const panelRef = useRef<any>(null);
  const panelDivRef = useRef<any>(null);
  const commandHistoryRef = useRef<string[]>([]);
  const commandHistoryCursorRef = useRef(-1);
  const [panelPos, setPanelPos] = useState<any>(null);

  /* ── Timer session (titlebar) ── */
  useEffect(() => {
    if (!isOpen) return;
    const sessionStart = parseInt(
      safeLocalGet('portfolio-analytics-session-start') || String(Date.now()),
      10
    );
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

  useEffect(() => {
    if (!isOpen || snakeMode) {
      setIsBooting(false);
      setBootProgress(0);
      return;
    }

    if (noMotion) {
      setIsBooting(false);
      setBootProgress(100);
      return;
    }

    const resolvedBootLines = t('common.terminal.boot.lines', {
      returnObjects: true,
      defaultValue: DEFAULT_BOOT_LINES,
    });
    const resolvedBootModes = t('common.terminal.boot.modes', {
      returnObjects: true,
      defaultValue: DEFAULT_BOOT_MODES,
    });
    const resolvedBootChannels = t('common.terminal.boot.channels', {
      returnObjects: true,
      defaultValue: DEFAULT_BOOT_CHANNELS,
    });

    const bootLines = Array.isArray(resolvedBootLines)
      ? resolvedBootLines.filter((value): value is string => typeof value === 'string' && value.length > 0)
      : DEFAULT_BOOT_LINES;
    const bootModes = Array.isArray(resolvedBootModes)
      ? resolvedBootModes.filter((value): value is string => typeof value === 'string' && value.length > 0)
      : DEFAULT_BOOT_MODES;
    const bootChannels = Array.isArray(resolvedBootChannels)
      ? resolvedBootChannels.filter((value): value is string => typeof value === 'string' && value.length > 0)
      : DEFAULT_BOOT_CHANNELS;

    const durationMs = randomInt(CRT_BOOT_DURATION_MIN_MS, CRT_BOOT_DURATION_MAX_MS);
    const nextProfile: BootProfile = {
      durationMs,
      modeLabel: pickRandomEntry(bootModes, DEFAULT_BOOT_MODES[0]),
      channelLabel: pickRandomEntry(bootChannels, DEFAULT_BOOT_CHANNELS[0]),
      lines: pickRandomLines(bootLines, 2, 4),
    };

    setBootProfile(nextProfile);
    setIsBooting(true);
    setBootProgress(0);

    const startAt = performance.now();
    const intervalId = window.setInterval(() => {
      const elapsed = performance.now() - startAt;
      const ratio = Math.min(1, elapsed / durationMs);
      const jitter = (Math.random() - 0.35) * 0.08;
      const target = Math.min(99, Math.max(0, Math.round((ratio + jitter) * 100)));
      setBootProgress((previous) => Math.max(previous, target));
    }, CRT_BOOT_TICK_MS);

    const timeoutId = window.setTimeout(() => {
      setBootProgress(100);
      setIsBooting(false);
    }, durationMs);

    return () => {
      window.clearInterval(intervalId);
      window.clearTimeout(timeoutId);
    };
  }, [isOpen, noMotion, snakeMode, t]);
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
    (cmd: string) => {
      const trimmed = cmd.trim().toLowerCase();
      if (!trimmed) return;

      const newLines: TerminalLine[] = [{ type: 'input', text: `$ ${cmd}` }];

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

  const queueCommand = useCallback(
    (command: string) => {
      const trimmed = command.trim();
      if (!trimmed) return;

      commandHistoryRef.current = [
        trimmed,
        ...commandHistoryRef.current.filter((entry) => entry !== trimmed),
      ].slice(0, 32);
      commandHistoryCursorRef.current = -1;

      const run = () => processCommand(command);
      if (noMotion) {
        run();
        return;
      }

      const delay =
        CRT_COMMAND_DELAY_MIN_MS +
        Math.floor(Math.random() * (CRT_COMMAND_DELAY_MAX_MS - CRT_COMMAND_DELAY_MIN_MS));
      window.setTimeout(run, delay);
    },
    [noMotion, processCommand]
  );

  const handleKeyDown = (e: any) => {
    if (isBooting) {
      return;
    }

    if (e.key === 'Enter') {
      const currentCommand = input;
      setInput('');
      queueCommand(currentCommand);
      return;
    }

    if (e.key === 'ArrowUp') {
      e.preventDefault();
      if (commandHistoryRef.current.length === 0) return;

      const nextCursor = Math.min(
        commandHistoryCursorRef.current + 1,
        commandHistoryRef.current.length - 1
      );
      commandHistoryCursorRef.current = nextCursor;
      setInput(commandHistoryRef.current[nextCursor]);
      return;
    }

    if (e.key === 'ArrowDown') {
      e.preventDefault();
      if (commandHistoryRef.current.length === 0) return;

      const nextCursor = Math.max(commandHistoryCursorRef.current - 1, -1);
      commandHistoryCursorRef.current = nextCursor;
      setInput(nextCursor === -1 ? '' : commandHistoryRef.current[nextCursor]);
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
            className={`mini-terminal-panel mini-terminal-panel--crt${snakeMode ? ' mini-terminal-panel--snake' : ''}${isBooting ? ' mini-terminal-panel--booting' : ''}`}
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
            <div className="mini-terminal-crt-layer" aria-hidden="true">
              <span className="mini-terminal-crt-glare" />
              <span className="mini-terminal-crt-scanlines" />
              <span className="mini-terminal-crt-noise" />
              <span className="mini-terminal-crt-vignette" />
            </div>

            <div className="mini-terminal-titlebar">
              <span className="mini-terminal-status">
                <span className="mini-terminal-status-dot" aria-hidden="true" />
                <span className="mini-terminal-status-label">
                  {isBooting ? bootProfile.modeLabel : t('common.terminal.run')}
                </span>
              </span>
              <span className="mini-terminal-title">
                {isBooting ? bootProfile.channelLabel : 'enzo@portfolio:~'}
              </span>
              <span className="mini-terminal-signal" aria-hidden="true">
                <span className="mini-terminal-signal-bar" />
                <span className="mini-terminal-signal-bar" />
                <span className="mini-terminal-signal-bar" />
              </span>
              <span className="mini-terminal-session">{sessionTime}</span>
            </div>

            {snakeMode ? (
              <SnakeGame onClose={closeSnake} />
            ) : (
              <div className={`mini-terminal-screen${isBooting ? ' mini-terminal-screen--booting' : ''}`}>
                {isBooting ? (
                  <div className="mini-terminal-boot" aria-live="polite">
                    {bootProfile.lines
                      .slice(0, Math.ceil((bootProgress / 100) * bootProfile.lines.length))
                      .map((line, index) => (
                        <p key={`${line}-${index}`} className="mini-terminal-boot__line">
                          {line}
                        </p>
                      ))}
                    <div
                      className="mini-terminal-boot__progress"
                      role="progressbar"
                      aria-valuemin={0}
                      aria-valuemax={100}
                      aria-valuenow={bootProgress}
                    >
                      <span style={{ width: `${bootProgress}%` }} />
                    </div>
                    <p className="mini-terminal-boot__line">
                      {bootProgressLabel}: {bootProgress}%
                    </p>
                  </div>
                ) : (
                  <>
                    <div
                      className="mini-terminal-output"
                      ref={outputRef}
                      aria-live="polite"
                      aria-relevant="additions"
                    >
                      {lines.map((line, i) => {
                        const segments = line.text.split('\n');
                        return (
                          <div key={i} className={`mini-terminal-line mini-terminal-line--${line.type}`}>
                            {segments.map((segment, j) => (
                              <span key={j}>
                                {segment}
                                {j < segments.length - 1 && <br />}
                              </span>
                            ))}
                          </div>
                        );
                      })}
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
              </div>
            )}
          </div>,
          document.body
        )}
    </div>
  );
};

export default MiniTerminal;
