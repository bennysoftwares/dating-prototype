import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import { can } from '../domain/entitlements';
import type { DailyPicks, DiscoveryAction, ID, Like, LikeTarget, Match, Pass, Preferences, Profile } from '../domain/types';
import { planDailyPicks, preferenceFingerprint, rankCandidates, todayKey, type RankedCandidate, type RankingResult } from '../recommendation';
import { useRepositories } from '../repositories/RepositoryContext';
import type { FeedSort } from '../repositories/types';
import { useSession } from '../session/SessionProvider';

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
  /** Standouts: today's curated picks still to be decided, in curated order. */
  picks: RankedCandidate[];
  dailyTotal: number;
  dailySeen: number;
  /** Everyone who passes your filters, decided or not. Zero means the filters exclude everyone. */
  eligibleTotal: number;
  /** The one previous action that can be rewound (Premium only). */
  rewindable: { action: DiscoveryAction; candidate: RankedCandidate | undefined } | null;
}

/**
 * The Explore queue. Pages are requested from the repository as the queue runs low, so
 * swiping feels continuous until the eligible pool is genuinely used up.
 */
export interface FeedState {
  sort: FeedSort;
  /** Queued people, in order. The first is the card on top. */
  items: RankedCandidate[];
  status: 'loading' | 'ready' | 'error';
  loadingMore: boolean;
  /** The repository has more eligible people beyond what's queued. */
  hasMore: boolean;
  error: Error | null;
}

export type SwipeDirection = 'left' | 'right';

/** Page size and how low the queue may get before the next page is requested. */
export const FEED_PAGE_SIZE = 10;
export const FEED_PREFETCH_AT = 4;

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
  /** Resolves with the new match when the like was mutual. */
  like: (candidate: RankedCandidate, target: LikeTarget, comment?: string) => Promise<Match | null>;
  pass: (candidate: RankedCandidate) => Promise<void>;
  /** Premium: one-step rewind of the last pass or like. */
  canRewind: boolean;
  rewind: () => Promise<RankedCandidate | undefined>;
  /** Explore */
  feed: FeedState;
  setFeedSort: (sort: FeedSort) => void;
  /** Left = pass, right = like the whole profile. Buttons and gestures both call this. */
  swipe: (candidate: RankedCandidate, direction: SwipeDirection) => Promise<Match | null>;
  retryFeed: () => void;
}

const DiscoveryContext = createContext<DiscoveryContextValue | null>(null);

/** The rewind buffer, reading the Part 3 `undoablePassId` field for older stored data. */
function lastActionOf(daily: DailyPicks, passes: Pass[]): DiscoveryAction | null {
  if (daily.lastAction) return daily.lastAction;
  const legacy = daily.undoablePassId ? passes.find((p) => p.id === daily.undoablePassId) : undefined;
  return legacy ? { kind: 'pass', recordId: legacy.id, profileId: legacy.toProfileId } : null;
}

/**
 * Discovery state shared by Explore, Standouts and the full profile: ranking, the Explore
 * queue, today's curated set, likes, passes and the one-step rewind buffer (Premium).
 * Mutations are optimistic and persisted through the repositories.
 */
