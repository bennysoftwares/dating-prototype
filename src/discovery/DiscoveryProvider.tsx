import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import type { DailyPicks, ID, Like, LikeTarget, Pass, Preferences, Profile } from '../domain/types';
import { planDailyPicks, preferenceFingerprint, rankCandidates, todayKey, type RankedCandidate, type RankingResult } from '../recommendation';
import { useRepositories } from '../repositories/RepositoryContext';

interface DiscoveryData {
  viewer: Profile;
  preferences: Preferences;
  ranking: RankingResult;
  likes: Like[];
  passes: Pass[];
  matchedUserIds: Set<ID>;
  daily: DailyPicks;
}

export interface DiscoveryView {
  /** Today's picks still to be decided, in curated order. */
  picks: RankedCandidate[];
  dailyTotal: number;
  dailySeen: number;
  exploreOpened: boolean;
  /** Eligible people beyond today's set, best first (only meaningful once Explore more is opened). */
  explore: RankedCandidate[];
  undoablePass: { pass: Pass; candidate: RankedCandidate | undefined } | null;
}

type Status = 'loading' | 'ready' | 'error';

interface DiscoveryContextValue {
  status: Status;
  error: Error | null;
  data: DiscoveryData | null;
  view: DiscoveryView | null;
  refresh: () => Promise<void>;
  /** Any eligible candidate (decided or not). Excluded people are never returned. */
  getCandidate: (profileId: ID) => RankedCandidate | undefined;
  decisionFor: (profileId: ID) => { kind: 'like'; like: Like } | { kind: 'pass'; pass: Pass } | null;
  /** The next undecided person after this one, in the order the user sees them. */
  nextAfter: (profileId: ID) => RankedCandidate | undefined;
  like: (candidate: RankedCandidate, target: LikeTarget, comment?: string) => Promise<void>;
  pass: (candidate: RankedCandidate) => Promise<void>;
  undoPass: () => Promise<RankedCandidate | undefined>;
  openExplore: () => Promise<void>;
}

const DiscoveryContext = createContext<DiscoveryContextValue | null>(null);

/**
 * Discovery state shared by the picks list and the profile screen: ranking,
 * today's curated set, likes, passes and the single-step undo.
 * Mutations are optimistic and persisted through the repositories.
 */
