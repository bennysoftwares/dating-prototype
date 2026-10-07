import type { Like, Pass } from '../../domain/types';
import { createId } from '../../utils/id';
import { StorageFullError, type Repositories } from '../types';
import { localDb, withLatency } from './localDb';

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
      listCandidates: () => withLatency(() => localDb.profiles().filter((p) => p.userId !== currentUser().id)),
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
          const like: Like = {
            id: createId('like'),
            fromUserId: currentUser().id,
            toUserId,
            toProfileId,
            target,
            ...(comment?.trim() ? { comment: comment.trim() } : {}),
            createdAt: new Date().toISOString(),
          };
          ensure(localDb.writeLikes([...localDb.likes().filter((l) => !(l.fromUserId === like.fromUserId && l.toProfileId === toProfileId)), like]));
          return like;
        }),
      pass: (toProfileId) =>
        withLatency(() => {
          const pass: Pass = { id: createId('pass'), fromUserId: currentUser().id, toProfileId, createdAt: new Date().toISOString() };
          ensure(localDb.writePasses([...localDb.passes().filter((p) => !(p.fromUserId === pass.fromUserId && p.toProfileId === toProfileId)), pass]));
          return pass;
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
    matches: {
      listMatches: () =>
        withLatency(() =>
          localDb
            .matches()
            .filter((m) => m.userIds.includes(currentUser().id))
            .sort((a, b) => b.lastActivityAt.localeCompare(a.lastActivityAt)),
        ),
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
