import { useEffect, useRef, useState } from 'react';
import Tooltip from './Tooltip.jsx';

/* ── Constantes ─────────────────────────────────────── */
const CELL = 13;       // px par cellule
const COLS = 20;
const ROWS = 20;
const W    = COLS * CELL;  // 260
const H    = ROWS * CELL;  // 260
const LS_KEY = 'snake-hs';

// ms/tick par niveau (tous les 50 pts on monte d'un niveau)
const SPEEDS = [150, 125, 105, 88, 72, 58];
// Profondeur max de la queue de directions (2 = 1 turn buffered)
const DIR_QUEUE_MAX = 2;

/* ── Helpers ─────────────────────────────────────────── */
const randCell = (snake) => {
  let c;
  do {
    c = { x: Math.floor(Math.random() * COLS), y: Math.floor(Math.random() * ROWS) };
  } while (snake.some((s) => s.x === c.x && s.y === c.y));
  return c;
};

const hsColor = (i, len) => {
  const lightness = Math.max(22, 52 - (i / Math.max(len - 1, 1)) * 26);
  return `hsl(138, 72%, ${lightness}%)`;
};

/* ── Composant SnakeGame ─────────────────────────────── */
const SnakeGame = ({ onClose }) => {
  const canvasRef  = useRef(null);
  const gRef       = useRef(null);   // état de jeu mutable
  const rafRef     = useRef(null);   // id requestAnimationFrame
  const cdRef      = useRef(null);   // id setTimeout countdown
  const lastTickRef = useRef(0);     // timestamp du dernier tick logique
  const onCloseRef = useRef(onClose);
  useEffect(() => { onCloseRef.current = onClose; }, [onClose]);

  const [ui, setUi] = useState({
    score:     0,
    hs:        parseInt(localStorage.getItem(LS_KEY) || '0', 10),
    status:    'countdown', // 'countdown' | 'playing' | 'paused' | 'gameover'
    countdown: 3,
  });

  /* ── Rendu canvas ── */
  const draw = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    const g = gRef.current;
    if (!g) return;
    const { snake, food } = g;

    // Fond
    ctx.fillStyle = '#0a0a0a';
    ctx.fillRect(0, 0, W, H);

    // Grille discrète
    ctx.strokeStyle = 'rgba(255,255,255,0.04)';
    ctx.lineWidth = 0.5;
    for (let x = 0; x <= COLS; x++) {
      ctx.beginPath(); ctx.moveTo(x * CELL, 0); ctx.lineTo(x * CELL, H); ctx.stroke();
    }
    for (let y = 0; y <= ROWS; y++) {
      ctx.beginPath(); ctx.moveTo(0, y * CELL); ctx.lineTo(W, y * CELL); ctx.stroke();
    }

    // Nourriture (cercle doré avec lueur)
    const fx = food.x * CELL + CELL / 2;
    const fy = food.y * CELL + CELL / 2;
    ctx.save();
    ctx.shadowColor = '#d4af37';
    ctx.shadowBlur = 8;
    ctx.fillStyle = '#d4af37';
    ctx.beginPath();
    ctx.arc(fx, fy, CELL / 2 - 1.5, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();

    // Serpent
    const len = snake.length;
    snake.forEach((seg, i) => {
      const pad = i === 0 ? 1 : 2;
      ctx.fillStyle = hsColor(i, len);
      if (i === 0) {
        ctx.save();
        ctx.shadowColor = 'rgba(50,255,130,0.55)';
        ctx.shadowBlur = 6;
      }
      const r = i === 0 ? 3 : 2;
      const x = seg.x * CELL + pad;
      const y = seg.y * CELL + pad;
      const s = CELL - pad * 2;
      ctx.beginPath();
      ctx.roundRect(x, y, s, s, r);
      ctx.fill();
      if (i === 0) ctx.restore();
    });

    // Indicateur visuel de direction bufferisée : dessiner un petit triangle
    // subtil sur la tête dans la direction de la prochaine queue entry
    if (g.dirQueue.length > 0 && g.status === 'playing') {
      const peekDir = g.dirQueue[0];
      const hx = snake[0].x * CELL + CELL / 2;
      const hy = snake[0].y * CELL + CELL / 2;
      ctx.save();
      ctx.fillStyle = 'rgba(50,255,130,0.35)';
      ctx.beginPath();
      const sz = 3;
      ctx.moveTo(hx + peekDir.dx * sz * 2, hy + peekDir.dy * sz * 2);
      ctx.lineTo(hx + peekDir.dy * sz, hy + peekDir.dx * sz);
      ctx.lineTo(hx - peekDir.dy * sz, hy - peekDir.dx * sz);
      ctx.closePath();
      ctx.fill();
      ctx.restore();
    }
  };

  /* ── Fin de partie ── */
  const endGame = () => {
    cancelAnimationFrame(rafRef.current);
    rafRef.current = null;
    const g = gRef.current;
    const prev = parseInt(localStorage.getItem(LS_KEY) || '0', 10);
    const hs = Math.max(prev, g.score);
    if (hs > prev) localStorage.setItem(LS_KEY, hs);
    g.status = 'gameover';
    setUi((u) => ({ ...u, status: 'gameover', hs }));
    draw(); // dernier frame
  };

  /* ── Tick logique ── */
  const step = () => {
    const g = gRef.current;
    if (!g || g.status !== 'playing') return;

    // Consommer la prochaine direction de la queue
    if (g.dirQueue.length > 0) {
      g.dir = g.dirQueue.shift();
    }

    const head   = g.snake[0];
    const next   = { x: head.x + g.dir.dx, y: head.y + g.dir.dy };

    // Collision mur
    if (next.x < 0 || next.x >= COLS || next.y < 0 || next.y >= ROWS) {
      endGame(); return;
    }
    // Collision corps
    if (g.snake.some((s) => s.x === next.x && s.y === next.y)) {
      endGame(); return;
    }

    const ate = next.x === g.food.x && next.y === g.food.y;
    g.snake = [next, ...g.snake];
    if (!ate) {
      g.snake.pop();
    } else {
      g.score += 10;
      g.food = randCell(g.snake);

      // Accélération tous les 50 points
      const level    = Math.min(Math.floor(g.score / 50), SPEEDS.length - 1);
      g.speed = SPEEDS[level];
      setUi((u) => ({ ...u, score: g.score }));
    }
  };

  /* ── Boucle RAF : rendu smooth + tick logique à intervalle fixe ── */
  const gameLoop = (timestamp) => {
    const g = gRef.current;
    if (!g) return;

    // Tick logique à intervalle fixe
    if (g.status === 'playing') {
      const elapsed = timestamp - lastTickRef.current;
      if (elapsed >= g.speed) {
        step();
        lastTickRef.current = timestamp;
      }
    }

    // Redessiner à chaque frame RAF (60fps)
    draw();

    // Continuer la boucle si le jeu tourne
    if (g.status === 'playing') {
      rafRef.current = requestAnimationFrame(gameLoop);
    }
  };

  /* ── Initialisation + countdown 3-2-1 ── */
  const startGame = () => {
    cancelAnimationFrame(rafRef.current);
    clearTimeout(cdRef.current);
    const hs = parseInt(localStorage.getItem(LS_KEY) || '0', 10);
    gRef.current = {
      snake:    [{ x: 10, y: 10 }],
      dir:      { dx: 1, dy: 0 },
      dirQueue: [],               // queue de directions (max DIR_QUEUE_MAX)
      food:     randCell([{ x: 10, y: 10 }]),
      score:    0,
      status:   'countdown',
      speed:    SPEEDS[0],
    };
    setUi({ score: 0, hs, status: 'countdown', countdown: 3 });
    requestAnimationFrame(draw);

    let count = 3;
    const tick = () => {
      count--;
      if (count > 0) {
        setUi((u) => ({ ...u, countdown: count }));
        cdRef.current = setTimeout(tick, 1000);
      } else {
        gRef.current.status = 'playing';
        setUi((u) => ({ ...u, status: 'playing' }));
        lastTickRef.current = performance.now();
        rafRef.current = requestAnimationFrame(gameLoop);
      }
    };
    cdRef.current = setTimeout(tick, 1000);
  };

  /* ── Montage : démarrer, démonter : nettoyer ── */
  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => {
    startGame();
    return () => { cancelAnimationFrame(rafRef.current); clearTimeout(cdRef.current); };
  }, []);

  /* ── Contrôles clavier ── */
  useEffect(() => {
    const DIR_MAP = {
      // Flèches
      ArrowUp:    { dx:  0, dy: -1 },
      ArrowDown:  { dx:  0, dy:  1 },
      ArrowLeft:  { dx: -1, dy:  0 },
      ArrowRight: { dx:  1, dy:  0 },
      // QWERTY (WASD)
      w: { dx:  0, dy: -1 }, W: { dx:  0, dy: -1 },
      s: { dx:  0, dy:  1 }, S: { dx:  0, dy:  1 },
      a: { dx: -1, dy:  0 }, A: { dx: -1, dy:  0 },
      d: { dx:  1, dy:  0 }, D: { dx:  1, dy:  0 },
      // AZERTY (ZQSD)
      z: { dx:  0, dy: -1 }, Z: { dx:  0, dy: -1 },
      q: { dx: -1, dy:  0 }, Q: { dx: -1, dy:  0 },
      // s et d sont déjà couverts ci-dessus
    };

    const handle = (e) => {
      const g = gRef.current;
      if (!g) return;

      // Empêcher le scroll sur les flèches
      if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(e.key)) {
        e.preventDefault();
      }

      const newDir = DIR_MAP[e.key];
      if (newDir) {
        if (g.status === 'countdown') {
          // Pendant le countdown : bufferiser la première direction pour le tick 1
          g.dirQueue = [newDir];
          return;
        }
        if (g.status !== 'playing') return;

        // Vérifier l'inversion contre la dernière direction enregistrée
        // (la dernière de la queue, ou la direction actuelle si queue vide)
        const lastDir = g.dirQueue.length > 0
          ? g.dirQueue[g.dirQueue.length - 1]
          : g.dir;
        // Bloquer la marche arrière directe
        if (newDir.dx === -lastDir.dx && newDir.dy === -lastDir.dy) return;
        // Ignorer la même direction
        if (newDir.dx === lastDir.dx && newDir.dy === lastDir.dy) return;
        // Ajouter à la queue (max DIR_QUEUE_MAX)
        if (g.dirQueue.length < DIR_QUEUE_MAX) {
          g.dirQueue.push(newDir);
        }
        return;
      }

      switch (e.key) {
        case 'p': case 'P':
          if (g.status === 'playing') {
            g.status = 'paused';
            setUi((u) => ({ ...u, status: 'paused' }));
            cancelAnimationFrame(rafRef.current);
          } else if (g.status === 'paused') {
            g.status = 'playing';
            setUi((u) => ({ ...u, status: 'playing' }));
            lastTickRef.current = performance.now();
            rafRef.current = requestAnimationFrame(gameLoop);
          }
          break;
        case 'r': case 'R':
          if (g.status !== 'countdown') startGame();
          break;
        case 'Escape':
          onCloseRef.current?.();
          break;
        default:
          break;
      }
    };

    window.addEventListener('keydown', handle);
    return () => window.removeEventListener('keydown', handle);
  // step et startGame sont des fonctions stables (fermetures sur refs uniquement)
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  /* ── Rendu ── */
  return (
    <div className="snake-game">
      {/* HUD */}
      <div className="snake-game__hud">
        <span className="snake-game__score">
          <span className="snake-game__label">Score</span>
          <span className="snake-game__value">{ui.score}</span>
        </span>
        <span className="snake-game__score">
          <span className="snake-game__label">Best</span>
          <span className="snake-game__value">{ui.hs}</span>
        </span>
        <div className="snake-game__close-wrap">
          <Tooltip text="Fermer" desc="ESC" position="bottom">
            <button
              className="snake-game__close-btn"
              onClick={onClose}
              aria-label="Fermer le jeu"
            >
              ✕
            </button>
          </Tooltip>
        </div>
      </div>

      {/* Canvas + overlay */}
      <div className="snake-game__canvas-wrap">
        <canvas ref={canvasRef} width={W} height={H} className="snake-game__canvas" />

        {ui.status !== 'playing' && (
          <div className="snake-game__overlay">

            {/* ── Countdown ── */}
            {ui.status === 'countdown' && (
              <div className="snake-game__cd">
                <span className="snake-game__cd-num" key={ui.countdown}>
                  {ui.countdown}
                </span>
                <div className="snake-game__cd-controls">
                  <div className="snake-game__cd-row">
                    <span className="snake-game__cd-key"></span>
                    <kbd className="snake-game__cd-key">Z W ↑</kbd>
                    <span className="snake-game__cd-key"></span>
                  </div>
                  <div className="snake-game__cd-row">
                    <kbd className="snake-game__cd-key">Q A ←</kbd>
                    <kbd className="snake-game__cd-key">S ↓</kbd>
                    <kbd className="snake-game__cd-key">D →</kbd>
                  </div>
                </div>
              </div>
            )}

            {/* ── Game Over ── */}
            {ui.status === 'gameover' && (
              <div className="snake-game__go">
                <span className="snake-game__overlay-title">GAME OVER</span>
                <div className="snake-game__go-scores">
                  <span className="snake-game__overlay-score">Score : {ui.score}</span>
                  {ui.score > 0 && ui.score >= ui.hs && (
                    <span className="snake-game__overlay-hs">🏆 Nouveau record !</span>
                  )}
                </div>
                <span className="snake-game__overlay-hint">
                  <kbd>R</kbd> Rejouer &nbsp;·&nbsp; <kbd>ESC</kbd> Quitter
                </span>
              </div>
            )}

            {/* ── Pause ── */}
            {ui.status === 'paused' && (
              <div className="snake-game__go">
                <span className="snake-game__overlay-title">PAUSE</span>
                <span className="snake-game__overlay-hint">
                  <kbd>P</kbd> Reprendre &nbsp;·&nbsp; <kbd>R</kbd> Recommencer
                </span>
              </div>
            )}

          </div>
        )}
      </div>

      {/* Barre de contrôles */}
      <div className="snake-game__controls">
        ↑↓←→ · ZQSD · WASD &nbsp;·&nbsp; <kbd>P</kbd> pause &nbsp;·&nbsp; <kbd>R</kbd> restart &nbsp;·&nbsp; <kbd>ESC</kbd> quitter
      </div>
    </div>
  );
};

export default SnakeGame;