export function DiscoveryProvider({ children }: { children: ReactNode }) {
  const repos = useRepositories();
  const [status, setStatus] = useState<Status>('loading');
  const [error, setError] = useState<Error | null>(null);
  const [data, setData] = useState<DiscoveryData | null>(null);
  const dataRef = useRef<DiscoveryData | null>(null);
  dataRef.current = data;

  const refresh = useCallback(async () => {
    try {
      const [viewer, preferences, candidates, matches, state, user] = await Promise.all([
        repos.profiles.getCurrentProfile(),
        repos.users.getPreferences(),
        repos.profiles.listCandidates(),
        repos.matches.listMatches(),
        repos.discovery.getState(),
        repos.users.getCurrentUser(),
      ]);
      if (!viewer || !preferences) throw new Error('Finish your profile to see recommendations.');

      const matchedUserIds = new Set(matches.flatMap((m) => m.userIds).filter((id) => id !== user.id));
      const ranking = rankCandidates(candidates.filter((c) => !matchedUserIds.has(c.userId)), viewer, preferences);
      const decided = new Set([...state.likes.map((l) => l.toProfileId), ...state.passes.map((p) => p.toProfileId)]);
      const planned = planDailyPicks({
        existing: state.dailyPicks,
        rankedUndecided: ranking.eligible.filter((r) => !decided.has(r.profile.id)).map((r) => r.profile.id),
        decided,
        today: todayKey(),
        fingerprint: preferenceFingerprint(viewer, preferences),
      });
      const daily = planned === state.dailyPicks ? planned : await repos.discovery.saveDailyPicks(planned);

      setData({ viewer, preferences, ranking, likes: state.likes, passes: state.passes, matchedUserIds, daily });
      setStatus('ready');
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err : new Error(String(err)));
      setStatus((s) => (s === 'ready' ? s : 'error'));
    }
  }, [repos]);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  const view = useMemo<DiscoveryView | null>(() => {
    if (!data) return null;
    const decided = new Set([...data.likes.map((l) => l.toProfileId), ...data.passes.map((p) => p.toProfileId)]);
    const byId = new Map(data.ranking.eligible.map((r) => [r.profile.id, r]));
    const dailyIds = new Set(data.daily.profileIds);
    const inDaily = data.daily.profileIds.map((id) => byId.get(id)).filter((r): r is RankedCandidate => Boolean(r));
    const undoable = data.daily.undoablePassId ? data.passes.find((p) => p.id === data.daily.undoablePassId) : undefined;
    return {
      picks: inDaily.filter((r) => !decided.has(r.profile.id)),
      dailyTotal: inDaily.length,
      dailySeen: inDaily.filter((r) => decided.has(r.profile.id)).length,
      exploreOpened: data.daily.exploreOpened,
      explore: data.ranking.eligible.filter((r) => !dailyIds.has(r.profile.id) && !decided.has(r.profile.id)),
      undoablePass: undoable ? { pass: undoable, candidate: byId.get(undoable.toProfileId) } : null,
    };
  }, [data]);

  const getCandidate = useCallback((id: ID) => data?.ranking.eligible.find((r) => r.profile.id === id), [data]);

  const decisionFor = useCallback<DiscoveryContextValue['decisionFor']>(
    (id) => {
      const like = data?.likes.find((l) => l.toProfileId === id);
      if (like) return { kind: 'like', like };
      const pass = data?.passes.find((p) => p.toProfileId === id);
      return pass ? { kind: 'pass', pass } : null;
    },
    [data],
  );

  const nextAfter = useCallback(
    (id: ID) => {
      if (!view) return undefined;
      const queue = view.exploreOpened ? [...view.picks, ...view.explore] : view.picks;
      const others = queue.filter((r) => r.profile.id !== id);
      const idx = queue.findIndex((r) => r.profile.id === id);
      // Prefer whoever came after this person; wrap around to anyone left.
      return (idx >= 0 ? queue.slice(idx + 1).find((r) => r.profile.id !== id) : undefined) ?? others[0];
    },
    [view],
  );

  /** Apply an optimistic change, persist, and roll back if persisting fails. */
  const mutate = useCallback(async (apply: (d: DiscoveryData) => DiscoveryData, persist: () => Promise<void>) => {
    const before = dataRef.current;
    if (!before) return;
    setData(apply(before));
    try {
      await persist();
    } catch (err) {
      setData(before);
      throw err;
    }
  }, []);

  const like = useCallback<DiscoveryContextValue['like']>(
    async (candidate, target, comment) => {
      const optimistic: Like = {
        id: `pending-${candidate.profile.id}`,
        fromUserId: dataRef.current?.viewer.userId ?? '',
        toUserId: candidate.profile.userId,
        toProfileId: candidate.profile.id,
        target,
        ...(comment?.trim() ? { comment: comment.trim() } : {}),
        createdAt: new Date().toISOString(),
      };
      let daily: DailyPicks | null = null;
      await mutate(
        (d) => {
          daily = { ...d.daily, undoablePassId: null };
          return { ...d, likes: [...d.likes.filter((l) => l.toProfileId !== candidate.profile.id), optimistic], daily };
        },
        async () => {
          const saved = await repos.discovery.sendLike({ toProfileId: candidate.profile.id, toUserId: candidate.profile.userId, target, comment });
          if (daily) await repos.discovery.saveDailyPicks(daily);
          setData((d) => d && { ...d, likes: d.likes.map((l) => (l.id === optimistic.id ? saved : l)) });
        },
      );
    },
    [mutate, repos],
  );

  const pass = useCallback<DiscoveryContextValue['pass']>(
    async (candidate) => {
      const saved = await repos.discovery.pass(candidate.profile.id);
      const current = dataRef.current;
      if (!current) return;
      const daily = { ...current.daily, undoablePassId: saved.id };
      await mutate(
        (d) => ({ ...d, passes: [...d.passes.filter((p) => p.toProfileId !== candidate.profile.id), saved], daily }),
        async () => {
          await repos.discovery.saveDailyPicks(daily);
        },
      );
    },
    [mutate, repos],
  );

  const undoPass = useCallback<DiscoveryContextValue['undoPass']>(async () => {
    const current = dataRef.current;
    const passId = current?.daily.undoablePassId;
    const target = current?.passes.find((p) => p.id === passId);
    if (!current || !passId || !target) return undefined;
    const daily = { ...current.daily, undoablePassId: null };
    await mutate(
      (d) => ({ ...d, passes: d.passes.filter((p) => p.id !== passId), daily }),
      async () => {
        await repos.discovery.undoPass(passId);
        await repos.discovery.saveDailyPicks(daily);
      },
    );
    return current.ranking.eligible.find((r) => r.profile.id === target.toProfileId);
  }, [mutate, repos]);

  const openExplore = useCallback(async () => {
    const current = dataRef.current;
    if (!current) return;
    const daily = { ...current.daily, exploreOpened: true };
    await mutate((d) => ({ ...d, daily }), async () => {
      await repos.discovery.saveDailyPicks(daily);
    });
  }, [mutate, repos]);

  const value = useMemo<DiscoveryContextValue>(
    () => ({ status, error, data, view, refresh, getCandidate, decisionFor, nextAfter, like, pass, undoPass, openExplore }),
    [status, error, data, view, refresh, getCandidate, decisionFor, nextAfter, like, pass, undoPass, openExplore],
  );
  return <DiscoveryContext.Provider value={value}>{children}</DiscoveryContext.Provider>;
}

export function useDiscovery(): DiscoveryContextValue {
  const ctx = useContext(DiscoveryContext);
  if (!ctx) throw new Error('useDiscovery must be used inside <DiscoveryProvider>.');
  return ctx;
}
