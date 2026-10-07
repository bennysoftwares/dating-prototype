import type { Preferences, Profile } from '../domain/types';
import { approxDistanceKm } from '../utils/profileFormat';
import { buildCompatibility, buildReasons } from './compatibility';
import { evaluateHardFilters } from './hardFilters';
import { scoreCandidate } from './scoring';
import type { RankedCandidate, RankingResult } from './types';

export * from './dailyPicks';
export type * from './types';

/**
 * Transparent, rules-based recommendations:
 * 1. Hard filters (dealbreakers, gender, hard max distance) run first and exclude.
 * 2. Everyone left is scored on intention, distance, age, shared interests,
 *    soft preferences, lifestyle fit, activity freshness and profile depth.
 * 3. Each person carries human-language reasons. Scores are for ordering only.
 */
export function rankCandidates(candidates: Profile[], viewer: Profile, prefs: Preferences, now = Date.now()): RankingResult {
  const eligible: RankedCandidate[] = [];
  const excluded: RankedCandidate[] = [];

  for (const profile of candidates) {
    if (profile.userId === viewer.userId) continue;
    const distanceKm = approxDistanceKm(viewer.location, profile.location);
    const hard = evaluateHardFilters(profile, prefs, distanceKm);
    const score = scoreCandidate(viewer, prefs, profile, distanceKm, now);
    const compatibility = buildCompatibility(viewer, profile);
    const ranked = { profile, distanceKm, hard, score, compatibility, reasons: buildReasons(viewer, profile, compatibility, distanceKm) };
    (hard.passed ? eligible : excluded).push(ranked);
  }

  const byScore = (a: RankedCandidate, b: RankedCandidate) =>
    b.score.total - a.score.total || (b.profile.lastActiveAt ?? '').localeCompare(a.profile.lastActiveAt ?? '');
  eligible.sort(byScore);
  excluded.sort(byScore);
  return { eligible, excluded };
}