export function DiscoveryProvider({ children }: { children: ReactNode }) {
  const repos = useRepositories();
  const { state: session } = useSession();
  const user = session.status === 'ready' ? session.user : null;
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

      dataRef.current = { viewer, preferences, ranking, likes: state.likes, passes: state.passes, matchedUserIds, daily };
      setData(dataRef.current);
      setStatus('ready');
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err : new Error(String(err)));
      setStatus((s) => (s === 'ready' ? s : 'error'));
    }
  }, [repos]);

  // While this provider is saving its own change, storage events are deferred so a
  // half-written state (e.g. a pass saved before its undo marker) is never loaded.
  const busy = useRef(0);
  const deferred = useRef(false);
  const guard = useCallback(
    async <T,>(fn: () => Promise<T>): Promise<T> => {
      busy.current += 1;
      try {
        return await fn();
      } finally {
        busy.current -= 1;
        if (busy.current === 0 && deferred.current) {
          deferred.current = false;
          void refresh();
        }
      }
    },
    [refresh],
  );

  useEffect(() => {
    void refresh();
    // Blocks, likes, passes and new matches elsewhere in the app must update discovery right away.
    return repos.matches.subscribe(() => {
      if (busy.current > 0) deferred.current = true;
      else void refresh();
    });
  }, [refresh, repos]);

  /* ---------------------------- Explore queue ---------------------------- */

  const [feed, setFeed] = useState<FeedState>({ sort: 'for_you', items: [], status: 'loading', loadingMore: false, hasMore: true, error: null });
  const feedRef = useRef(feed);
  feedRef.current = feed;
  /** Bumped on every reset so a page that arrives late for an old query is ignored. */
  const generation = useRef(0);
  /** People with a pass or like still being saved: never re-requested in that window. */
  const inFlight = useRef(new Set<ID>());
  const loading = useRef(false);

  const loadPage = useCallback(async (reset: boolean) => {
    if (loading.current && !reset) return;
    const gen = reset ? ++generation.current : generation.current;
    loading.current = true;
    const current = feedRef.current;
    setFeed((f) => (reset ? { ...f, items: [], status: 'loading', hasMore: true, error: null, loadingMore: false } : { ...f, loadingMore: true, error: null }));
    try {
      const exclude = reset ? [...inFlight.current] : [...current.items.map((c) => c.profile.id), ...inFlight.current];
      const page = await repos.discovery.getFeedPage({ sort: current.sort, limit: FEED_PAGE_SIZE, exclude });
      if (gen !== generation.current) return;
      setFeed((f) => {
        const queued = new Set(f.items.map((c) => c.profile.id));
        const fresh = page.items.filter((c) => !queued.has(c.profile.id) && !inFlight.current.has(c.profile.id));
        return { ...f, items: [...f.items, ...fresh], status: 'ready', loadingMore: false, hasMore: page.hasMore, error: null };
      });
    } catch (err) {
      if (gen !== generation.current) return;
      const e = err instanceof Error ? err : new Error(String(err));
      setFeed((f) => ({ ...f, status: f.items.length ? 'ready' : 'error', loadingMore: false, error: e }));
    } finally {
      if (gen === generation.current) loading.current = false;
    }
  }, [repos]);

  // Start over whenever who-should-be-shown changes (filters, distance, location, sort).
  const fingerprint = data ? `${feed.sort}:${preferenceFingerprint(data.viewer, data.preferences)}` : null;
  useEffect(() => {
    if (fingerprint) void loadPage(true);
  }, [fingerprint, loadPage]);

  // Keep the queue topped up before it runs out.
  useEffect(() => {
    if (feed.status === 'ready' && !feed.error && feed.hasMore && !feed.loadingMore && feed.items.length <= FEED_PREFETCH_AT) void loadPage(false);
  }, [feed.status, feed.error, feed.hasMore, feed.loadingMore, feed.items.length, loadPage]);

  // Drop anyone who stopped being eligible elsewhere (blocked, matched, decided on another screen).
  useEffect(() => {
    if (!data) return;
    const eligible = new Set(data.ranking.eligible.map((r) => r.profile.id));
    const decided = new Set([...data.likes.map((l) => l.toProfileId), ...data.passes.map((p) => p.toProfileId)]);
    setFeed((f) => {
      const items = f.items.filter((c) => eligible.has(c.profile.id) && !decided.has(c.profile.id));
      return items.length === f.items.length ? f : { ...f, items };
    });
  }, [data]);

  const setFeedSort = useCallback((sort: FeedSort) => {
    setFeed((f) => (f.sort === sort ? f : { ...f, sort, items: [], status: 'loading' }));
  }, []);
  const retryFeed = useCallback(() => {
    void loadPage(feedRef.current.items.length === 0);
  }, [loadPage]);

  const removeFromFeed = (profileId: ID) => setFeed((f) => ({ ...f, items: f.items.filter((c) => c.profile.id !== profileId) }));
  const restoreToFeed = (candidate: RankedCandidate) =>
    setFeed((f) => (f.items.some((c) => c.profile.id === candidate.profile.id) ? f : { ...f, items: [candidate, ...f.items] }));

  /* ------------------------------- Derived -------------------------------- */

  const view = useMemo<DiscoveryView | null>(() => {
    if (!data) return null;
    const decided = new Set([...data.likes.map((l) => l.toProfileId), ...data.passes.map((p) => p.toProfileId)]);
    const byId = new Map(data.ranking.eligible.map((r) => [r.profile.id, r]));
    const inDaily = data.daily.profileIds.map((id) => byId.get(id)).filter((r): r is RankedCandidate => Boolean(r));
    const action = lastActionOf(data.daily, data.passes);
    const stillThere = action && (action.kind === 'pass' ? data.passes.some((p) => p.id === action.recordId) : data.likes.some((l) => l.id === action.recordId));
    return {
      picks: inDaily.filter((r) => !decided.has(r.profile.id)),
      dailyTotal: inDaily.length,
      dailySeen: inDaily.filter((r) => decided.has(r.profile.id)).length,
      eligibleTotal: data.ranking.eligible.length,
      rewindable: action && stillThere ? { action, candidate: byId.get(action.profileId) } : null,
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

  /** Update state and the ref together, so code after an await always sees the latest data. */
  const patch = useCallback((fn: (d: DiscoveryData) => DiscoveryData) => {
    if (!dataRef.current) return;
    dataRef.current = fn(dataRef.current);
    setData(dataRef.current);
  }, []);

  /** Apply an optimistic change, persist, and roll back if persisting fails. */
  const mutate = useCallback(async (apply: (d: DiscoveryData) => DiscoveryData, persist: () => Promise<void>) => {
    const before = dataRef.current;
    if (!before) return;
    patch(apply);
    try {
      await persist();
    } catch (err) {
      patch(() => before);
      throw err;
    }
  }, [patch]);

  /**
   * Decisions save in parallel, so fast swiping never queues up. Each one gets a sequence
   * number; only the newest decision may write the rewind buffer, so a slow save can never
   * overwrite a newer one. Rewind waits for every decision made before it (and only those).
   */
  const seq = useRef(0);
  const saving = useRef(new Map<number, Promise<unknown>>());

  const decide = useCallback(
    async <T,>(candidate: RankedCandidate, save: (isLatest: () => boolean) => Promise<T>): Promise<T> => {
      const id = candidate.profile.id;
      const mine = ++seq.current;
      inFlight.current.add(id);
      removeFromFeed(id);
      const run = save(() => seq.current === mine);
      saving.current.set(mine, run);
      try {
        return await run;
      } catch (err) {
        restoreToFeed(candidate);
        throw err;
      } finally {
        inFlight.current.delete(id);
        saving.current.delete(mine);
      }
    },
    [],
  );

  const like = useCallback<DiscoveryContextValue['like']>(
    (candidate, target, comment) => decide(candidate, (isLatest) => guard(async () => {
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
      let match: Match | null = null;
      await mutate(
        (d) => {
          daily = { ...d.daily, undoablePassId: null, lastAction: null };
          if (!isLatest()) return { ...d, likes: [...d.likes.filter((l) => l.toProfileId !== candidate.profile.id), optimistic] };
          return { ...d, likes: [...d.likes.filter((l) => l.toProfileId !== candidate.profile.id), optimistic], daily };
        },
        async () => {
          const saved = await repos.discovery.sendLike({ toProfileId: candidate.profile.id, toUserId: candidate.profile.userId, target, comment });
          match = saved.match;
          // A like that made a match can't be rewound; otherwise it becomes the rewind buffer.
          if (daily && !saved.match) daily = { ...(daily as DailyPicks), lastAction: { kind: 'like', recordId: saved.like.id, profileId: candidate.profile.id } };
          // A newer decision owns the rewind buffer now; don't overwrite it.
          if (daily && isLatest()) {
            await repos.discovery.saveDailyPicks(daily);
            const saveDaily = daily;
            patch((d) => ({ ...d, daily: saveDaily }));
          }
          patch((d) => ({ ...d, likes: d.likes.map((l) => (l.id === optimistic.id ? saved.like : l)) }));
        },
      );
      return match;
    })),
    [mutate, patch, repos, guard, decide],
  );

  const pass = useCallback<DiscoveryContextValue['pass']>(
    (candidate) => decide(candidate, (isLatest) => guard(async () => {
      const saved = await repos.discovery.pass(candidate.profile.id);
      const current = dataRef.current;
      if (!current) return;
      const addPass = (d: DiscoveryData) => ({ ...d, passes: [...d.passes.filter((p) => p.toProfileId !== candidate.profile.id), saved] });
      // A newer decision owns the rewind buffer now; just record the pass.
      if (!isLatest()) return patch(addPass);
      const daily: DailyPicks = { ...current.daily, undoablePassId: null, lastAction: { kind: 'pass', recordId: saved.id, profileId: candidate.profile.id } };
      await mutate(
        (d) => ({ ...addPass(d), daily }),
        async () => {
          await repos.discovery.saveDailyPicks(daily);
        },
      );
    })),
    [mutate, patch, repos, guard, decide],
  );

  const swipe = useCallback<DiscoveryContextValue['swipe']>(
    async (candidate, direction) => {
      if (direction === 'right') return like(candidate, { kind: 'profile' });
      await pass(candidate);
      return null;
    },
    [like, pass],
  );

  const canRewind = can(user, 'rewind');

  /** One step only: the buffer is cleared after rewinding, so you can't go back further. */
  const rewind = useCallback<DiscoveryContextValue['rewind']>(() => guard(async () => {
    // Let every decision made before this tap finish, so the buffer holds the latest one.
    const before = seq.current;
    await Promise.allSettled([...saving.current].filter(([n]) => n <= before).map(([, p]) => p));
    const current = dataRef.current;
    const action = current && lastActionOf(current.daily, current.passes);
    if (!current || !action || !canRewind) return undefined;
    const daily: DailyPicks = { ...current.daily, undoablePassId: null, lastAction: null };
    await mutate(
      (d) => ({
        ...d,
        passes: action.kind === 'pass' ? d.passes.filter((p) => p.id !== action.recordId) : d.passes,
        likes: action.kind === 'like' ? d.likes.filter((l) => l.id !== action.recordId) : d.likes,
        daily,
      }),
      async () => {
        if (action.kind === 'pass') await repos.discovery.undoPass(action.recordId);
        else await repos.discovery.undoLike(action.recordId);
        await repos.discovery.saveDailyPicks(daily);
      },
    );
    const restored = current.ranking.eligible.find((r) => r.profile.id === action.profileId);
    // Back on top of the Explore deck.
    if (restored) restoreToFeed(restored);
    return restored;
  }), [mutate, repos, guard, canRewind]);

  const value = useMemo<DiscoveryContextValue>(
    () => ({ status, error, data, view, refresh, getCandidate, decisionFor, like, pass, canRewind, rewind, feed, setFeedSort, swipe, retryFeed }),
    [status, error, data, view, refresh, getCandidate, decisionFor, like, pass, canRewind, rewind, feed, setFeedSort, swipe, retryFeed],
  );
  return <DiscoveryContext.Provider value={value}>{children}</DiscoveryContext.Provider>;
}

export function useDiscovery(): DiscoveryContextValue {
  const ctx = useContext(DiscoveryContext);
  if (!ctx) throw new Error('useDiscovery must be used inside <DiscoveryProvider>.');
  return ctx;
}
