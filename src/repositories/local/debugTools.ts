import { createMatchFromLikes, snapshotFor } from '../../domain/matching';
import type { DatePlan, Like, LikeTarget, Match, Profile } from '../../domain/types';
import { createId } from '../../utils/id';
import { localDb } from './localDb';

/**
 * Developer-only helpers that simulate "the other person" so Part 4 flows can be
 * tested without a backend. Each returns a short human message for the debug panel.
 */
const DAY = 86_400_000;
const COMMENTS = [
  'Okay, this made me smile.',
  'I have so many questions about this.',
  'Bold claim. I respect it.',
  'Same, honestly!',
];
const REPLIES = [
  'Haha, okay that’s fair 😄',
  'Sorry, busy day! How was yours?',
  'Wait, tell me more about that.',
  'I’d be up for that. When suits you?',
];
const pick = <T,>(list: readonly T[]) => list[Math.floor(Math.random() * list.length)]!;

function context() {
  const user = localDb.user();
  const me = user && localDb.profiles().find((p) => p.id === user.profileId);
  const prefs = localDb.preferences();
  if (!user || !me || !prefs || !user.onboardingComplete) throw new Error('Finish onboarding or load the demo user first.');
  const matchedWith = new Set(localDb.matches().flatMap((m) => m.userIds));
  const likedMe = new Set(localDb.likes().filter((l) => l.toUserId === user.id).map((l) => l.fromUserId));
  const passed = new Set(localDb.passes().filter((p) => p.fromUserId === user.id).map((p) => p.toProfileId));
  return { user, me, prefs, matchedWith, likedMe, passed };
}

function randomTarget(me: Profile): LikeTarget {
  const r = Math.random();
  if (r < 0.4 && me.prompts.length) return { kind: 'prompt', promptId: pick(me.prompts).id };
  if (r < 0.8 && me.photos.length) return { kind: 'photo', photoId: pick(me.photos).id };
  return { kind: 'profile' };
}

function likeFrom(them: Profile, me: Profile, target: LikeTarget, comment?: string): Like {
  return {
    id: createId('like'),
    fromUserId: them.userId,
    fromProfileId: them.id,
    toUserId: me.userId,
    toProfileId: me.id,
    target,
    snapshot: snapshotFor(me, target),
    ...(comment ? { comment } : {}),
    createdAt: new Date().toISOString(),
  };
}

function saveMatch(a: Like, b: Like, meId: string): Match {
  const { match, messages } = createMatchFromLikes(a, b);
  const normalised: Match = { ...match, userIds: match.userIds[0] === meId ? match.userIds : [match.userIds[1], match.userIds[0]] };
  localDb.writeMatches([...localDb.matches(), normalised]);
  localDb.writeMessages([...localDb.messages(), ...messages]);
  return normalised;
}

const latestConversation = (userId: string) =>
  localDb
    .matches()
    .filter((m) => m.userIds.includes(userId) && !m.archivedAt)
    .sort((a, b) => b.lastActivityAt.localeCompare(a.lastActivityAt))[0];

const nameOf = (userId: string) => localDb.profiles().find((p) => p.userId === userId)?.firstName ?? 'Someone';

