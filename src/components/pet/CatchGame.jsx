/* ══════════════════════════════════════════════
   Jeu d'Attrape — lance une balle, le bot la renvoie
   Trajectoire prévisualisée + lancer directionnel
   Bot-held phase : le robot attrape, tient, puis relance
   ══════════════════════════════════════════════ */
import { useRef, useEffect, useState, useCallback } from 'react';
import { createPortal } from 'react-dom';
import {
  CATCH_BALL_SIZE, CATCH_BALL_SPEED, CATCH_BALL_GRAVITY,
  CATCH_BOT_RADIUS, BOUNCE_RESTITUTION,
  CATCH_BOT_HOLD_MIN, CATCH_BOT_HOLD_RANGE, CATCH_BOT_THROW_SPREAD,
} from './petConstants.js';
import { byTier } from '@utils/performanceTier.js';

const BALL_R        = CATCH_BALL_SIZE / 2;
const PLAYER_CATCH  = 85;           // zone de recatch joueur — plus généreuse
const BOT_CATCH     = CATCH_BOT_RADIUS;
const BALL_TOP_MIN  = BALL_R;
const VEL_HIST_MAX  = 6;
const AIM_STEPS     = byTier({ high: 22, mid: 16, low: 10 });
const AIM_DT        = 2.5;
const AIM_DIRTY_THRESH = 0.3; // seuil de changement pour recalculer la visée
const HINT_DELAY_MS = 3000;
const VEL_SMOOTH    = 0.55;         // EMA plus réactif (vs 0.35 avant)
const AIR_FRICTION  = 0.997;        // friction air plus forte (vs 0.999) — réduit les rebonds interminables
const STOP_THRESH   = 0.5;          // seuil d'arrêt de balle (vs 0.25)

const closestPointOnSegment = (ax, ay, bx, by, px, py) => {
  const abx = bx - ax;
  const aby = by - ay;
  const ab2 = abx * abx + aby * aby;
  if (ab2 <= 1e-6) return { x: ax, y: ay, t: 0 };
  const apx = px - ax;
  const apy = py - ay;
  const t = Math.max(0, Math.min(1, (apx * abx + apy * aby) / ab2));
  return { x: ax + abx * t, y: ay + aby * t, t };
};

