import type { DateFeedback, DatePlan, Message } from '../../domain/types';
import { createId } from '../../utils/id';
import type { DatesRepository } from '../types';
import { currentUser, ensure } from './helpers';
import { localDb, withLatency } from './localDb';

export function createLocalDatesRepository(): DatesRepository {
  const myMatchIds = () => new Set(localDb.matches().filter((m) => m.userIds.includes(currentUser().id)).map((m) => m.id));

  const update = (dateId: string, fn: (d: DatePlan) => DatePlan): DatePlan => {
    let updated: DatePlan | undefined;
    const next = localDb.dates().map((d) => (d.id === dateId ? (updated = fn(d)) : d));
    if (!updated) throw new Error('That date plan no longer exists.');
    ensure(localDb.writeDates(next));
    return updated;
  };

  const touchMatch = (matchId: string, at: string) =>
    ensure(localDb.writeMatches(localDb.matches().map((m) => (m.id === matchId ? { ...m, lastActivityAt: at, archivedAt: null } : m))));

  return {
    list: () => withLatency(() => localDb.dates().filter((d) => myMatchIds().has(d.matchId))),
    listFeedback: () => withLatency(() => localDb.dateFeedback()),
    propose: (matchId, input, replaces) =>
      withLatency(() => {
        const me = currentUser().id;
        const now = new Date().toISOString();
        const plan: DatePlan = {
          id: createId('date'),
          matchId,
          proposedBy: me,
          date: input.date,
          time: input.time,
          ...(input.venue?.trim() ? { venue: input.venue.trim() } : {}),
          ...(input.note?.trim() ? { note: input.note.trim() } : {}),
          status: 'proposed',
          ...(replaces ? { replaces } : {}),
          createdAt: now,
        };
        const others = localDb.dates().map((d) => (d.id === replaces ? { ...d, status: 'changed' as const, respondedAt: now } : d));
        ensure(localDb.writeDates([...others, plan]));
        const card: Message = { id: createId('msg'), matchId, senderId: me, kind: 'date', body: '', dateId: plan.id, sentAt: now };
        ensure(localDb.writeMessages([...localDb.messages(), card]));
        touchMatch(matchId, now);
        return plan;
      }),
    accept: (dateId) => withLatency(() => update(dateId, (d) => ({ ...d, status: 'accepted', respondedAt: new Date().toISOString() }))),
    cancel: (dateId) => withLatency(() => update(dateId, (d) => ({ ...d, status: 'cancelled', respondedAt: new Date().toISOString() }))),
    giveFeedback: (input) =>
      withLatency(() => {
        const plan = localDb.dates().find((d) => d.id === input.dateId);
        if (!plan) throw new Error('That date no longer exists.');
        const me = currentUser().id;
        const match = localDb.matches().find((m) => m.id === plan.matchId);
        const feedback: DateFeedback = {
          ...input,
          id: createId('feedback'),
          matchId: plan.matchId,
          aboutUserId: match?.userIds.find((id) => id !== me) ?? '',
          createdAt: new Date().toISOString(),
        };
        ensure(localDb.writeDateFeedback([...localDb.dateFeedback().filter((f) => f.dateId !== input.dateId), feedback]));
        return feedback;
      }),
  };
}
