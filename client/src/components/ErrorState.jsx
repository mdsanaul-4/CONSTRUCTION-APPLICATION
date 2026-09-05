import { AlertTriangle } from 'lucide-react';

export default function ErrorState({ message = 'Something went wrong.', onRetry }) {
  return (
    <div className="flex flex-col items-center justify-center text-center py-14 px-4">
      <div className="w-11 h-11 rounded-full bg-signal-rust-100 flex items-center justify-center mb-3">
        <AlertTriangle size={20} className="text-signal-rust" />
      </div>
      <p className="text-sm text-ink-900 max-w-xs">{message}</p>
      {onRetry && (
        <button onClick={onRetry} className="btn btn-secondary mt-4">
          Try again
        </button>
      )}
    </div>
  );
}
