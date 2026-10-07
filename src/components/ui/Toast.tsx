import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import './Toast.css';

interface ToastOptions {
  message: string;
  action?: { label: string; onSelect: () => void };
  /** Milliseconds. Toasts with an action stay a little longer. */
  duration?: number;
}

interface ToastState extends ToastOptions {
  id: number;
}

const ToastContext = createContext<((t: ToastOptions) => void) | null>(null);

/** Small, calm confirmations ("Like sent", "Passed · Undo"). Announced politely to screen readers. */
export function ToastProvider({ children }: { children: ReactNode }) {
  const [toast, setToast] = useState<ToastState | null>(null);
  const timer = useRef<number | undefined>(undefined);

  const show = useCallback((t: ToastOptions) => {
    window.clearTimeout(timer.current);
    const id = Date.now();
    setToast({ ...t, id });
    timer.current = window.setTimeout(() => setToast((cur) => (cur?.id === id ? null : cur)), t.duration ?? (t.action ? 6000 : 3000));
  }, []);

  useEffect(() => () => window.clearTimeout(timer.current), []);

  return (
    <ToastContext.Provider value={show}>
      {children}
      <div className="toast-region" role="status" aria-live="polite">
        {toast && (
          <div key={toast.id} className="toast">
            <span className="toast__message">{toast.message}</span>
            {toast.action && (
              <button
                type="button"
                className="toast__action"
                onClick={() => {
                  toast.action!.onSelect();
                  setToast(null);
                }}
              >
                {toast.action.label}
              </button>
            )}
          </div>
        )}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast() {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error('useToast must be used inside <ToastProvider>.');
  return useMemo(() => ctx, [ctx]);
}
