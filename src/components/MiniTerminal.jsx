import { useState, useRef, useEffect, useCallback } from 'react';
import { academicProjects, personalProjects, getAllTags } from '@/data/projects.js';
import { discoverMusicTracks } from '@/utils/discoverMusicTracks.js';

/* ── Données statiques ─────────────────────────────── */

const ALL_TRACKS = discoverMusicTracks();

const DEV_JOKES = [
  "Pourquoi les développeurs détestent la nature ? Parce qu'il y a trop de bugs.",
  "Il y a 10 types de personnes : celles qui comprennent le binaire et les autres.",
  "Un développeur ne va jamais boire un café... il va exécuter un Java.",
  "!false — c'est drôle parce que c'est true.",
  "Combien de programmeurs faut-il pour changer une ampoule ? Aucun, c'est un problème hardware.",
  "['hip','hip'] — hip hip array !",
  "Un SQL query entre dans un bar, voit deux tables et demande : « Je peux joindre ? »",
  "Le Wi-Fi est tombé pendant 5 minutes, j'ai dû parler à ma famille. Ils ont l'air sympa.",
  "La première règle du code : ça marche ? On ne touche plus.",
  "Mon code fonctionne et je ne sais pas pourquoi. Mon code ne fonctionne pas et je ne sais pas pourquoi.",
];

const SKILLS = [
  'JavaScript / React', 'HTML5 / CSS3', 'Python', 'Java',
  'SQL / PostgreSQL', 'Git', 'Node.js', 'Linux',
];

const PROJECTS = [
  { name: 'Application de planification de banquets', path: '/projet-MEGASAE' },
  { name: "Implémentation d'un besoin client", path: '/projet-SAE12' },
  { name: "Installation d'un poste pour le développement", path: '/projet-SAE3' },
  { name: "Création d'une base de données", path: '/projet-SAE4' },
  { name: "Création d'un site institutionnel", path: '/projet-SAE56' },
];

const HELP_TEXT = `Commandes disponibles :
  help      — afficher cette aide
  about     — à propos de moi
  projects  — lister mes projets
  skills    — compétences techniques
  stats     — statistiques du portfolio et de la session
  joke      — une blague de dev
  date      — date et heure actuelles
  pet       — état du robot
  clear     — effacer le terminal`;

const ABOUT_TEXT = `Enzo Morello — Étudiant en BUT Informatique à l'IUT2 de Grenoble.
Passionné par le développement web, les jeux vidéo et la création.
Parcours Développeur d'applications.`;

/* ── Helpers ───────────────────────────────────────── */

const formatElapsed = (ms) => {
  const totalSec = Math.floor(ms / 1000);
  const min = Math.floor(totalSec / 60);
  const sec = totalSec % 60;
  if (min === 0) return `${sec}s`;
  return `${min}m ${sec.toString().padStart(2, '0')}s`;
};

const calculateStats = () => {
  // Portfolio
  const totalProjects = academicProjects.length + personalProjects.length;
  const uniqueTechs = getAllTags().length;

  // Session
  const sessionStart = parseInt(sessionStorage.getItem('session-start') || Date.now(), 10);
  const elapsed = formatElapsed(Date.now() - sessionStart);
  const sessionPages = JSON.parse(sessionStorage.getItem('session-pages') || '[]');
  const pagesVisited = sessionPages.length;

  // Musique
  const trackIndex = parseInt(localStorage.getItem('music-currentTrack') || '0', 10);
  const isPaused = localStorage.getItem('music-isPaused') === 'true';
  const rawName = ALL_TRACKS[trackIndex] ?? `piste-${trackIndex + 1}`;
  const trackName = rawName.replace(/\.[^.]+$/, '');
  const musicStatus = `${trackName} (${isPaused ? '⏸' : '▶'} ${trackIndex + 1}/${ALL_TRACKS.length})`;

  // Robot
  const petStats = window.getPetStats?.();
  let petStatus = '—';
  if (petStats) {
    const labels = { happy: 'Heureux 😊', content: 'Content 😐', sad: 'Triste 😢' };
    petStatus = `${labels[petStats.mood] || petStats.mood} — bonheur: ${petStats.happiness}%`;
  } else if (localStorage.getItem('pet-spawned') === 'false') {
    petStatus = 'Robot rappelé';
  }

  return `Statistiques du portfolio :

  Portfolio :
    Projets        ${totalProjects} (${academicProjects.length} académiques, ${personalProjects.length} personnels)
    Compétences    ${SKILLS.length}
    Technologies   ${uniqueTechs} uniques

  Session :
    Pages visitées  ${pagesVisited}
    Temps en ligne  ${elapsed}
    Musique         ${musicStatus}
    Robot           ${petStatus}`;
};

/* ── Composant ─────────────────────────────────────── */

