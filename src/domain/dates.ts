import type { DatePlan } from './types';

/** The date's start as a local timestamp. */
export function dateStart(plan: Pick<DatePlan, 'date' | 'time'>): number {
  const [y, m, d] = plan.date.split('-').map(Number);
  const [hh, mm] = plan.time.split(':').map(Number);
  return new Date(y!, (m ?? 1) - 1, d ?? 1, hh ?? 0, mm ?? 0).getTime();
}

/** A date counts as "happened" three hours after it started. */
export function datePassed(plan: Pick<DatePlan, 'date' | 'time'>, now = Date.now()): boolean {
  return now > dateStart(plan) + 3 * 3_600_000;
}

/** "Friday 10 October", "19:00". */
export function formatDatePlan(plan: Pick<DatePlan, 'date' | 'time'>): { day: string; dayShort: string; time: string } {
  const at = new Date(dateStart(plan));
  return {
    day: at.toLocaleDateString(undefined, { weekday: 'long', day: 'numeric', month: 'long' }),
    dayShort: at.toLocaleDateString(undefined, { weekday: 'long' }),
    time: plan.time,
  };
}

/** Plain-text summary used by Share Date. */
export function shareDateText(plan: DatePlan, name: string, appName: string): string {
  const { day, time } = formatDatePlan(plan);
  return [
    `I'm meeting ${name} (we matched on ${appName}).`,
    `When: ${day} at ${time}`,
    `Where: ${plan.venue ?? 'Place not decided yet'}`,
    'I’ll check in with you afterwards.',
  ].join('\n');
}
