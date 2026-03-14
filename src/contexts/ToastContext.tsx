import {
  createContext,
  useContext,
  useState,
  useCallback,
  useRef,
  useEffect,
  type ReactNode,
} from 'react';
import { createPortal } from 'react-dom';
import { useTranslation } from 'react-i18next';
import type { ToastType } from '@/types';

/* ── Icônes SVG par type ──────────────────────────── */
const TOAST_ICONS: Record<ToastType, React.ReactNode> = {
  success: (
    <svg
      viewBox="0 0 24 24"
      width="20"
      height="20"
      fill="none"
      stroke="currentColor"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <circle cx="12" cy="12" r="10" fill="currentColor" fillOpacity="0.15" strokeWidth="1.5" />
      <path d="M7.5 12.5 L10.5 15.5 L16.5 8.5" strokeWidth="2.2" />
    </svg>
  ),
  error: (
    <svg
      viewBox="0 0 24 24"
      width="20"
      height="20"
      fill="none"
      stroke="currentColor"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <circle cx="12" cy="12" r="10" fill="currentColor" fillOpacity="0.15" strokeWidth="1.5" />
      <line x1="8.5" y1="8.5" x2="15.5" y2="15.5" strokeWidth="2.2" />
      <line x1="15.5" y1="8.5" x2="8.5" y2="15.5" strokeWidth="2.2" />
    </svg>
  ),
  info: (
    <svg
      viewBox="0 0 24 24"
      width="20"
      height="20"
      fill="none"
      stroke="currentColor"
      strokeLinecap="round"
      aria-hidden="true"
    >
      <circle cx="12" cy="12" r="10" fill="currentColor" fillOpacity="0.15" strokeWidth="1.5" />
      <circle cx="12" cy="7.5" r="1.3" fill="currentColor" stroke="none" />
      <line x1="12" y1="11.5" x2="12" y2="17" strokeWidth="2.2" />
    </svg>
  ),
  warning: (
    <svg
      viewBox="0 0 24 24"
      width="20"
      height="20"
      fill="none"
      stroke="currentColor"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path
        d="M12 3.5 L21.5 20.5 H2.5 Z"
        fill="currentColor"
        fillOpacity="0.15"
        strokeWidth="1.5"
      />
      <line x1="12" y1="10" x2="12" y2="15.5" strokeWidth="2.2" />
      <circle cx="12" cy="18.5" r="1.3" fill="currentColor" stroke="none" />
    </svg>
  ),
};

/* ── Types ──────────────────────────────────────────── */
interface Toast {
  id: number;
  message: string;
  type: ToastType;
  icon?: React.ReactNode;
  duration: number;
}

interface ShowToastOptions {
  type?: ToastType;
  duration?: number;
  icon?: React.ReactNode;
}

interface ToastContextValue {
  showToast: (message: string, options?: ShowToastOptions) => number;
  dismissToast: (id: number) => void;
}

/* ── Context ─────────────────────────────────────── */
const ToastContext = createContext<ToastContextValue>({
  showToast: () => 0,
  dismissToast: () => {},
});

export const useToast = () => useContext(ToastContext);

/* ── Toast item ──────────────────────────────────── */
interface ToastItemProps {
  toast: Toast;
  onDismiss: (id: number) => void;
}

const ToastItem = ({ toast, onDismiss }: ToastItemProps) => {
  const { t } = useTranslation();
  const [exiting, setExiting] = useState(false);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const dismiss = useCallback(() => {
    setExiting(true);
    setTimeout(() => onDismiss(toast.id), 280);
  }, [toast.id, onDismiss]);

  useEffect(() => {
    // If duration is a positive finite number, auto-dismiss after that delay.
    // A duration <= 0 (or non-finite) means a persistent toast that must be
    // dismissed by the user.
    if (Number.isFinite(toast.duration) && toast.duration > 0) {
      timerRef.current = setTimeout(dismiss, toast.duration);
      return () => {
        if (timerRef.current) clearTimeout(timerRef.current);
      };
    }
    return () => {};
  }, [toast.duration, dismiss]);

  // Pause timer on hover
  const handleMouseEnter = (): void => {
    if (timerRef.current) clearTimeout(timerRef.current);
  };
  const handleMouseLeave = (): void => {
    // Only restart a short auto-dismiss when the toast is non-persistent.
    if (Number.isFinite(toast.duration) && toast.duration > 0) {
      timerRef.current = setTimeout(dismiss, 1200);
    }
  };

  const icon = toast.icon || TOAST_ICONS[toast.type] || TOAST_ICONS.info;

  return (
    <div
      className={`toast toast--${toast.type}${exiting ? ' toast--exit' : ''}`}
      role="status"
      aria-live="polite"
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      <span className="toast-icon">{icon}</span>
      <span className="toast-message">{toast.message}</span>
      <button className="toast-close" onClick={dismiss} aria-label={t('common.toast.close')}>
        &times;
      </button>
    </div>
  );
};

/* ── Container (portal → body) ───────────────────── */
interface ToastContainerProps {
  toasts: Toast[];
  onDismiss: (id: number) => void;
}

const ToastContainer = ({ toasts, onDismiss }: ToastContainerProps) => {
  const { t } = useTranslation();
  if (toasts.length === 0) return null;

  return createPortal(
    <div className="toast-container" aria-label={t('common.toast.region')} role="region">
      {toasts.map((toast) => (
        <ToastItem key={toast.id} toast={toast} onDismiss={onDismiss} />
      ))}
    </div>,
    document.body
  );
};

/* ── Provider ────────────────────────────────────── */
interface ToastProviderProps {
  children: ReactNode;
}

export const ToastProvider = ({ children }: ToastProviderProps) => {
  const { t } = useTranslation();
  const [toasts, setToasts] = useState<Toast[]>([]);
  const idRef = useRef(0);

  const showToast = useCallback(
    (message: string, { type = 'info', duration = 3500, icon }: ShowToastOptions = {}) => {
      const id = ++idRef.current;
      setToasts((prev) => [...prev, { id, message, type, icon, duration }]);
      return id;
    },
    []
  );

  const dismissToast = useCallback((id: number) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  // Expose globally pour les modules JS legacy (music-player, lightbox, etc.)
  useEffect(() => {
    window.showToast = showToast;
    // Fonctions de test console — testToast.success() etc.
    window.testToast = {
      success: () => showToast(t('common.toast.debug.success'), { type: 'success' }),
      error: () => showToast(t('common.toast.debug.error'), { type: 'error' }),
      info: () => showToast(t('common.toast.debug.info'), { type: 'info' }),
      warning: () => showToast(t('common.toast.debug.warning'), { type: 'warning' }),
    };
    return () => {
      delete window.showToast;
      delete window.testToast;
    };
  }, [showToast, t]);

  return (
    <ToastContext.Provider value={{ showToast, dismissToast }}>
      {children}
      <ToastContainer toasts={toasts} onDismiss={dismissToast} />
    </ToastContext.Provider>
  );
};

export default ToastContext;
