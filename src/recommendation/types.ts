import type { Profile } from '../domain/types';

/** One hard-filter check. Every check is recorded so the debug panel can show what was tested. */
export interface HardCheck {
  id: string;
  label: string;
  /** False only when this check excludes the person. Checks that don't apply pass. */
  passed: boolean;
  /** Whether the check was actually enforced (soft preferences are recorded but never exclude). */
  applied: boolean;
  detail: string;
}

export interface HardFilterResult {
  passed: boolean;
  checks: HardCheck[];
}

/** One ranking signal. Raw numbers are for the developer panel only, never shown to users. */
export interface ScoreComponent {
  id: string;
  label: string;
  points: number;
  max: number;
  detail: string;
}

export interface SoftPreferenceResult {
  label: string;
  outcome: 'matched' | 'missed' | 'unknown';
  detail: string;
}

export interface ScoreResult {
  total: number;
  components: ScoreComponent[];
  softPreferences: SoftPreferenceResult[];
}

export interface DifferenceItem {
  topic: string;
  mine: string;
  theirs: string;
}

/** Human-language compatibility. Differences are neutral, not negative. */
export interface Compatibility {
  shared: string[];
  aligned: string[];
  different: DifferenceItem[];
}

export interface RankedCandidate {
  profile: Profile;
  distanceKm: number;
  hard: HardFilterResult;
  score: ScoreResult;
  compatibility: Compatibility;
  /** Short, human reasons for showing this person, most relevant first. */
  reasons: string[];
}

export interface RankingResult {
  /** Passed every hard filter, best first. */
  eligible: RankedCandidate[];
  /** Failed at least one hard filter. Never shown in discovery. */
  excluded: RankedCandidate[];
}
