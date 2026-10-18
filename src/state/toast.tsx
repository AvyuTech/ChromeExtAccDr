import { createContext, useCallback, useContext, useMemo, useRef, useState, type ReactNode } from 'react';
import { CheckGlyph } from '../icons';

interface Toast {
  id: number;
  message: string;
  action?: { label: string; onClick: () => void };
}

const ToastContext = createContext<((message: string, action?: Toast['action']) => void) | null>(null);

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);
  const nextId = useRef(1);

  const show = useCallback((message: string, action?: Toast['action']) => {
    const id = nextId.current++;
    setToasts((t) => [...t.slice(-1), { id, message, action }]);
    window.setTimeout(() => setToasts((t) => t.filter((x) => x.id !== id)), 3200);
  }, []);

  const value = useMemo(() => show, [show]);

  return (
    <ToastContext.Provider value={value}>
      {children}
      <div className="toast-host" role="status" aria-live="polite">
        {toasts.map((t) => (
          <div key={t.id} className="toast">
            <CheckGlyph size={18} />
            <span className="grow">{t.message}</span>
            {t.action ? (
              <button
                type="button"
                className="btn btn--sm btn--ghost"
                style={{ color: 'var(--mint)', height: 30, padding: '0 6px' }}
                onClick={() => {
                  t.action?.onClick();
                  setToasts((all) => all.filter((x) => x.id !== t.id));
                }}
              >
                {t.action.label}
              </button>
            ) : null}
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast() {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error('useToast must be used inside ToastProvider');
  return ctx;
}
