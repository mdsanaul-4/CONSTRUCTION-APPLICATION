import { Inbox } from 'lucide-react';

export default function EmptyState({ title = 'Nothing here yet', message, action }) {
  return (
    <div className="flex flex-col items-center justify-center text-center py-14 px-4">
      <div className="w-11 h-11 rounded-full bg-concrete-100 flex items-center justify-center mb-3">
        <Inbox size={20} className="text-ink-400" />
      </div>
      <h3 className="font-display font-semibold text-ink-900">{title}</h3>
      {message && <p className="text-sm text-ink-600 mt-1 max-w-xs">{message}</p>}
      {action && <div className="mt-4">{action}</div>}
    </div>
  );
}
