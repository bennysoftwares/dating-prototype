import { snapshotFor } from '../../domain/matching';
import type { ID, Like, LikeTarget, Match, MatchContext, Message, Preferences, Profile } from '../../domain/types';
import { createId } from '../../utils/id';
import { daysAgo, hoursAgo, minutesAgo } from '../../utils/time';
import { TONES } from './tones';

/**
 * Mock likes, matches and messages seeded *relative to the current user's own profile*,
 * so likes point at their real photos and prompts. Used after onboarding and for the demo user.
 *
 * Match roles cover every Part 4 state:
 * - new: matched yesterday, their like came with a comment → first message already there
 * - unread: they replied and you haven't read it yet
 * - waiting: you sent the last message
 * - nudge: quiet for 6 days → "Still interested?"
 * - inactive: quiet for 18 days → Inactive section (never unmatched)
 */
type MatchRole = 'new' | 'unread' | 'waiting' | 'nudge' | 'inactive';
type LikerRole = 'promptComment' | 'photo' | 'promptComment2' | 'profile';

const MATCH_ROLES: MatchRole[] = ['new', 'unread', 'waiting', 'nudge', 'inactive'];
const LIKER_ROLES: LikerRole[] = ['promptComment', 'photo', 'promptComment2', 'profile'];

/** Hand-picked casting for the demo (women); everyone else falls back to generic scripts. */
const PREFERRED_MATCHES = ['p-isabel', 'p-emma', 'p-maja', 'p-lina', 'p-freja', 'p-daniel', 'p-ali', 'p-oskar'];
const PREFERRED_LIKERS = ['p-sofia', 'p-elin', 'p-klara', 'p-moa', 'p-leo', 'p-robin'];

interface Ctx {
  me: Profile;
  them: Profile;
  now: number;
}

type Line = [from: 'me' | 'them', body: string, at: string];

function scriptFor(role: MatchRole, { them, now }: Ctx): Line[] {
  const n = them.firstName;
  const p = them.prompts[0];
  switch (role) {
    case 'new':
      return [];
    case 'unread':
      if (them.id === 'p-emma') {
        return [
          ['me', 'Okay, I have to know. Best Ghibli film?', hoursAgo(3, now)],
          ['them', 'Spirited Away, obviously. But I respect a Princess Mononoke answer.', hoursAgo(2, now)],
          ['them', 'Wait, do you actually like horror or was that just for the profile?', minutesAgo(18, now)],
        ];
      }
      return [
        ['me', `Okay, I have to ask about your answer to “${p?.prompt ?? 'your profile'}”`, hoursAgo(3, now)],
        ['them', 'Ha, I was hoping someone would ask.', hoursAgo(2, now)],
        ['them', 'What made you pick that one to ask about?', minutesAgo(18, now)],
      ];
    case 'waiting':
      if (them.id === 'p-maja') {
        return [
          ['them', 'A horror double feature on a Sunday is elite behaviour.', hoursAgo(6, now)],
          ['me', 'Finally, someone gets it. What would your pick be?', hoursAgo(5, now)],
        ];
      }
      return [
        ['them', `Hi! Your profile made me smile. How's your week going?`, hoursAgo(6, now)],
        ['me', `Better now. Mostly work and too much coffee. You, ${n}?`, hoursAgo(5, now)],
      ];
    case 'nudge':
      if (them.id === 'p-lina') {
        return [
          ['me', 'A history teacher who finds the Vasa relatable is my kind of person.', daysAgo(7, now)],
          ['them', 'It sank in twenty minutes. I feel that on Mondays.', daysAgo(6, now)],
        ];
      }
      return [
        ['me', `Hey ${n}! How's your weekend been?`, daysAgo(7, now)],
        ['them', 'Pretty good! Busy, but good.', daysAgo(6, now)],
      ];
    case 'inactive':
      return [
        ['them', `Hi! I liked your answer about Sundays.`, daysAgo(19, now)],
        ['me', 'Thank you! What does your ideal Sunday look like?', daysAgo(18, now)],
      ];
  }
}

const lastActivity: Record<MatchRole, (now: number) => string> = {
  new: (now) => hoursAgo(20, now),
  unread: (now) => minutesAgo(18, now),
  waiting: (now) => hoursAgo(5, now),
  nudge: (now) => daysAgo(6, now),
  inactive: (now) => daysAgo(18, now),
};

function photoTarget(p: Profile, index: number): LikeTarget {
  const photo = p.photos[Math.min(index, p.photos.length - 1)];
  return photo ? { kind: 'photo', photoId: photo.id } : { kind: 'profile' };
}

function promptTarget(p: Profile, index: number): LikeTarget {
  const prompt = p.prompts[Math.min(index, p.prompts.length - 1)];
  return prompt ? { kind: 'prompt', promptId: prompt.id } : { kind: 'profile' };
}

function ctx(from: Profile, about: Profile, target: LikeTarget, at: string, comment?: string): MatchContext {
  return { fromUserId: from.userId, aboutUserId: about.userId, target, snapshot: snapshotFor(about, target), at, ...(comment ? { comment } : {}) };
}

