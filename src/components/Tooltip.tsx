import {
  useState,
  useRef,
  useEffect,
  useCallback,
  useId,
  type FocusEvent,
  type KeyboardEvent,
  type MouseEvent,
  type ReactNode,
} from 'react';

/**
 * Tooltip universel — remplace les `title` natifs par un tooltip stylisé.
 *
 * @param {string}  text        - Texte principal du tooltip
 * @param {string} [desc]       - Description secondaire (optionnelle, plus discrète)
 * @param {'top'|'bottom'} [position='top'] - Position préférée (bascule auto si déborde)
 * @param {number} [delay=320]  - Délai avant affichage (ms)
 * @param {boolean} [focusable=false] - Rend le déclencheur focusable au clavier
 *   (pour les enfants non interactifs comme une image, sinon tooltip souris seule)
 * @param {React.ReactNode} children - Élément enfant déclencheur
 */
interface TooltipProps {
  text: string;
  desc?: string;
  position?: 'top' | 'bottom';
  delay?: number;
  focusable?: boolean;
  children: ReactNode;
}

const Tooltip = ({
  text,
  desc,
  position = 'top',
  delay = 320,
  focusable = false,
  children,
}: TooltipProps) => {
  const [visible, setVisible] = useState(false);
  const [flipped, setFlipped] = useState(false);
  const wrapRef = useRef<HTMLSpanElement | null>(null);
  const tipRef = useRef<HTMLSpanElement | null>(null);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const tooltipId = useId();

  /* Vérifie si le tooltip déborde du viewport et bascule si nécessaire */
  const checkFlip = useCallback(() => {
    if (!tipRef.current || !wrapRef.current) return;
    const tipRect = tipRef.current.getBoundingClientRect();
    const wrapRect = wrapRef.current.getBoundingClientRect();

    if (position === 'top') {
      // Déborde en haut → bascule en bas
      if (wrapRect.top - tipRect.height - 8 < 0) setFlipped(true);
      else setFlipped(false);
    } else {
      // Déborde en bas → bascule en haut
      if (wrapRect.bottom + tipRect.height + 8 > window.innerHeight) setFlipped(true);
      else setFlipped(false);
    }
  }, [position]);

  const show = useCallback(
    (e: FocusEvent<HTMLElement> | MouseEvent<HTMLElement>) => {
      // Sur focus programmatique (ex: ouverture d'un dialog), :focus-visible n'est pas actif.
      // On ignore ces cas pour éviter les tooltips fantômes non désirés.
      if (e.type === 'focus' && !e.currentTarget.matches(':focus-visible')) return;
      timer.current = setTimeout(() => {
        setVisible(true);
        // Vérifier le flip au prochain frame (après le rendu)
        requestAnimationFrame(checkFlip);
      }, delay);
    },
    [delay, checkFlip]
  );

  const hide = useCallback(() => {
    if (timer.current) clearTimeout(timer.current);
    setVisible(false);
    setFlipped(false);
  }, []);

  useEffect(
    () => () => {
      if (timer.current) clearTimeout(timer.current);
    },
    []
  );

  const actualPos = flipped ? (position === 'top' ? 'bottom' : 'top') : position;

  const handleKeyDown = useCallback(
    (e: KeyboardEvent<HTMLElement>) => {
      // Pattern ARIA tooltip : Escape ferme sans quitter le déclencheur
      if (e.key === 'Escape' && visible) {
        e.stopPropagation();
        hide();
      }
    },
    [visible, hide]
  );

  return (
    <span
      className="tooltip-wrap"
      ref={wrapRef}
      tabIndex={focusable ? 0 : undefined}
      onMouseEnter={show}
      onMouseLeave={hide}
      onFocus={show}
      onBlur={hide}
      onKeyDown={handleKeyDown}
      aria-describedby={visible && text ? tooltipId : undefined}
    >
      {children}
      {visible && text && (
        <span
          className={`tooltip tooltip--${actualPos}`}
          ref={tipRef}
          role="tooltip"
          id={tooltipId}
        >
          <strong className="tooltip-text">{text}</strong>
          {desc && <span className="tooltip-desc">{desc}</span>}
        </span>
      )}
    </span>
  );
};

export default Tooltip;
