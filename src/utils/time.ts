const MINUTE = 60_000;
const HOUR = 60 * MINUTE;
const DAY = 24 * HOUR;

export function minutesAgo(n: number, now = Date.now()): string {
  return new Date(now - n * MINUTE).toISOString();
}

export function hoursAgo(n: number, now = Date.now()): string {
  return new Date(now - n * HOUR).toISOString();
}

export function daysAgo(n: number, now = Date.now()): string {
  return new Date(now - n * DAY).toISOString();
}

/** Whole years between a birth date and now. */
export function ageFromBirthDate(birthDate: string, now = new Date()): number {
  const b = new Date(birthDate);
  let age = now.getFullYear() - b.getFullYear();
  const m = now.getMonth() - b.getMonth();
  if (m < 0 || (m === 0 && now.getDate() < b.getDate())) age -= 1;
  return age;
}

/** Short, human relative timestamp for lists: "now", "12m", "3h", "Mon", "4 Oct". */
export function formatRelativeShort(iso: string, now = Date.now()): string {
  const t = new Date(iso).getTime();
  const diff = Math.max(0, now - t);
  if (diff < MINUTE) return 'now';
  if (diff < HOUR) return `${Math.floor(diff / MINUTE)}m`;
  if (diff < DAY) return `${Math.floor(diff / HOUR)}h`;
  const d = new Date(t);
  if (diff < 6 * DAY) return d.toLocaleDateString(undefined, { weekday: 'short' });
  return d.toLocaleDateString(undefined, { day: 'numeric', month: 'short' });
}
