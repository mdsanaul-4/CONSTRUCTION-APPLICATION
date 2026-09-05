// All business dates are normalized to midnight UTC so that a "date" always
// represents a calendar day regardless of server/client timezone.

export function toBusinessDate(input) {
  const d = input ? new Date(input) : new Date();
  return new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate()));
}

export function monthRange(month, year) {
  const start = new Date(Date.UTC(year, month - 1, 1));
  const end = new Date(Date.UTC(year, month, 1)); // exclusive, first day of next month
  return { start, end };
}

export function daysInMonth(month, year) {
  return new Date(Date.UTC(year, month, 0)).getUTCDate();
}

export function todayRange() {
  const now = new Date();
  const start = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()));
  const end = new Date(start);
  end.setUTCDate(end.getUTCDate() + 1);
  return { start, end };
}