const MiniTerminal = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [lines, setLines] = useState([
    { type: 'system', text: 'Bienvenue ! Tapez "help" pour la liste des commandes.' },
  ]);
  const [input, setInput] = useState('');
  const [iconState, setIconState] = useState('idle'); // idle | open
  const outputRef = useRef(null);
  const inputRef = useRef(null);
  const panelRef = useRef(null);

  /* ── Scroll auto ── */
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

  /* ── Fermer au clic extérieur ── */
  useEffect(() => {
    if (!isOpen) return;
    const handle = (e) => {
      if (panelRef.current && !panelRef.current.contains(e.target)) {
        setIsOpen(false);
        setIconState('idle');
      }
    };
    // Délai pour ne pas attraper le clic d'ouverture
    const id = setTimeout(() => document.addEventListener('mousedown', handle), 0);
    return () => {
      clearTimeout(id);
      document.removeEventListener('mousedown', handle);
    };
  }, [isOpen]);

  /* ── Fermer avec Escape ── */
  useEffect(() => {
    if (!isOpen) return;
    const handle = (e) => {
      if (e.key === 'Escape') {
        setIsOpen(false);
        setIconState('idle');
      }
    };
    document.addEventListener('keydown', handle);
    return () => document.removeEventListener('keydown', handle);
  }, [isOpen]);

  /* ── Commandes ── */
  const processCommand = useCallback((cmd) => {
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
        newLines.push({ type: 'system', text: `Projets :\n${list}` });
        break;
      }

      case 'skills': {
        const list = SKILLS.map((s) => `  • ${s}`).join('\n');
        newLines.push({ type: 'system', text: `Compétences :\n${list}` });
        break;
      }

      case 'stats':
        newLines.push({ type: 'system', text: calculateStats() });
        break;

      case 'joke': {
        const joke = DEV_JOKES[Math.floor(Math.random() * DEV_JOKES.length)];
        newLines.push({ type: 'joke', text: joke });
        break;
      }

      case 'date':
        newLines.push({ type: 'system', text: new Date().toLocaleString('fr-FR') });
        break;

      case 'pet': {
        const petStats = window.getPetStats?.();
        if (!petStats) {
          newLines.push({
            type: 'system',
            text: localStorage.getItem('pet-spawned') === 'false'
              ? '🤖 Robot rappelé. Invoque-le via l\'icône robot dans la barre.'
              : '🤖 Robot pas encore adopté ! Clique sur l\'icône robot dans la barre.',
          });
        } else {
          const bar = (val) => {
            const filled = Math.round(val / 10);
            return '█'.repeat(filled) + '░'.repeat(10 - filled);
          };
          const labels = { happy: 'Heureux 😊', content: 'Content', sad: 'Triste 😢' };
          newLines.push({
            type: 'system',
            text: `🤖 État du robot :\n  Faim    : [${bar(petStats.hunger)}] ${petStats.hunger}%\n  Bonheur : [${bar(petStats.happiness)}] ${petStats.happiness}%\n  Humeur  : ${labels[petStats.mood] || petStats.mood}`,
          });
        }
        break;
      }

      case 'clear':
        setLines([]);
        setInput('');
        return;

      default:
        newLines.push({
          type: 'error',
          text: `Commande inconnue : "${trimmed}". Tapez "help" pour voir les commandes.`,
        });
    }

    setLines((prev) => [...prev, ...newLines]);
    setInput('');
  }, []);

  const handleKeyDown = (e) => {
    if (e.key === 'Enter') {
      processCommand(input);
    }
  };

  const toggleTerminal = () => {
    setIsOpen((prev) => {
      const next = !prev;
      setIconState(next ? 'open' : 'idle');
      return next;
    });
  };

  return (
    <div className="mini-terminal-wrapper" ref={panelRef}>
      {/* Bouton icône dans la barre */}
      <button
        className="header-action-btn"
        onClick={toggleTerminal}
        aria-label="Ouvrir le mini-terminal"
        aria-expanded={isOpen}
        title="Terminal"
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
          <polyline
            className="terminal-icon__chevron"
            points="4 17 10 11 4 5"
          />
          {/* Underscore (_) — slides right when open */}
          <line
            className="terminal-icon__cursor"
            x1="12" y1="19" x2="20" y2="19"
          />
        </svg>
      </button>

      {/* Panneau terminal */}
      {isOpen && (
        <div className="mini-terminal-panel" role="dialog" aria-label="Mini terminal">
          <div className="mini-terminal-titlebar">
            <span className="mini-terminal-dots">
              <span className="dot dot--red" />
              <span className="dot dot--yellow" />
              <span className="dot dot--green" />
            </span>
            <span className="mini-terminal-title">enzo@portfolio:~</span>
          </div>

          <div className="mini-terminal-output" ref={outputRef}>
            {lines.map((line, i) => (
              <div key={i} className={`mini-terminal-line mini-terminal-line--${line.type}`}>
                {line.text.split('\n').map((segment, j) => (
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
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Tapez une commande…"
              spellCheck={false}
              autoComplete="off"
              aria-label="Saisie de commande"
            />
          </div>
        </div>
      )}
    </div>
  );
};

export default MiniTerminal;
