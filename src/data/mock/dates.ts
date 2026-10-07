import type { DatePlan, ID, Match } from '../../domain/types';
import { hoursAgo } from '../../utils/time';

/** Next occurrence of a weekday (0 = Sunday) at least 2 days out, as YYYY-MM-DD. */
export function nextWeekday(weekday: number, from = new Date()): string {
  const d = new Date(from);
  d.setDate(d.getDate() + 2);
  while (d.getDay() !== weekday) d.setDate(d.getDate() + 1);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

/**
 * One pending date suggestion from the "waiting" match (Maja in the demo), so date
 * planning can be tried straight away: Accept or Suggest change.
 */
export function createMockDates(matches: Match[], userId: ID, now = Date.now()): DatePlan[] {
  const waiting = matches.find((m) => m.id === 'm-maja') ?? matches.find((m) => !m.archivedAt && m.id.startsWith('m-') && m.id !== 'm-isabel');
  if (!waiting) return [];
  const other = waiting.userIds.find((id) => id !== userId);
  if (!other) return [];
  return [
    {
      id: 'date-demo-1',
      matchId: waiting.id,
      proposedBy: other,
      date: nextWeekday(5),
      time: '19:00',
      venue: 'Coffee at Kajplats 9',
      note: 'Then maybe a horror film if it goes well?',
      status: 'proposed',
      createdAt: hoursAgo(4, now),
    },
  ];
}
