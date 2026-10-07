import type { Block, Pass, Report } from '../../domain/types';
import { createId } from '../../utils/id';
import type { SafetyRepository } from '../types';
import { currentUser, ensure } from './helpers';
import { localDb, withLatency } from './localDb';

export function createLocalSafetyRepository(): SafetyRepository {
  /** Make sure this person never shows up in discovery again. */
  const recordPass = (userId: string) => {
    const me = currentUser().id;
    const profileId = localDb.profiles().find((p) => p.userId === userId)?.id;
    if (!profileId || localDb.passes().some((p) => p.fromUserId === me && p.toProfileId === profileId)) return;
    const pass: Pass = { id: createId('pass'), fromUserId: me, toProfileId: profileId, createdAt: new Date().toISOString() };
    ensure(localDb.writePasses([...localDb.passes(), pass]));
  };

  const block = (userId: string): Block => {
    const me = currentUser().id;
    const existing = localDb.blocks().find((b) => b.blockerId === me && b.blockedUserId === userId);
    if (existing) return existing;
    const b: Block = { id: createId('block'), blockerId: me, blockedUserId: userId, createdAt: new Date().toISOString() };
    ensure(localDb.writeBlocks([...localDb.blocks(), b]));
    return b;
  };

  return {
    listBlocks: () => withLatency(() => localDb.blocks().filter((b) => b.blockerId === currentUser().id)),
    block: (userId) => withLatency(() => block(userId)),
    unblock: (userId) =>
      withLatency(() => {
        const me = currentUser().id;
        ensure(localDb.writeBlocks(localDb.blocks().filter((b) => !(b.blockerId === me && b.blockedUserId === userId))));
      }),
    report: ({ userId, category, details, alsoBlock }) =>
      withLatency(() => {
        const report: Report = {
          id: createId('report'),
          reporterId: currentUser().id,
          reportedUserId: userId,
          category,
          ...(details?.trim() ? { details: details.trim() } : {}),
          alsoBlocked: alsoBlock,
          createdAt: new Date().toISOString(),
          status: 'received',
        };
        ensure(localDb.writeReports([...localDb.reports(), report]));
        if (alsoBlock) block(userId);
        return report;
      }),
    listReports: () => withLatency(() => localDb.reports().filter((r) => r.reporterId === currentUser().id)),
    unmatch: (matchId) =>
      withLatency(() => {
        const me = currentUser().id;
        const match = localDb.matches().find((m) => m.id === matchId);
        if (!match) return;
        const other = match.userIds.find((id) => id !== me);
        ensure(localDb.writeMatches(localDb.matches().filter((m) => m.id !== matchId)));
        ensure(localDb.writeMessages(localDb.messages().filter((m) => m.matchId !== matchId)));
        ensure(localDb.writeDates(localDb.dates().filter((d) => d.matchId !== matchId)));
        if (other) recordPass(other);
      }),
  };
}
