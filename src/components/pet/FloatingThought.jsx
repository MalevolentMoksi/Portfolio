/* ══════════════════════════════════════════════
   Pensée flottante — emoji SVG qui monte puis disparaît
   ══════════════════════════════════════════════ */
import { createPortal } from 'react-dom';
import { THOUGHT_SYMBOLS } from './petData.jsx';

const FloatingThought = ({ symbol, petX, petY }) => {
  if (!symbol || !THOUGHT_SYMBOLS[symbol]) return null;
  return createPortal(
    <div
      className="pet-thought-bubble"
      style={{ left: `${petX - 22}px`, top: `${petY - 78}px` }}
      aria-hidden="true"
    >
      <svg viewBox="0 0 16 16" width="15" height="15" fill="currentColor" stroke="none" overflow="visible">
        {THOUGHT_SYMBOLS[symbol]}
      </svg>
    </div>,
    document.body,
  );
};

export default FloatingThought;
