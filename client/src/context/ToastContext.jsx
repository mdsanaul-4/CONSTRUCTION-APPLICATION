import { createContext, useCallback, useContext, useState } from 'react';
import { CheckCircle2, XCircle, Info, X } from 'lucide-react';

const ToastContext = createContext(null);

let idCounter = 0;

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);

  const remove = useCallback((id) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const push = useCallback(
    (message, type = 'info') => {
      const id = idCounter += 1;
      setToasts((prev) => [...prev, { id, message, type }]);
      setTimeout(() => remove(id), 4500);
    },
    [remove]
  );

  const toast = {
    success: (msg) => push(msg, 'success'),
    error: (msg) => push(msg, 'error'),
    info: (msg) => push(msg, 'info'),
  };

  return (
    <ToastContext.Provider value={toast}>
      {children}
      <div className="fixed bottom-4 right-4 z-50 flex flex-col gap-2 w-[calc(100%-2rem)] max-w-sm">
        {toasts.map((t) => (
          <div
            key={t.id}
            className={`card flex items-start gap-2 p-3 shadow-lg border-l-4 ${
              t.type === 'success'
                ? 'border-l-signal-green'
                : t.type === 'error'
                ? 'border-l-signal-rust'
                : 'border-l-steel-700'
            }`}
          >
            {t.type === 'success' && <CheckCircle2 size={18} className="text-signal-green mt-0.5 shrink-0" />}
            {t.type === 'error' && <XCircle size={18} className="text-signal-rust mt-0.5 shrink-0" />}
            {t.type === 'info' && <Info size={18} className="text-steel-700 mt-0.5 shrink-0" />}
            <p className="text-sm text-ink-900 flex-1">{t.message}</p>
            <button onClick={() => remove(t.id)} aria-label="Dismiss" className="text-ink-400 hover:text-ink-900">
              <X size={16} />
            </button>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast() {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error('useToast must be used within ToastProvider');
  return ctx;
}