export const debugTools = {
  createIncomingLike(withComment: boolean): string {
    const { user, me, prefs, matchedWith, likedMe, passed } = context();
    if (user.status === 'paused') return 'Your profile is paused, so nobody new can see it or like it.';
    if (user.incognito) {
      // Incognito: only people you've liked can see you, so their like is always mutual.
      const sent = localDb.likes().filter((l) => l.fromUserId === user.id && !matchedWith.has(l.toUserId));
      const mine = sent[sent.length - 1];
      const them = mine && localDb.profiles().find((p) => p.userId === mine.toUserId);
      if (!mine || !them) return 'Incognito is on: only people you like can see you. Like someone in Discover first.';
      saveMatch(mine, likeFrom(them, me, randomTarget(me), withComment ? pick(COMMENTS) : undefined), user.id);
      return `Incognito: ${them.firstName} could see you because you liked them. It's mutual.`;
    }
    const pool = localDb
      .profiles()
      .filter((p) => p.userId !== me.userId && prefs.interestedIn.includes(p.gender) && !matchedWith.has(p.userId) && !likedMe.has(p.userId) && !passed.has(p.id));
    if (!pool.length) return 'Everyone available has already liked you or matched.';
    const them = pick(pool);
    localDb.writeLikes([...localDb.likes(), likeFrom(them, me, randomTarget(me), withComment ? pick(COMMENTS) : undefined)]);
    return `${them.firstName} liked you${withComment ? ' with a comment' : ''}.`;
  },

  /** Make your most recent unanswered like mutual, or create a fresh match if there is none. */
  forceMutualMatch(): string {
    const { user, me, prefs, matchedWith, passed } = context();
    const sent = localDb
      .likes()
      .filter((l) => l.fromUserId === user.id && !matchedWith.has(l.toUserId))
      .sort((a, b) => b.createdAt.localeCompare(a.createdAt))[0];
    if (sent) {
      const them = localDb.profiles().find((p) => p.userId === sent.toUserId);
      if (!them) return 'Could not find that person.';
      saveMatch(sent, likeFrom(them, me, randomTarget(me), pick(COMMENTS)), user.id);
      return `It's mutual with ${them.firstName}. Your like was returned.`;
    }
    const pool = localDb.profiles().filter((p) => p.userId !== user.id && prefs.interestedIn.includes(p.gender) && !matchedWith.has(p.userId) && !passed.has(p.id));
    if (!pool.length) return 'No one left to match with.';
    const them = pick(pool);
    const mine: Like = { id: createId('like'), fromUserId: user.id, fromProfileId: me.id, toUserId: them.userId, toProfileId: them.id, target: { kind: 'profile' }, snapshot: { kind: 'profile' }, createdAt: new Date().toISOString() };
    localDb.writeLikes([...localDb.likes(), mine]);
    saveMatch(mine, likeFrom(them, me, randomTarget(me)), user.id);
    return `New match with ${them.firstName}.`;
  },

  /** The other person replies in your most recent conversation (creates unread state). */
  simulateReply(): string {
    const { user } = context();
    const match = latestConversation(user.id);
    if (!match) return 'No conversations yet.';
    const other = match.userIds.find((id) => id !== user.id)!;
    const now = new Date().toISOString();
    localDb.writeMessages([...localDb.messages(), { id: createId('msg'), matchId: match.id, senderId: other, kind: 'text', body: pick(REPLIES), sentAt: now }]);
    localDb.writeMatches(localDb.matches().map((m) => (m.id === match.id ? { ...m, lastActivityAt: now } : m)));
    return `${nameOf(other)} replied.`;
  },

  /** Push the most recent conversation back in time to test "Still interested?" (6 days) or Inactive (20 days). */
  makeQuiet(days: number): string {
    const { user } = context();
    const match = latestConversation(user.id);
    if (!match) return 'No conversations yet.';
    const shift = days * DAY;
    const ids = new Set([match.id]);
    const at = (iso: string) => new Date(new Date(iso).getTime() - shift).toISOString();
    localDb.writeMessages(localDb.messages().map((msg) => (ids.has(msg.matchId) ? { ...msg, sentAt: at(msg.sentAt) } : msg)));
    localDb.writeMatches(
      localDb.matches().map((m) =>
        m.id === match.id
          ? {
              ...m,
              createdAt: at(m.createdAt),
              lastActivityAt: at(m.lastActivityAt),
              keptForLaterAt: null,
              lastReadAt: Object.fromEntries(Object.entries(m.lastReadAt ?? {}).map(([k, v]) => [k, v ? at(v) : v])),
            }
          : m,
      ),
    );
    return `Your chat with ${nameOf(match.userIds.find((id) => id !== user.id)!)} is now ${days} days quiet.`;
  },

  /* ---------- Part 5: account states ---------- */

  toggleAccount(kind: 'paused' | 'incognito'): string {
    const { user } = context();
    if (kind === 'paused') {
      const paused = user.status !== 'paused';
      localDb.writeUser({ ...user, status: paused ? 'paused' : 'active' });
      return paused ? 'Profile paused.' : 'Profile active.';
    }
    localDb.writeUser({ ...user, incognito: !user.incognito });
    return !user.incognito ? 'Incognito on.' : 'Incognito off.';
  },

  toggleVerification(kind: 'photo' | 'id'): string {
    const { me } = context();
    const current = me.verification?.[kind] === 'verified';
    const verification = { photo: me.verification?.photo ?? 'unverified', id: me.verification?.id ?? 'unverified', [kind]: current ? 'unverified' : 'verified' } as const;
    localDb.writeOwnProfile({ ...me, verification });
    return `${kind === 'photo' ? 'Photo' : 'ID'} ${current ? 'not verified' : 'verified'}.`;
  },

  /* ---------- Part 5: dates ---------- */

  /** The other person in your latest chat suggests a date. */
  theyProposeDate(): string {
    const { user } = context();
    const match = latestConversation(user.id);
    if (!match) return 'No conversations yet.';
    const other = match.userIds.find((id) => id !== user.id)!;
    const now = new Date();
    const day = new Date(now.getTime() + 3 * DAY);
    const iso = `${day.getFullYear()}-${String(day.getMonth() + 1).padStart(2, '0')}-${String(day.getDate()).padStart(2, '0')}`;
    const plan: DatePlan = { id: createId('date'), matchId: match.id, proposedBy: other, date: iso, time: '18:30', venue: 'Drinks at Haga Nygata', status: 'proposed', createdAt: now.toISOString() };
    localDb.writeDates([...localDb.dates(), plan]);
    localDb.writeMessages([...localDb.messages(), { id: createId('msg'), matchId: match.id, senderId: other, kind: 'date', body: '', dateId: plan.id, sentAt: plan.createdAt }]);
    localDb.writeMatches(localDb.matches().map((m) => (m.id === match.id ? { ...m, lastActivityAt: plan.createdAt } : m)));
    return `${nameOf(other)} suggested a date.`;
  },

  /** The other person accepts your most recent suggestion. */
  theyAcceptDate(): string {
    const { user } = context();
    const plan = [...localDb.dates()].reverse().find((d) => d.status === 'proposed' && d.proposedBy === user.id);
    if (!plan) return 'You have no pending date suggestions.';
    localDb.writeDates(localDb.dates().map((d) => (d.id === plan.id ? { ...d, status: 'accepted', respondedAt: new Date().toISOString() } : d)));
    const match = localDb.matches().find((m) => m.id === plan.matchId);
    return `${nameOf(match?.userIds.find((id) => id !== user.id) ?? '')} accepted your date.`;
  },

  /** Move the latest accepted (or any) date into the past so "How did it go?" appears. */
  completeDate(): string {
    const { user } = context();
    const mine = new Set(localDb.matches().filter((m) => m.userIds.includes(user.id)).map((m) => m.id));
    const plans = localDb.dates().filter((d) => mine.has(d.matchId) && d.status !== 'changed' && d.status !== 'cancelled');
    const plan = plans.find((d) => d.status === 'accepted') ?? plans[plans.length - 1];
    if (!plan) return 'No dates planned yet.';
    const past = new Date(Date.now() - DAY);
    const iso = `${past.getFullYear()}-${String(past.getMonth() + 1).padStart(2, '0')}-${String(past.getDate()).padStart(2, '0')}`;
    localDb.writeDates(localDb.dates().map((d) => (d.id === plan.id ? { ...d, date: iso, status: 'accepted' } : d)));
    localDb.writeDateFeedback(localDb.dateFeedback().filter((f) => f.dateId !== plan.id));
    const match = localDb.matches().find((m) => m.id === plan.matchId);
    return `Your date with ${nameOf(match?.userIds.find((id) => id !== user.id) ?? '')} happened yesterday.`;
  },

  /* ---------- Part 5: safety ---------- */

  unblockAll(): string {
    const { user } = context();
    const count = localDb.blocks().filter((b) => b.blockerId === user.id).length;
    localDb.writeBlocks(localDb.blocks().filter((b) => b.blockerId !== user.id));
    return `Unblocked ${count} ${count === 1 ? 'person' : 'people'}.`;
  },

  clearReports(): string {
    localDb.writeReports([]);
    return 'Reports cleared.';
  },

  resetConversations(): string {
    localDb.resetConnections();
    return 'Likes received, matches, messages and drafts reset to demo data.';
  },
};
