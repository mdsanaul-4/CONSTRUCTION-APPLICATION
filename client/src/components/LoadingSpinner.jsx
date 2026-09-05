import { Loader2 } from 'lucide-react';

export default function LoadingSpinner({ label = 'Loading…', full = false }) {
  return (
    <div className={`flex items-center justify-center gap-2 text-ink-400 ${full ? 'h-64' : 'py-8'}`}>
      <Loader2 size={18} className="animate-spin" />
      <span className="text-sm">{label}</span>
    </div>
  );
}
