import type { DailyPicks, ID, Preferences, Profile } from '../domain/types';

/** Size of the curated daily set. Small on purpose: fewer, better-considered people. */
export const DAILY_PICKS_SIZE = 12;

/** Local calendar date, YYYY-MM-DD. */
export function todayKey(now = new Date()): string {
  const m = String(now.getMonth() + 1).padStart(2, '0');
  const d = String(now.getDate()).padStart(2, '0');
  return `${now.getFullYear()}-${m}-${d}`;
}

/** Cheap stable hash of everything that changes who should be shown. */
export function preferenceFingerprint(viewer: Profile, prefs: Preferences): string {
  const input = JSON.stringify([prefs.interestedIn, prefs.age, prefs.distance, prefs.intents, prefs.smoking, prefs.drinking, prefs.children, prefs.wantsChildren, prefs.religion, prefs.politics, prefs.education, prefs.height, viewer.location, viewer.intent]);
  let h = 5381;
  for (let i = 0; i < input.length; i += 1) h = ((h << 5) + h + input.charCodeAt(i)) | 0;
  return (h >>> 0).toString(36);
}

interface PlanInput {
  existing: DailyPicks | null;
  /** Eligible, undecided candidate ids, best first. */
  rankedUndecided: ID[];
  decided: ReadonlySet<ID>;
  today: string;
  fingerprint: string;
}

/**
 * Today's set is fixed once created, so it never reshuffles mid-day.
 * If preferences change, people already decided today stay counted and the rest is refilled,
 * so editing preferences can't be used to get an endless feed.
 */
export function planDailyPicks({ existing, rankedUndecided, decided, today, fingerprint }: PlanInput): DailyPicks {
  if (existing && existing.date === today && existing.fingerprint === fingerprint) return existing;

  if (existing && existing.date === today) {
    const kept = existing.profileIds.filter((id) => decided.has(id));
    const fill = rankedUndecided.filter((id) => !kept.includes(id)).slice(0, Math.max(0, DAILY_PICKS_SIZE - kept.length));
    return { ...existing, profileIds: [...kept, ...fill], fingerprint };
  }

  return { date: today, profileIds: rankedUndecided.slice(0, DAILY_PICKS_SIZE), fingerprint, exploreOpened: false };
}
