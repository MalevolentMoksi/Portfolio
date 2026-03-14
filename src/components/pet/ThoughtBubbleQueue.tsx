/* ══════════════════════════════════════════════
   ThoughtBubbleQueue — file de pensées flottantes
   Gère jusqu'à 3 bulles simultanées avec types et durées variables.
   Remplace FloatingThought (simple).
   ══════════════════════════════════════════════ */
import { createPortal } from 'react-dom';
import { THOUGHT_SYMBOLS } from './petData';

/* ── Durées par type (ms) ── */
const TYPE_DURATION = {
  symbol: 3500,
  text: 2000,
  reaction: 2500,
};

/* ── SVG icons pour les types "reaction" ── */
const REACTION_ICONS = {
  feed: (
    <path
      d="M4 8 Q4 3 8 3 Q12 3 12 8 L12 10 Q12 13 10 13 L10 15 L6 15 L6 13 Q4 13 4 10 Z"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.4"
      strokeLinejoin="round"
    />
  ),
  petted: (
    <>
      <path
        d="M3 9 Q3 6 5.5 5 Q7 4.5 8 6 Q9 4.5 10.5 5 Q13 6 13 9 Q13 12 8 14 Q3 12 3 9Z"
        fill="currentColor"
        opacity="0.85"
      />
    </>
  ),
  play: (
    <>
      <rect
        x="2"
        y="5"
        width="12"
        height="9"
        rx="2.5"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.4"
      />
      <circle cx="5.5" cy="9.5" r="1.4" fill="currentColor" />
      <circle cx="10.5" cy="9.5" r="1.4" fill="currentColor" />
    </>
  ),
  excited: (
    <path
      d="M8 2 L9.5 6 L14 6 L10.5 9 L12 13 L8 10.5 L4 13 L5.5 9 L2 6 L6.5 6 Z"
      fill="currentColor"
    />
  ),
};

type ThoughtType = 'symbol' | 'text' | 'reaction';
type ReactionIconKey = keyof typeof REACTION_ICONS;
type ThoughtSymbolKey = keyof typeof THOUGHT_SYMBOLS;

export interface ThoughtItem {
  id?: number;
  type: ThoughtType;
  content: string;
  label?: string;
  duration?: number;
}

/* ── Normalise un thought payload ── */
export const normalizeThought = (
  input: string | ThoughtItem
): ThoughtItem & { duration: number } => {
  if (typeof input === 'string') {
    return { type: 'symbol', content: input, duration: TYPE_DURATION.symbol };
  }
  const dur = input.duration ?? TYPE_DURATION[input.type] ?? TYPE_DURATION.symbol;
  return { ...input, duration: dur };
};

/* ── Composant bulle individuelle ── */
const Bubble = ({
  thought,
  idx,
  petX,
  petY,
}: {
  thought: ThoughtItem;
  idx: number;
  petX: number;
  petY: number;
}) => {
  // xOffsets décalent légèrement les bulles multiples ; y empile vers le haut
  const xOffsets = [0, -14, 14];
  const yOffsets = [0, -28, -22];
  const x = petX + (xOffsets[idx] ?? 0);
  const y = petY - 82 + (yOffsets[idx] ?? 0);

  const { type, content, label } = thought;

  /* ── Symbol bubble ── */
  if (type === 'symbol') {
    const sym = THOUGHT_SYMBOLS[content as ThoughtSymbolKey];
    if (!sym) return null;
    return createPortal(
      <div
        className="pet-thought pet-thought--symbol"
        style={{ left: `${x}px`, top: `${y}px`, '--tb-delay': `${idx * 80}ms` }}
        aria-hidden="true"
      >
        <svg
          viewBox="0 0 16 16"
          width="14"
          height="14"
          fill="currentColor"
          stroke="none"
          overflow="visible"
        >
          {sym}
        </svg>
      </div>,
      document.body
    );
  }

  /* ── Text bubble ── */
  if (type === 'text') {
    return createPortal(
      <div
        className="pet-thought pet-thought--text"
        style={{ left: `${x}px`, top: `${y + 4}px`, '--tb-delay': `${idx * 80}ms` }}
        aria-hidden="true"
      >
        {content}
      </div>,
      document.body
    );
  }

  /* ── Reaction bubble (icon + optional label) ── */
  if (type === 'reaction') {
    const icon = REACTION_ICONS[content as ReactionIconKey];
    return createPortal(
      <div
        className="pet-thought pet-thought--reaction"
        style={{ left: `${x}px`, top: `${y}px`, '--tb-delay': `${idx * 80}ms` }}
        aria-hidden="true"
      >
        {icon && (
          <svg
            viewBox="0 0 16 16"
            width="14"
            height="14"
            fill="currentColor"
            stroke="none"
            overflow="visible"
          >
            {icon}
          </svg>
        )}
        {label && <span className="pet-thought-label">{label}</span>}
      </div>,
      document.body
    );
  }

  return null;
};

/* ── Composant principal — rend toutes les bulles actives ── */
const ThoughtBubbleQueue = ({
  queue,
  petX,
  petY,
}: {
  queue: ThoughtItem[];
  petX: number;
  petY: number;
}) => {
  if (!queue || queue.length === 0) return null;
  return queue
    .slice(0, 3)
    .map((thought, idx) => (
      <Bubble key={thought.id} thought={thought} idx={idx} petX={petX} petY={petY} />
    ));
};

export default ThoughtBubbleQueue;