function likerComment(role: LikerRole, liker: Profile, me: Profile): string | undefined {
  const first = me.prompts[0]?.prompt.toLowerCase() ?? '';
  if (role === 'promptComment') {
    if (liker.id === 'p-sofia') return 'A horror double feature on a Sunday? Okay, which two films?';
    return first.includes('sunday') ? 'Your Sunday sounds better than mine. What’s the brunch spot?' : 'This made me laugh. Tell me more?';
  }
  if (role === 'promptComment2') {
    if (liker.id === 'p-klara') return 'I need to know your position on trebuchets vs catapults.';
    return 'Okay, now I’m curious.';
  }
  return undefined;
}

export interface ConnectionsSeed {
  receivedLikes: Like[];
  matches: Match[];
  messages: Message[];
}

/**
 * @param others everyone except the current user
 * @param exclude profile ids the user has already liked or passed in discovery
 */
export function createMockConnections(me: Profile, prefs: Preferences, others: Profile[], exclude: ReadonlySet<ID>, nowMs = Date.now()): ConnectionsSeed {
  const pool = others.filter((o) => prefs.interestedIn.includes(o.gender) && !exclude.has(o.id));
  const rank = (list: string[]) => (p: Profile) => {
    const i = list.indexOf(p.id);
    return i === -1 ? list.length : i;
  };
  const byMatchPref = [...pool].sort((a, b) => rank(PREFERRED_MATCHES)(a) - rank(PREFERRED_MATCHES)(b));
  const matchPeople = byMatchPref.slice(0, MATCH_ROLES.length);
  const rest = pool.filter((p) => !matchPeople.includes(p)).sort((a, b) => rank(PREFERRED_LIKERS)(a) - rank(PREFERRED_LIKERS)(b));
  const likers = rest.slice(0, LIKER_ROLES.length);

  const matches: Match[] = [];
  const messages: Message[] = [];

  matchPeople.forEach((them, i) => {
    const role = MATCH_ROLES[i]!;
    const matchId = `m-${them.id.slice(2)}`;
    const createdAt = role === 'new' ? hoursAgo(20, nowMs) : daysAgo(role === 'inactive' ? 21 : role === 'nudge' ? 9 : 3, nowMs);
    const myTarget = photoTarget(them, 1);
    const theirTarget = role === 'new' ? promptTarget(me, 0) : photoTarget(me, 0);
    const theirComment = role === 'new' ? `Okay, “${me.prompts[0]?.answer.split(/[.,]/)[0] ?? 'this'}” is a strong opening. I approve.` : undefined;
    const contexts = [ctx(me, them, myTarget, daysAgo(4, nowMs)), ctx(them, me, theirTarget, createdAt, theirComment)];

    if (theirComment) {
      messages.push({
        id: `msg-${them.id.slice(2)}-like`, matchId, senderId: them.userId, kind: 'text', body: theirComment, sentAt: createdAt,
        likeContext: { aboutUserId: me.userId, snapshot: snapshotFor(me, theirTarget) },
      });
    }
    const lines = scriptFor(role, { me, them, now: nowMs });
    lines.forEach(([from, body, at], j) => {
      messages.push({ id: `msg-${them.id.slice(2)}-${j + 1}`, matchId, senderId: from === 'me' ? me.userId : them.userId, kind: 'text', body, sentAt: at });
    });
    if (role === 'waiting') {
      messages.push({ id: `msg-${them.id.slice(2)}-photo`, matchId, senderId: them.userId, kind: 'photo', body: '', sentAt: hoursAgo(5.5, nowMs), photo: { tone: TONES.sea } });
      messages.sort((a, b) => a.sentAt.localeCompare(b.sentAt));
    }

    // Everything except the "unread" and "new" chats has been read already.
    const lastTheirs = [...messages].reverse().find((m) => m.matchId === matchId && m.senderId === them.userId);
    const readAt = role === 'unread' || role === 'new' ? hoursAgo(2.5, nowMs) : lastTheirs?.sentAt ?? createdAt;

    matches.push({
      id: matchId,
      userIds: [me.userId, them.userId],
      createdAt,
      lastActivityAt: lastActivity[role](nowMs),
      status: 'active',
      contexts,
      archivedAt: null,
      keptForLaterAt: null,
      lastReadAt: { [me.userId]: role === 'new' ? daysAgo(30, nowMs) : readAt },
    });
  });

  const receivedLikes: Like[] = likers.map((liker, i) => {
    const role = LIKER_ROLES[i]!;
    const target = role === 'photo' ? photoTarget(me, 1) : role === 'profile' ? { kind: 'profile' as const } : promptTarget(me, role === 'promptComment' ? 0 : 1);
    const comment = likerComment(role, liker, me);
    return {
      id: createId('like'),
      fromUserId: liker.userId,
      fromProfileId: liker.id,
      toUserId: me.userId,
      toProfileId: me.id,
      target,
      snapshot: snapshotFor(me, target),
      ...(comment ? { comment } : {}),
      createdAt: hoursAgo(2 + i * 7, nowMs),
    };
  });

  return { receivedLikes, matches, messages };
}
