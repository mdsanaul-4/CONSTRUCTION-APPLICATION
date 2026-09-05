export default function StatCard({ label, value, sublabel, accent = 'steel' }) {
  const accentColor =
    {
      steel: 'var(--color-steel-700)',
      safety: 'var(--color-safety-500)',
      green: 'var(--color-signal-green)',
      rust: 'var(--color-signal-rust)',
      amber: 'var(--color-signal-amber)',
    }[accent] || 'var(--color-steel-700)';

  return (
    <div className="card p-4 flex gap-3">
      <div className="w-1 rounded-full shrink-0" style={{ backgroundColor: accentColor }} />
      <div className="min-w-0">
        <p className="text-xs font-semibold text-ink-600 truncate">{label}</p>
        <p className="font-display text-2xl font-bold text-ink-900 mt-1 truncate">{value}</p>
        {sublabel && <p className="text-xs text-ink-400 mt-0.5">{sublabel}</p>}
      </div>
    </div>
  );
}
