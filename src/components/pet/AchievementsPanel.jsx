/* ══════════════════════════════════════════════
   Panneau de succès — grille de tuiles
   ══════════════════════════════════════════════ */
import { ACHIEVEMENTS } from './petConstants.js';

/* Icônes SVG par ID de succès (viewBox 0 0 16 16) */
const ACHIEVEMENT_ICONS = {
  'wall-bounce': (
    <svg viewBox="0 0 16 16" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" aria-hidden="true">
      <rect x="1" y="1" width="3" height="14" rx="0.5" opacity="0.5" />
      <circle cx="10" cy="8" r="3" />
      <path d="M7 8 L4 5" strokeDasharray="2 1.5" />
      <path d="M4 11 L7 8" strokeDasharray="2 1.5" />
    </svg>
  ),
  'pet-action': (
    <svg viewBox="0 0 16 16" width="16" height="16" fill="currentColor" stroke="none" aria-hidden="true">
      <path d="M3 7.5 Q3 5 5.5 4 Q7 3.5 8 5 Q9 3.5 10.5 4 Q13 5 13 7.5 Q13 11 8 13.5 Q3 11 3 7.5Z" opacity="0.85" />
    </svg>
  ),
  'footer-sit': (
    <svg viewBox="0 0 16 16" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" aria-hidden="true">
      <rect x="1" y="12" width="14" height="2.5" rx="0.5" opacity="0.5" />
      <rect x="5.5" y="6" width="5" height="6" rx="1.5" />
      <circle cx="8" cy="4.5" r="2" />
    </svg>
  ),
  'thrive': (
    <svg viewBox="0 0 16 16" width="16" height="16" fill="currentColor" stroke="none" aria-hidden="true">
      <path d="M8 1.5 L9.6 6 L14.5 6 L10.5 9 L12 13.5 L8 11 L4 13.5 L5.5 9 L1.5 6 L6.4 6 Z" />
    </svg>
  ),
  'particles': (
    <svg viewBox="0 0 16 16" width="16" height="16" fill="currentColor" stroke="none" aria-hidden="true">
      <circle cx="3" cy="5" r="1.5" opacity="0.7" />
      <circle cx="8" cy="3" r="2" opacity="0.9" />
      <circle cx="13" cy="6" r="1.2" opacity="0.6" />
      <circle cx="5" cy="11" r="1.8" opacity="0.8" />
      <circle cx="11" cy="12" r="1.4" opacity="0.65" />
      <circle cx="8" cy="8" r="1" opacity="0.5" />
    </svg>
  ),
  'throw': (
    <svg viewBox="0 0 16 16" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" aria-hidden="true">
      <path d="M3 13 L8 5" />
      <path d="M8 5 L13 2" />
      <circle cx="13" cy="2" r="2" fill="currentColor" stroke="none" opacity="0.7" />
      <path d="M5 10 L3 13 L6 12" />
    </svg>
  ),
  'catch-game': (
    <svg viewBox="0 0 16 16" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="1.4" aria-hidden="true">
      <circle cx="8" cy="8" r="5" />
      <path d="M5 8 Q8 4 11 8" />
      <path d="M5 8 Q8 12 11 8" />
    </svg>
  ),
  'sleep': (
    <svg viewBox="0 0 16 16" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M5.5 7.5 L10.5 7.5 L5.5 10.5 L10.5 10.5" />
      <path d="M8 2.5 L13.5 2.5 L8 6 L13.5 6" />
    </svg>
  ),
  'combo': (
    <svg viewBox="0 0 16 16" width="16" height="16" fill="currentColor" stroke="none" aria-hidden="true">
      <path d="M10 1.5 L5 8.5 L9 8.5 L6 14.5 L13 6.5 L9 6.5 Z" opacity="0.85" />
    </svg>
  ),
  'rename': (
    <svg viewBox="0 0 16 16" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M11.5 2.5 L13.5 4.5 L5 13 L2 14 L3 11 Z" />
      <line x1="10" y1="4" x2="12" y2="6" />
    </svg>
  ),
  'neglect': (
    <svg viewBox="0 0 16 16" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" aria-hidden="true">
      <circle cx="8" cy="8" r="6.5" />
      <path d="M5.5 11 Q8 8.5 10.5 11" />
      <line x1="5" y1="5.5" x2="6.5" y2="6.5" />
      <line x1="11" y1="5.5" x2="9.5" y2="6.5" />
    </svg>
  ),
};

/* Icône cadenas pour les succès verrouillés */
const LockIcon = () => (
  <svg viewBox="0 0 16 16" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" className="pet-ach-lock">
    <rect x="3.5" y="7.5" width="9" height="7" rx="1.5" />
    <path d="M5.5 7.5 L5.5 5 Q5.5 2 8 2 Q10.5 2 10.5 5 L10.5 7.5" />
    <circle cx="8" cy="11" r="1" fill="currentColor" stroke="none" />
  </svg>
);

const AchievementsPanel = ({ unlocked = [] }) => {
  const total = ACHIEVEMENTS.length;
  const count = unlocked.length;

  return (
    <div className="pet-achievements">
      <div className="pet-achievements-header">
        <span aria-hidden="true">🏆</span>
        <span>Succès — {count}/{total}</span>
      </div>
      <div className="pet-achievements-grid">
        {ACHIEVEMENTS.map((ach) => {
          const isUnlocked = unlocked.includes(ach.id);
          return (
            <div
              key={ach.id}
              className={`pet-ach-tile${isUnlocked ? ' pet-ach-tile--unlocked' : ''}`}
              aria-label={isUnlocked ? ach.label : 'Verrouillé'}
            >
              <div className="pet-ach-icon">
                {isUnlocked ? (ACHIEVEMENT_ICONS[ach.id] || null) : <LockIcon />}
              </div>
              <span className="pet-ach-label">{isUnlocked ? ach.label : '???'}</span>
              {isUnlocked ? (
                <div className="pet-ach-tooltip" role="tooltip">
                  <strong className="pet-ach-tooltip-title">{ach.label}</strong>
                  <span className="pet-ach-tooltip-desc">{ach.desc}</span>
                </div>
              ) : ach.hint && (
                <div className="pet-ach-tooltip pet-ach-tooltip--hint" role="tooltip">
                  <span className="pet-ach-tooltip-hint-label">Indice</span>
                  <span className="pet-ach-tooltip-desc">{ach.hint}</span>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default AchievementsPanel;
