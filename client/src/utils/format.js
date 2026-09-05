export function formatCurrency(amount, currency = 'INR') {
  const value = Number(amount) || 0;
  try {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency,
      maximumFractionDigits: 0,
    }).format(value);
  } catch {
    return `₹${value.toLocaleString('en-IN')}`;
  }
}

export function formatDate(date) {
  if (!date) return '—';
  const d = new Date(date);
  return d.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
}

export function toDateInputValue(date) {
  const d = date ? new Date(date) : new Date();
  return d.toISOString().slice(0, 10);
}

export const STATUS_LABELS = {
  present: 'Present',
  absent: 'Absent',
  half_day: 'Half Day',
  off: 'Off',
  holiday: 'Holiday',
};

export const STATUS_COLORS = {
  present: 'bg-signal-green-100 text-signal-green',
  absent: 'bg-signal-rust-100 text-signal-rust',
  half_day: 'bg-signal-amber-100 text-signal-amber',
  off: 'bg-steel-100 text-steel-700',
  holiday: 'bg-safety-100 text-safety-600',
};

export const PAYROLL_STATUS_COLORS = {
  draft: 'bg-steel-100 text-steel-700',
  finalized: 'bg-signal-amber-100 text-signal-amber',
  partially_paid: 'bg-safety-100 text-safety-600',
  paid: 'bg-signal-green-100 text-signal-green',
};

export const MONTH_NAMES = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
];
