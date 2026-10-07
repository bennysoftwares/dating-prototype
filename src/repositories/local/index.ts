import type { Repositories } from '../types';
import { localDb, withLatency } from './localDb';

export function createLocalRepositories(): Repositories {
  localDb.ensureSeeded();

  const currentUser = () => {
    const user = localDb.user();
    if (!user) throw new Error('No current user found in local data.');
    return user;
  };

  return {
    users: {
      getCurrentUser: () => withLatency(currentUser),
      getPreferences: () =>
        withLatency(() => {
          const prefs = localDb.preferences();
          if (!prefs) throw new Error('No preferences found in local data.');
          return prefs;
        }),
    },
    profiles: {
      getProfile: (id) => withLatency(() => localDb.profiles().find((p) => p.id === id) ?? null),
      getProfileByUserId: (userId) => withLatency(() => localDb.profiles().find((p) => p.userId === userId) ?? null),
      listCandidates: () => withLatency(() => localDb.profiles().filter((p) => p.userId !== currentUser().id)),
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
