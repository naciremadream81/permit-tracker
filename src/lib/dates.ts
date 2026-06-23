export function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

export function formatShortDate(iso: string): string {
  return new Date(iso).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
  });
}

function startOfDay(iso: string): Date | null {
  const target = new Date(iso);
  if (Number.isNaN(target.getTime())) return null;
  target.setHours(0, 0, 0, 0);
  return target;
}

/** Whole days from today to the given date. Negative = past. NaN if the date is invalid. */
export function daysUntil(iso: string): number {
  const target = startOfDay(iso);
  if (!target) return Number.NaN;
  const now = new Date();
  now.setHours(0, 0, 0, 0);
  return Math.round((target.getTime() - now.getTime()) / 86_400_000);
}

export function deadlinePhrase(iso: string): string {
  const days = daysUntil(iso);
  if (Number.isNaN(days)) return "invalid date";
  if (days < 0) return `${Math.abs(days)}d overdue`;
  if (days === 0) return "due today";
  if (days === 1) return "due tomorrow";
  return `${days}d left`;
}

/** Urgency bucket used to pick deadline styling. */
export function deadlineUrgency(iso: string): "overdue" | "soon" | "normal" {
  const days = daysUntil(iso);
  if (Number.isNaN(days)) return "normal";
  if (days < 0) return "overdue";
  if (days <= 3) return "soon";
  return "normal";
}