const CatchGame = ({ botPosRef, onBotCatch, onGameEnd, ballInfoRef, stats }) => {
  const startX = window.innerWidth / 2;
  const startY = window.innerHeight - 120;

  /* ── Physics refs (mutated in RAF, never trigger re-renders) ── */
  const ballPosRef       = useRef({ x: startX, y: startY });
  const ballVelRef       = useRef({ x: 0, y: 0 });
  const holderRef        = useRef('player');
  const catchCooldownRef = useRef(0);
  const cursorRef        = useRef({ x: startX, y: startY });
  const velHistRef       = useRef([]);
  const smoothVelRef     = useRef({ x: 0, y: 0 });
  const rafRef           = useRef(null);
  const prevTimeRef      = useRef(null);

  /* ── Bot-held phase ── */
  const botHoldCounterRef = useRef(0);

  /* ── DOM refs — direct manipulation, no React state churn ── */
  const ballElRef  = useRef(null);
  const aimSvgRef  = useRef(null);
  const aimPathRef = useRef(null);

  /* ── Dirty flag for buildAim — skip expensive SVG rebuild when aim unchanged ── */
  const prevAimVelRef = useRef({ x: 0, y: 0 });

  /* ── React state only for conditional rendering (infrequent changes) ── */
  const [isHeld, setIsHeld]     = useState(true);
  const [rallies, setRallies]   = useState(0);
  const [showHint, setShowHint] = useState(false);
  const [showIntro, setShowIntro] = useState(true);
  // { x, y } while ripple is active, null otherwise
  const [catchRipple, setCatchRipple] = useState(null);
  const hintTimerRef = useRef(null);

  /* ── Best score persistence ── */
  const LS_BEST = 'catch-best-rallies';
  const [bestScore, setBestScore] = useState(() =>
    parseInt(localStorage.getItem(LS_BEST) || '0', 10)
  );
  const bestRef = useRef(bestScore);

  /* ── Mise à jour du best score quand rallies change ── */
  useEffect(() => {
    if (rallies > bestRef.current) {
      bestRef.current = rallies;
      setBestScore(rallies);
      localStorage.setItem(LS_BEST, String(rallies));
    }
  }, [rallies]);

  /* ── Escape pour quitter ── */
  useEffect(() => {
    const handle = (e) => {
      if (e.key === 'Escape') onGameEnd();
    };
    window.addEventListener('keydown', handle);
    return () => window.removeEventListener('keydown', handle);
  }, [onGameEnd]);

  /* ── Mouse tracking ── */
  useEffect(() => {
    const onMove = (e) => {
      cursorRef.current = { x: e.clientX, y: e.clientY };
      velHistRef.current.push({ x: e.clientX, y: e.clientY, t: Date.now() });
      if (velHistRef.current.length > VEL_HIST_MAX) velHistRef.current.shift();
    };
    window.addEventListener('mousemove', onMove, { passive: true });
    return () => window.removeEventListener('mousemove', onMove);
  }, []);

  /* ── SVG viewBox — set once on mount + resize, not every frame ── */
  useEffect(() => {
    const syncViewBox = () => {
      if (aimSvgRef.current) aimSvgRef.current.setAttribute('viewBox', `0 0 ${window.innerWidth} ${window.innerHeight}`);
    };
    syncViewBox();
    window.addEventListener('resize', syncViewBox);
    return () => window.removeEventListener('resize', syncViewBox);
  }, []);

  /* ── Mark body as catching so overlay blur can exempt pet & thoughts ── */
  useEffect(() => {
    const prev = document.body.dataset.catching;
    document.body.dataset.catching = 'true';
    return () => {
      if (prev === undefined) delete document.body.dataset.catching;
      else document.body.dataset.catching = prev;
    };
  }, []);

  /* ── Raw mouse velocity from history ── */
  const getRawVel = () => {
    const h = velHistRef.current;
    if (h.length < 2) return { vx: 0, vy: 0, speed: 0 };
    const a = h[0], b = h[h.length - 1];
    const dt = Math.max(b.t - a.t, 8);
    const vx = ((b.x - a.x) / dt) * 16;
    const vy = ((b.y - a.y) / dt) * 16;
    return { vx, vy, speed: Math.sqrt(vx * vx + vy * vy) };
  };

  /* ── Target throw velocity — always fixed speed, mouse direction only ── */
  const targetVel = () => {
    const { vx, vy, speed } = getRawVel();
    if (speed > 1.5) {
      // Mouse is moving → throw in that exact direction at fixed speed
      return { vx: (vx / speed) * CATCH_BALL_SPEED, vy: (vy / speed) * CATCH_BALL_SPEED };
    }
    // Mouse still → hold the last smoothed direction so the aim line freezes in place.
    // (Ball is stuck to cursor so ball→cursor == (0,0), never use that as a direction.)
    const sv = smoothVelRef.current;
    const svSpd = Math.sqrt(sv.x * sv.x + sv.y * sv.y);
    if (svSpd > 0.1) return { vx: sv.x, vy: sv.y };
    // No movement history yet → aim straight right as a neutral default
    return { vx: CATCH_BALL_SPEED, vy: 0 };
  };

  /* ── Simulate trajectory → SVG path string ── */
  const buildAim = (fromX, fromY, vx, vy) => {
    const vw = window.innerWidth, vh = window.innerHeight;
    let sx = fromX, sy = fromY, svx = vx, svy = vy;
    let d = `M${sx.toFixed(1)},${sy.toFixed(1)}`;
    for (let i = 0; i < AIM_STEPS; i++) {
      svy += CATCH_BALL_GRAVITY * AIM_DT;
      svx *= AIR_FRICTION; svy *= AIR_FRICTION;
      sx += svx * AIM_DT; sy += svy * AIM_DT;
      if (sx < BALL_R)          { sx = BALL_R;          svx =  Math.abs(svx) * BOUNCE_RESTITUTION; }
      else if (sx > vw - BALL_R){ sx = vw - BALL_R;     svx = -Math.abs(svx) * BOUNCE_RESTITUTION; }
      if (sy < BALL_TOP_MIN)          { sy = BALL_TOP_MIN;      svy =  Math.abs(svy) * BOUNCE_RESTITUTION; }
      else if (sy > vh - BALL_R - 4)  { sy = vh - BALL_R - 4;   svy = -Math.abs(svy) * BOUNCE_RESTITUTION; }
      d += ` L${sx.toFixed(1)},${sy.toFixed(1)}`;
    }
    return d;
  };

  /* ── Throw on click ── */
  const handleClick = useCallback((e) => {
    if (showIntro) { setShowIntro(false); return; }
    if (holderRef.current !== 'player') return;
    e.stopPropagation();
    const sv = smoothVelRef.current;
    ballVelRef.current = { x: sv.x, y: sv.y };
    holderRef.current = 'flying';
    // Cooldown only for player's recatch right after throw
    catchCooldownRef.current = 22;
    velHistRef.current = [];
    smoothVelRef.current = { x: 0, y: 0 };
    setIsHeld(false);
    setShowHint(false);
    clearTimeout(hintTimerRef.current);
    if (aimPathRef.current) aimPathRef.current.setAttribute('d', '');
  }, [showIntro]);

  /* ── Hint timer ── */
  const startHoldTimer = useCallback(() => {
    setShowHint(false);
    clearTimeout(hintTimerRef.current);
    hintTimerRef.current = setTimeout(() => setShowHint(true), HINT_DELAY_MS);
  }, []);
  useEffect(() => {
    startHoldTimer();
    return () => clearTimeout(hintTimerRef.current);
  }, [startHoldTimer]);

  /* ── Helper: transition ball back to player ── */
  const snapToPlayer = (bv) => {
    holderRef.current = 'player';
    bv.x = 0; bv.y = 0;
    velHistRef.current = [];
    smoothVelRef.current = { x: 0, y: 0 };
    setIsHeld(true);
    startHoldTimer();
  };

  /* ══ Main physics RAF loop ══ */
  useEffect(() => {
    const tick = (now) => {
      // delta-time normalization: dt == 1.0 at 60 FPS
      const dt = prevTimeRef.current === null
        ? 1
        : Math.min((now - prevTimeRef.current) / (1000 / 60), 3);
      prevTimeRef.current = now;

      const vw = window.innerWidth, vh = window.innerHeight;
      const bp = ballPosRef.current, bv = ballVelRef.current;
      const holder = holderRef.current;
      if (catchCooldownRef.current > 0) catchCooldownRef.current = Math.max(0, catchCooldownRef.current - dt);

      // ── Expose ball state to WanderingPet for seek steering ──
      if (ballInfoRef) {
        ballInfoRef.current = { x: bp.x, y: bp.y, vx: bv.x, vy: bv.y, holder };
      }

      /* ── Player holds ball ── */
      if (holder === 'player') {
        bp.x = cursorRef.current.x;
        bp.y = cursorRef.current.y;

        const t = targetVel();
        const sv = smoothVelRef.current;
        // dt-correct exponential moving average
        const emaFactor = 1 - (1 - VEL_SMOOTH) ** dt;
        sv.x += (t.vx - sv.x) * emaFactor;
        sv.y += (t.vy - sv.y) * emaFactor;
        // Only rebuild aim path when smoothed velocity changed meaningfully
        const pav = prevAimVelRef.current;
        const dvx = sv.x - pav.x, dvy = sv.y - pav.y;
        if (dvx * dvx + dvy * dvy > AIM_DIRTY_THRESH * AIM_DIRTY_THRESH) {
          pav.x = sv.x; pav.y = sv.y;
          if (aimPathRef.current) aimPathRef.current.setAttribute('d', buildAim(bp.x, bp.y, sv.x, sv.y));
        }
        if (ballElRef.current) {
          ballElRef.current.style.transform = `translate(${bp.x - BALL_R}px,${bp.y - BALL_R}px)`;
        }
        rafRef.current = requestAnimationFrame(tick);
        return;
      }

      /* ── Bot is holding the ball — follow bot position, countdown to throw ── */
      if (holder === 'bot-held') {
        const bot = botPosRef.current;
        bp.x = bot.x;
        bp.y = bot.y;
        botHoldCounterRef.current -= dt;

          if (botHoldCounterRef.current <= 0) {
          // ── Weighted random throw style ──────────────────────────────
          //   50% direct  — straight line, fixed speed
          //   30% arc     — medium ballistic parabola
          //   15% lob     — tall slow arc
          //    5% fastball — fast and nearly flat
          // All styles use the same ballistic formula:
          //   vx = dx / T
          //   vy = dy / T  −  0.5 · g · T
          // T controls arc height and speed: short T = fast/flat, long T = slow/high.
          // Direct is the exception: aims at fixed speed, ignoring g compensation.
          const cx = cursorRef.current.x, cy = cursorRef.current.y;
          const dx = cx - bot.x;
          const dist = Math.sqrt(dx * dx + (cy - bot.y) * (cy - bot.y)) || 1;

          // Upward bias — lift the aim target so every throw arcs up before landing.
          // Scales with distance (subtle when close, pronounced when far), capped at 90px.
          const upBias = Math.min(90, dist * 0.18);
          const cy_target = cy - upBias;
          const dy = cy_target - bot.y;

          const roll = Math.random();
          let tvx, tvy;

          if (roll < 0.50) {
            // ── Direct — straight shot at fixed speed toward biased target ──
            const dxB = cx - bot.x, dyB = cy_target - bot.y;
            const distB = Math.sqrt(dxB * dxB + dyB * dyB) || 1;
            const spd = CATCH_BALL_SPEED * 0.85;
            tvx = (dxB / distB) * spd;
            tvy = (dyB / distB) * spd;
          } else if (roll < 0.80) {
            // ── Arc — medium parabola, lands at biased target ──
            const T = Math.max(30, Math.min(65, dist / 8));
            tvx = dx / T;
            tvy = dy / T - 0.5 * CATCH_BALL_GRAVITY * T;
          } else if (roll < 0.95) {
            // ── Lob — high slow arc ──
            const T = Math.max(55, Math.min(95, dist / 5));
            tvx = dx / T;
            tvy = dy / T - 0.5 * CATCH_BALL_GRAVITY * T;
          } else {
            // ── Fastball — fast, nearly flat ──
            const T = Math.max(16, Math.min(28, dist / 16));
            tvx = dx / T;
            tvy = dy / T - 0.5 * CATCH_BALL_GRAVITY * T;
          }

          // Small angular spread for natural imprecision
          const arcSpd = Math.sqrt(tvx * tvx + tvy * tvy);
          const baseAngle = Math.atan2(tvy, tvx);
          const spread = (Math.random() - 0.5) * 2 * CATCH_BOT_THROW_SPREAD;
          const throwAngle = baseAngle + spread;
          bv.x = Math.cos(throwAngle) * arcSpd;
          bv.y = Math.sin(throwAngle) * arcSpd;
          bp.x = bot.x + Math.cos(throwAngle) * (BOT_CATCH + 6);
          bp.y = bot.y + Math.sin(throwAngle) * (BOT_CATCH + 6);
          catchCooldownRef.current = 18;
          holderRef.current = 'returning';
        }

        if (ballElRef.current) {
          ballElRef.current.style.transform = `translate(${bp.x - BALL_R}px,${bp.y - BALL_R}px)`;
        }
        rafRef.current = requestAnimationFrame(tick);
        return;
      }

      /* ── Ball in flight / returning ── */
      const prevX = bp.x;
      const prevY = bp.y;
      // Integrate forces using dt so physics are wall-clock consistent
      bv.y += CATCH_BALL_GRAVITY * dt;
      bv.x *= AIR_FRICTION ** dt; bv.y *= AIR_FRICTION ** dt;
      bp.x += bv.x * dt;  bp.y += bv.y * dt;

      // Wall bounces
      if (bp.x < BALL_R)               { bp.x = BALL_R;            bv.x =  Math.abs(bv.x) * BOUNCE_RESTITUTION; }
      else if (bp.x > vw - BALL_R)     { bp.x = vw - BALL_R;      bv.x = -Math.abs(bv.x) * BOUNCE_RESTITUTION; }
      if (bp.y < BALL_TOP_MIN)         { bp.y = BALL_TOP_MIN;      bv.y =  Math.abs(bv.y) * BOUNCE_RESTITUTION; }
      else if (bp.y > vh - BALL_R - 4) { bp.y = vh - BALL_R - 4;  bv.y = -Math.abs(bv.y) * BOUNCE_RESTITUTION; }

      // Bot catch — CCD proximity detection → bot-held phase
      if (holderRef.current === 'flying') {
        const bot = botPosRef.current;
        const hit = closestPointOnSegment(prevX, prevY, bp.x, bp.y, bot.x, bot.y);
        const hx = hit.x - bot.x;
        const hy = hit.y - bot.y;
        const hitDist = Math.sqrt(hx * hx + hy * hy);
        if (hitDist < BOT_CATCH) {
          onBotCatch();
          // Snap ball to bot and enter bot-held phase
          bp.x = bot.x;
          bp.y = bot.y;
          bv.x = 0; bv.y = 0;
          holderRef.current = 'bot-held';
          botHoldCounterRef.current = CATCH_BOT_HOLD_MIN + Math.floor(Math.random() * CATCH_BOT_HOLD_RANGE);
          setRallies(r => r + 1);
          setCatchRipple({ x: bot.x, y: bot.y });
          setTimeout(() => setCatchRipple(null), 450);
        }
      }

      // Player catch
      if (holderRef.current !== 'player' && holderRef.current !== 'bot-held' && catchCooldownRef.current <= 0) {
        const cx = cursorRef.current.x, cy = cursorRef.current.y;
        const dx = bp.x - cx, dy = bp.y - cy;
        if (Math.sqrt(dx * dx + dy * dy) < PLAYER_CATCH) {
          snapToPlayer(bv);
        }
      }

      // Ball nearly stopped → snap to player
      // Only in 'returning' state — never in 'flying', which would cause the
      // ball to teleport back at its apex (near-zero vel when thrown straight up).
      if (holderRef.current === 'returning' && Math.sqrt(bv.x * bv.x + bv.y * bv.y) < STOP_THRESH) {
        snapToPlayer(bv);
      }

      // Move ball via DOM — transform is compositor-only, avoids layout recalc
      if (ballElRef.current) {
        ballElRef.current.style.transform = `translate(${bp.x - BALL_R}px,${bp.y - BALL_R}px)`;
      }
      rafRef.current = requestAnimationFrame(tick);
    };

    rafRef.current = requestAnimationFrame(tick);
    return () => {
      cancelAnimationFrame(rafRef.current);
      prevTimeRef.current = null;
    };
  }, [botPosRef, onBotCatch, startHoldTimer, ballInfoRef]);

  return createPortal(
    <div className={`catch-game-overlay${catchRipple ? ' catch-game-overlay--flash' : ''}`} onClick={handleClick}>

      {/* Ripple localisé au point de catch du bot */}
      {catchRipple && (
        <div
          className="catch-ripple"
          style={{ left: catchRipple.x, top: catchRipple.y }}
        />
      )}

      {/* Écran d'instructions initial */}
      {showIntro && (
        <div className="catch-game-intro">
          <div className="catch-game-intro-title">🏓 Jeu d'Attrape</div>
          <div className="catch-game-intro-steps">
            <div className="catch-game-intro-step">
              <span className="catch-game-intro-icon">🖱️</span>
              <span>Bouge la souris pour viser</span>
            </div>
            <div className="catch-game-intro-step">
              <span className="catch-game-intro-icon">👆</span>
              <span>Clique pour lancer la balle</span>
            </div>
            <div className="catch-game-intro-step">
              <span className="catch-game-intro-icon">🤖</span>
              <span>Le robot la renvoie — rattrape-la !</span>
            </div>
          </div>
          <div className="catch-game-intro-start">Clique n'importe où pour commencer</div>
        </div>
      )}

      {/* HUD Score + Mini Stats — masqué pendant l'intro */}
      {!showIntro && <div className="catch-game-score">
        <div className="catch-game-score-label">Rallies</div>
        <div className="catch-game-score-value">{rallies}</div>
        {bestScore > 0 && (
          <div className="catch-game-score-best">Record : {bestScore}</div>
        )}
        {/* Mini stat bars */}
        {stats && (
          <div className="catch-game-stats">
            <div className="catch-game-stat">
              <svg className="catch-game-stat-icon" viewBox="0 0 16 16" width="11" height="11" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" aria-label="Faim">
                <line x1="5" y1="2" x2="5" y2="6" />
                <path d="M3 2 L3 5 Q3 7 5 7 Q7 7 7 5 L7 2" />
                <line x1="5" y1="7" x2="5" y2="14" />
                <line x1="11" y1="2" x2="11" y2="14" />
                <path d="M9 2 Q11 3 11 6" />
              </svg>
              <div className="catch-game-stat-track">
                <div className={`catch-game-stat-fill${stats.hunger < 30 ? ' catch-game-stat-fill--critical' : ''}`}
                  style={{ width: `${stats.hunger}%` }} />
              </div>
              <span className="catch-game-stat-value">{stats.hunger}%</span>
            </div>
            <div className="catch-game-stat">
              <svg className="catch-game-stat-icon" viewBox="0 0 16 16" width="11" height="11" fill="currentColor" stroke="none" aria-label="Bonheur">
                <path d="M8 2 L9.5 6.2 L14 6.2 L10.5 8.8 L11.8 13 L8 10.5 L4.2 13 L5.5 8.8 L2 6.2 L6.5 6.2 Z" />
              </svg>
              <div className="catch-game-stat-track">
                <div className={`catch-game-stat-fill${stats.happiness < 30 ? ' catch-game-stat-fill--critical' : ''}`}
                  style={{ width: `${stats.happiness}%` }} />
              </div>
              <span className="catch-game-stat-value">{stats.happiness}%</span>
            </div>
          </div>
        )}
      </div>}

      {/* Aim line — always mounted, path written via ref; viewBox managed by resize listener */}
      <svg
        ref={aimSvgRef}
        className="catch-aim-line"
        preserveAspectRatio="none"
      >
        <path ref={aimPathRef} d="" fill="none" stroke="currentColor"
          strokeWidth="2" strokeDasharray="6 4" strokeLinecap="round" opacity="0.5" />
      </svg>

      {/* Hint — only after holding 3 s */}
      {showHint && isHeld && (
        <div className="catch-game-hint">
          Bouge la souris pour viser, clique pour lancer
        </div>
      )}

      {/* Exit — agrandi + raccourci ESC */}
      <button
        className="catch-game-exit"
        onClick={(e) => { e.stopPropagation(); onGameEnd(); }}
        aria-label="Quitter le jeu (ESC)"
      >
        <svg viewBox="0 0 16 16" width="16" height="16" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" fill="none" aria-hidden="true">
          <line x1="3" y1="3" x2="13" y2="13" />
          <line x1="13" y1="3" x2="3" y2="13" />
        </svg>
        <span className="catch-game-exit-label">ESC</span>
      </button>

      {/* Ball — position written via ref using transform (GPU-composited) */}
      <div
        ref={ballElRef}
        className={`catch-ball${isHeld ? ' catch-ball--held' : ''}`}
        style={{ transform: `translate(${startX - BALL_R}px,${startY - BALL_R}px)` }}
      >
        <svg viewBox="0 0 22 22" width={CATCH_BALL_SIZE} height={CATCH_BALL_SIZE}>
          <defs>
            <radialGradient id="ballGrad" cx="0.35" cy="0.35" r="0.65">
              <stop offset="0%" stopColor="rgba(255,255,255,0.35)" />
              <stop offset="100%" stopColor="rgba(0,0,0,0.15)" />
            </radialGradient>
          </defs>
          <circle cx="11" cy="11" r="10" fill="currentColor" />
          <circle cx="11" cy="11" r="10" fill="url(#ballGrad)" />
          <path d="M4 11 Q11 6 18 11" fill="none" stroke="rgba(0,0,0,0.2)" strokeWidth="0.8" />
          <path d="M4 11 Q11 16 18 11" fill="none" stroke="rgba(0,0,0,0.2)" strokeWidth="0.8" />
        </svg>
      </div>
    </div>,
    document.body,
  );
};

export default CatchGame;
