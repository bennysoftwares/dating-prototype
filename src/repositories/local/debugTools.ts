import { createMatchFromLikes, snapshotFor } from '../../domain/matching';
import type { Like, LikeTarget, Match, Profile } from '../../domain/types';
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
    const { me, prefs, matchedWith, likedMe, passed } = context();
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

  resetConversations(): string {
    localDb.resetConnections();
    return 'Likes received, matches, messages and drafts reset to demo data.';
  },
};
