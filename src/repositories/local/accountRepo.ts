import { storage } from '../../storage/storage';
import type { AccountRepository } from '../types';
import { currentUser, ensure } from './helpers';
import { localDb, withLatency } from './localDb';

export function createLocalAccountRepository(): AccountRepository {
  const updateUser = (patch: Partial<ReturnType<typeof currentUser>>) => {
    const next = { ...currentUser(), ...patch };
    ensure(localDb.writeUser(next));
    return next;
  };
  return {
    setPaused: (paused) => withLatency(() => updateUser({ status: paused ? 'paused' : 'active' })),
    setIncognito: (on) => withLatency(() => updateUser({ incognito: on })),
    getPrivacy: () => withLatency(() => localDb.privacy()),
    savePrivacy: (privacy) =>
      withLatency(() => {
        ensure(localDb.writePrivacy(privacy));
        return privacy;
      }),
    setVerification: (kind, state) =>
      withLatency(() => {
        const user = currentUser();
        const own = localDb.profiles().find((p) => p.id === user.profileId);
        if (!own) throw new Error('No profile found.');
        const verification = { photo: own.verification?.photo ?? 'unverified', id: own.verification?.id ?? 'unverified', [kind]: state };
        const next = { ...own, verification };
        ensure(localDb.writeOwnProfile(next));
        return next;
      }),
    exportData: () =>
      withLatency(() => {
        const user = currentUser();
        const mine = new Set(localDb.matches().filter((m) => m.userIds.includes(user.id)).map((m) => m.id));
        return {
          exportedAt: new Date().toISOString(),
          note: 'Prototype export of everything stored on this device about your account.',
          account: user,
          profile: localDb.profiles().find((p) => p.id === user.profileId) ?? null,
          preferences: localDb.preferences(),
          privacy: localDb.privacy(),
          likesSent: localDb.likes().filter((l) => l.fromUserId === user.id),
          likesReceived: localDb.likes().filter((l) => l.toUserId === user.id),
          passes: localDb.passes().filter((p) => p.fromUserId === user.id),
          matches: localDb.matches().filter((m) => mine.has(m.id)),
          messages: localDb.messages().filter((m) => mine.has(m.matchId)),
          dates: localDb.dates().filter((d) => mine.has(d.matchId)),
          dateFeedback: localDb.dateFeedback(),
          blocks: localDb.blocks().filter((b) => b.blockerId === user.id),
          reports: localDb.reports().filter((r) => r.reporterId === user.id),
        };
      }),
    deleteAccount: () =>
      withLatency(() => {
        storage.clearAll();
        localDb.reset();
      }),
  };
}
