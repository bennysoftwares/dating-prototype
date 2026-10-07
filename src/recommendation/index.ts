import type { Preferences, Profile } from '../domain/types';

/**
 * Recommendation logic lives here, isolated from the UI.
 *
 * Part 3 replaces this pass-through with a transparent, rules-based ranker:
 * hard dealbreakers filter first, then soft preferences, intent alignment,
 * distance, shared interests and freshness shape the order. The output will
 * carry human-language reasons, never fake percentages.
 */
export interface RankedCandidate {
  profile: Profile;
}

export function rankCandidates(candidates: Profile[], _viewer: Profile, _preferences: Preferences): RankedCandidate[] {
  return candidates.map((profile) => ({ profile }));
}
