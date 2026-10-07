import { createMatchFromLikes, snapshotFor } from '../../domain/matching';
import type { ID, Like, Match, Message, Pass } from '../../domain/types';
import { storage } from '../../storage/storage';
import { STORAGE_KEYS as K } from '../../storage/keys';
import { createId } from '../../utils/id';
import { StorageFullError, type Repositories } from '../types';
import { createLocalAccountRepository } from './accountRepo';
import { createLocalDatesRepository } from './datesRepo';
import { localDb, withLatency } from './localDb';
import { createLocalSafetyRepository } from './safetyRepo';

export function createLocalRepositories(): Repositories {
  localDb.ensureSeeded();

  const currentUser = () => {
    const user = localDb.user();
    if (!user) throw new Error('No current user found in local data.');
    return user;
  };

  const ensure = (ok: boolean) => {
    if (!ok) throw new StorageFullError();
  };

  const matchBetween = (a: ID, b: ID) => localDb.matches().find((m) => m.userIds.includes(a) && m.userIds.includes(b));

  /** A like from `from` to `to` that hasn't been passed on or matched yet. */
  const pendingLikeFrom = (from: ID, to: ID) => {
    if (matchBetween(from, to)) return undefined;
    const like = localDb.likes().find((l) => l.fromUserId === from && l.toUserId === to);
    const passed = like && localDb.passes().some((p) => p.fromUserId === to && p.toProfileId === like.fromProfileId);
    return passed ? undefined : like;
  };

  const createMatch = (a: Like, b: Like): Match => {
    const { match, messages } = createMatchFromLikes(a, b);
    // Normalise so the current user is always first.
    const me = currentUser().id;
    const normalised: Match = { ...match, userIds: match.userIds[0] === me ? match.userIds : [match.userIds[1], match.userIds[0]] };
    ensure(localDb.writeMatches([...localDb.matches(), normalised]));
    ensure(localDb.writeMessages([...localDb.messages(), ...messages]));
    return normalised;
  };

  const updateMatch = (matchId: ID, fn: (m: Match) => Match): Match => {
    let updated: Match | undefined;
    const next = localDb.matches().map((m) => (m.id === matchId ? (updated = fn(m)) : m));
    if (!updated) throw new Error('That conversation no longer exists.');
    ensure(localDb.writeMatches(next));
    return updated;
  };

  return {
    users: {
      getCurrentUser: () => withLatency(currentUser),
      getPreferences: () => withLatency(() => localDb.preferences()),
      savePreferences: (preferences) =>
        withLatency(() => {
          ensure(localDb.writePreferences({ ...preferences, userId: currentUser().id }));
          return preferences;
        }),
      completeOnboarding: (profile, preferences) =>
        withLatency(() => {
          const user = currentUser();
          ensure(localDb.writeOwnProfile({ ...profile, id: user.profileId, userId: user.id }));
          ensure(localDb.writePreferences({ ...preferences, userId: user.id }));
          const next = { ...user, onboardingComplete: true, lastActiveAt: new Date().toISOString() };
          ensure(localDb.writeUser(next));
          // Prototype: give the new account some likes and conversations to explore.
          localDb.resetConnections();
          return next;
        }),
    },
    profiles: {
      getProfile: (id) => withLatency(() => localDb.profiles().find((p) => p.id === id) ?? null),
      getProfileByUserId: (userId) => withLatency(() => localDb.profiles().find((p) => p.userId === userId) ?? null),
      getCurrentProfile: () =>
        withLatency(() => {
          const user = currentUser();
          return localDb.profiles().find((p) => p.id === user.profileId) ?? null;
        }),
      saveCurrentProfile: (profile) =>
        withLatency(() => {
          const user = currentUser();
          const saved = { ...profile, id: user.profileId, userId: user.id, updatedAt: new Date().toISOString() };
          ensure(localDb.writeOwnProfile(saved));
          return saved;
        }),
      listCandidates: () =>
        withLatency(() => {
          const blocked = localDb.blockedUserIds();
          return localDb.profiles().filter((p) => p.userId !== currentUser().id && !blocked.has(p.userId));
        }),
    },
    discovery: {
      getState: () =>
        withLatency(() => {
          const me = currentUser().id;
          return {
            likes: localDb.likes().filter((l) => l.fromUserId === me),
            passes: localDb.passes().filter((p) => p.fromUserId === me),
            dailyPicks: localDb.dailyPicks(),
          };
        }),
      sendLike: ({ toProfileId, toUserId, target, comment }) =>
        withLatency(() => {
          const me = currentUser();
          const them = localDb.profiles().find((p) => p.id === toProfileId);
          const like: Like = {
            id: createId('like'),
            fromUserId: me.id,
            fromProfileId: me.profileId,
            toUserId,
            toProfileId,
            target,
            snapshot: snapshotFor(them, target),
            ...(comment?.trim() ? { comment: comment.trim() } : {}),
            createdAt: new Date().toISOString(),
          };
          ensure(localDb.writeLikes([...localDb.likes().filter((l) => !(l.fromUserId === like.fromUserId && l.toProfileId === toProfileId)), like]));
          // They already liked you → it's mutual.
          const theirs = pendingLikeFrom(toUserId, me.id);
          return { like, match: theirs ? createMatch(theirs, like) : null };
        }),
      pass: (toProfileId) =>
        withLatency(() => {
          const pass: Pass = { id: createId('pass'), fromUserId: currentUser().id, toProfileId, createdAt: new Date().toISOString() };
          ensure(localDb.writePasses([...localDb.passes().filter((p) => !(p.fromUserId === pass.fromUserId && p.toProfileId === toProfileId)), pass]));
          return pass;
        }),
      undoLike: (likeId) =>
        withLatency(() => {
          const me = currentUser().id;
          const like = localDb.likes().find((l) => l.id === likeId && l.fromUserId === me);
          if (!like) return;
          if (localDb.matches().some((m) => m.userIds.includes(like.toUserId) && m.userIds.includes(me))) {
            throw new Error('You’re already matched, so this like can’t be rewound.');
          }
          ensure(localDb.writeLikes(localDb.likes().filter((l) => l.id !== likeId)));
        }),
      undoPass: (passId) =>
        withLatency(() => {
          ensure(localDb.writePasses(localDb.passes().filter((p) => p.id !== passId)));
        }),
      saveDailyPicks: (daily) =>
        withLatency(() => {
          ensure(localDb.writeDailyPicks(daily));
          return daily;
        }),
    },
    incomingLikes: {
      listReceived: () =>
        withLatency(() =>
          localDb
            .likes()
            .filter((l) => l.toUserId === currentUser().id && !localDb.blockedUserIds().has(l.fromUserId))
            .sort((a, b) => b.createdAt.localeCompare(a.createdAt)),
        ),
      respond: (likeId, response) =>
        withLatency(() => {
          const me = currentUser();
          const theirs = localDb.likes().find((l) => l.id === likeId && l.toUserId === me.id);
          if (!theirs) throw new Error('That like is no longer available.');
          const theirProfileId = theirs.fromProfileId ?? localDb.profiles().find((p) => p.userId === theirs.fromUserId)?.id ?? '';
          if (response === 'pass') {
            const pass: Pass = { id: createId('pass'), fromUserId: me.id, toProfileId: theirProfileId, createdAt: new Date().toISOString() };
            ensure(localDb.writePasses([...localDb.passes().filter((p) => !(p.fromUserId === me.id && p.toProfileId === theirProfileId)), pass]));
            return null;
          }
          const existing = matchBetween(me.id, theirs.fromUserId);
          if (existing) return existing;
          const mine: Like = {
            id: createId('like'),
            fromUserId: me.id,
            fromProfileId: me.profileId,
            toUserId: theirs.fromUserId,
            toProfileId: theirProfileId,
            target: { kind: 'profile' },
            snapshot: { kind: 'profile' },
            createdAt: new Date().toISOString(),
          };
          ensure(localDb.writeLikes([...localDb.likes().filter((l) => !(l.fromUserId === me.id && l.toProfileId === theirProfileId)), mine]));
          return createMatch(theirs, mine);
        }),
    },
    account: createLocalAccountRepository(),
    safety: createLocalSafetyRepository(),
    dates: createLocalDatesRepository(),
    matches: {
      listMatches: () =>
        withLatency(() =>
          localDb
            .matches()
            .filter((m) => m.userIds.includes(currentUser().id) && !m.userIds.some((id) => localDb.blockedUserIds().has(id)))
            .sort((a, b) => b.lastActivityAt.localeCompare(a.lastActivityAt)),
        ),
      listAllMessages: () =>
        withLatency(() => {
          const blocked = localDb.blockedUserIds();
          const mine = new Set(
            localDb
              .matches()
              .filter((m) => m.userIds.includes(currentUser().id) && !m.userIds.some((id) => blocked.has(id)))
              .map((m) => m.id),
          );
          return localDb.messages().filter((m) => mine.has(m.matchId)).sort((a, b) => a.sentAt.localeCompare(b.sentAt));
        }),
      sendMessage: (matchId, input) =>
        withLatency(() => {
          const me = currentUser();
          const now = new Date().toISOString();
          const message: Message = { id: createId('msg'), matchId, senderId: me.id, sentAt: now, ...input };
          ensure(localDb.writeMessages([...localDb.messages(), message]));
          // Writing again brings an archived or inactive chat back into the main list.
          updateMatch(matchId, (m) => ({ ...m, lastActivityAt: now, archivedAt: null, lastReadAt: { ...m.lastReadAt, [me.id]: now } }));
          return message;
        }),
      markRead: (matchId) =>
        withLatency(() => {
          const me = currentUser().id;
          updateMatch(matchId, (m) => ({ ...m, lastReadAt: { ...m.lastReadAt, [me]: new Date().toISOString() } }));
        }),
      setArchived: (matchId, archived) =>
        withLatency(() => updateMatch(matchId, (m) => ({ ...m, archivedAt: archived ? new Date().toISOString() : null }))),
      keepForLater: (matchId) => withLatency(() => updateMatch(matchId, (m) => ({ ...m, keptForLaterAt: new Date().toISOString() }))),
      subscribe: (onChange) => {
        const watched = new Set([K.dbMatches.key, K.dbMessages.key, K.dbLikes.key, K.dbPasses.key, K.dbBlocks.key, K.dbDates.key, K.dbDateFeedback.key, K.dbUser.key, '*']);
        return storage.subscribe((key) => watched.has(key) && onChange());
      },
      listMessages: (matchId) =>
        withLatency(() =>
          localDb
            .messages()
            .filter((m) => m.matchId === matchId)
            .sort((a, b) => a.sentAt.localeCompare(b.sentAt)),
        ),
    },
  };
}
