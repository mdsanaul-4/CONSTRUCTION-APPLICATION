import { useEffect } from 'react';
import { X } from 'lucide-react';

export default function Modal({ open, onClose, title, children, footer, maxWidth = 'max-w-lg' }) {
  useEffect(() => {
    function onKey(e) {
      if (e.key === 'Escape') onClose?.();
    }
    if (open) document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-40 flex items-end sm:items-center justify-center p-0 sm:p-4">
      <div className="absolute inset-0 bg-ink-900/40" onClick={onClose} />
      <div className={`relative bg-white w-full ${maxWidth} rounded-t-lg sm:rounded-lg shadow-xl max-h-[92vh] flex flex-col`}>
        <div className="flex items-center justify-between px-5 py-4 border-b border-concrete-200 shrink-0">
          <h2 className="font-display font-semibold text-lg text-ink-900">{title}</h2>
          <button onClick={onClose} aria-label="Close" className="text-ink-400 hover:text-ink-900">
            <X size={20} />
          </button>
        </div>
        <div className="px-5 py-4 overflow-y-auto">{children}</div>
        {footer && <div className="px-5 py-4 border-t border-concrete-200 flex justify-end gap-2 shrink-0">{footer}</div>}
      </div>
    </div>
  );
}
