/* ══════════════════════════════════════════════
   Jeu d'Attrape — lance une balle, le bot la renvoie
   Trajectoire prévisualisée + lancer directionnel
   ══════════════════════════════════════════════ */
import { useRef, useEffect, useState, useCallback } from 'react';
import { createPortal } from 'react-dom';
import {
  CATCH_BALL_SIZE, CATCH_BALL_SPEED, CATCH_BALL_GRAVITY,
  CATCH_BOT_RADIUS, BOUNCE_RESTITUTION,
} from './petConstants.js';

const BALL_R        = CATCH_BALL_SIZE / 2;
const PLAYER_CATCH  = 70;
const BOT_CATCH     = CATCH_BOT_RADIUS;
const BALL_TOP_MIN  = BALL_R;
const VEL_HIST_MAX  = 6;
const AIM_STEPS     = 32;
const AIM_DT        = 2.5;
const HINT_DELAY_MS = 3000;
const VEL_SMOOTH    = 0.35;   // EMA blending factor — lower = smoother / slower

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

const CatchGame = ({ botPosRef, onBotCatch, onGameEnd }) => {
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

  /* ── DOM refs — direct manipulation, no React state churn ── */
  const ballElRef  = useRef(null);
  const aimSvgRef  = useRef(null);
  const aimPathRef = useRef(null);

  /* ── React state only for conditional rendering (infrequent changes) ── */
  const [isHeld, setIsHeld]     = useState(true);
  const [rallies, setRallies]   = useState(0);
  const [showHint, setShowHint] = useState(false);
  const hintTimerRef = useRef(null);

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
      svx *= 0.999; svy *= 0.999;
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
  }, []);

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
    const tick = () => {
      const vw = window.innerWidth, vh = window.innerHeight;
      const bp = ballPosRef.current, bv = ballVelRef.current;
      if (catchCooldownRef.current > 0) catchCooldownRef.current--;

      /* ── Player holds ball ── */
      if (holderRef.current === 'player') {
        bp.x = cursorRef.current.x;
        bp.y = cursorRef.current.y;

        // Smooth aim velocity (exponential moving average)
        const t = targetVel();
        const sv = smoothVelRef.current;
        sv.x += (t.vx - sv.x) * VEL_SMOOTH;
        sv.y += (t.vy - sv.y) * VEL_SMOOTH;

        // Update aim SVG via DOM (viewBox kept in sync with viewport)
        if (aimSvgRef.current) aimSvgRef.current.setAttribute('viewBox', `0 0 ${vw} ${vh}`);
        if (aimPathRef.current) aimPathRef.current.setAttribute('d', buildAim(bp.x, bp.y, sv.x, sv.y));
        if (ballElRef.current) {
          ballElRef.current.style.left = `${bp.x - BALL_R}px`;
          ballElRef.current.style.top  = `${bp.y - BALL_R}px`;
        }
        rafRef.current = requestAnimationFrame(tick);
        return;
      }

      /* ── Ball in flight / returning ── */
      const prevX = bp.x;
      const prevY = bp.y;
      bv.y += CATCH_BALL_GRAVITY;
      bv.x *= 0.999; bv.y *= 0.999;
      bp.x += bv.x;  bp.y += bv.y;

      // Wall bounces
      if (bp.x < BALL_R)               { bp.x = BALL_R;            bv.x =  Math.abs(bv.x) * BOUNCE_RESTITUTION; }
      else if (bp.x > vw - BALL_R)     { bp.x = vw - BALL_R;      bv.x = -Math.abs(bv.x) * BOUNCE_RESTITUTION; }
      if (bp.y < BALL_TOP_MIN)         { bp.y = BALL_TOP_MIN;      bv.y =  Math.abs(bv.y) * BOUNCE_RESTITUTION; }
      else if (bp.y > vh - BALL_R - 4) { bp.y = vh - BALL_R - 4;  bv.y = -Math.abs(bv.y) * BOUNCE_RESTITUTION; }

      // Bot catch
      if (holderRef.current === 'flying') {
        const bot = botPosRef.current;
        const hit = closestPointOnSegment(prevX, prevY, bp.x, bp.y, bot.x, bot.y);
        const hx = hit.x - bot.x;
        const hy = hit.y - bot.y;
        const hitDist = Math.sqrt(hx * hx + hy * hy);
        if (hitDist < BOT_CATCH) {
          onBotCatch();
          const cx = cursorRef.current.x, cy = cursorRef.current.y - 40;
          const tdx = cx - bot.x, tdy = cy - bot.y;
          const td = Math.sqrt(tdx * tdx + tdy * tdy) || 1;
          const spd = CATCH_BALL_SPEED * 0.9;
          // Reposition from impact direction (continuous collision), fallback to current vector.
          const dx = hitDist > 1e-6 ? hx : (bp.x - bot.x);
          const dy = hitDist > 1e-6 ? hy : (bp.y - bot.y);
          const pd = Math.sqrt(dx * dx + dy * dy) || 1;
          bp.x = bot.x + (dx / pd) * (BOT_CATCH + 6);
          bp.y = bot.y + (dy / pd) * (BOT_CATCH + 6);
          bv.x = (tdx / td) * spd;
          bv.y = (tdy / td) * spd;
          catchCooldownRef.current = 18;
          holderRef.current = 'returning';
          setRallies(r => r + 1);
        }
      }

      // Player catch
      if (holderRef.current !== 'player' && catchCooldownRef.current <= 0) {
        const cx = cursorRef.current.x, cy = cursorRef.current.y;
        const dx = bp.x - cx, dy = bp.y - cy;
        if (Math.sqrt(dx * dx + dy * dy) < PLAYER_CATCH) {
          snapToPlayer(bv);
        }
      }

      // Ball nearly stopped → snap to player
      if (Math.sqrt(bv.x * bv.x + bv.y * bv.y) < 0.25 && holderRef.current !== 'player') {
        snapToPlayer(bv);
      }

      // Move ball via DOM
      if (ballElRef.current) {
        ballElRef.current.style.left = `${bp.x - BALL_R}px`;
        ballElRef.current.style.top  = `${bp.y - BALL_R}px`;
      }
      rafRef.current = requestAnimationFrame(tick);
    };

    rafRef.current = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(rafRef.current);
  }, [botPosRef, onBotCatch, startHoldTimer]);

  return createPortal(
    <div className="catch-game-overlay" onClick={handleClick}>
      {/* Score */}
      <div className="catch-game-score">
        <svg viewBox="0 0 16 16" width="12" height="12" fill="currentColor" stroke="none" aria-hidden="true">
          <circle cx="8" cy="8" r="7" />
        </svg>
        <span>{rallies}</span>
      </div>

      {/* Aim line — always mounted, path written via ref; viewBox synced to viewport */}
      <svg
        ref={aimSvgRef}
        className="catch-aim-line"
        viewBox={`0 0 ${window.innerWidth} ${window.innerHeight}`}
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

      {/* Exit */}
      <button
        className="catch-game-exit"
        onClick={(e) => { e.stopPropagation(); onGameEnd(); }}
        aria-label="Quitter le jeu"
      >
        <svg viewBox="0 0 16 16" width="15" height="15" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" fill="none" aria-hidden="true">
          <line x1="3" y1="3" x2="13" y2="13" />
          <line x1="13" y1="3" x2="3" y2="13" />
        </svg>
      </button>

      {/* Ball — position written via ref */}
      <div
        ref={ballElRef}
        className={`catch-ball${isHeld ? ' catch-ball--held' : ''}`}
        style={{ left: `${startX - BALL_R}px`, top: `${startY - BALL_R}px` }}
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
