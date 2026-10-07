import { getInterest } from '../domain/interest';
import type { FilterRule, Preferences, Profile } from '../domain/types';
import { profileAge } from '../utils/profileFormat';
import {
  visibleChildren,
  visibleDrinking,
  visibleEducationLevel,
  visibleHeight,
  visiblePolitics,
  visibleReligion,
  visibleSmoking,
  visibleWantsChildren,
} from './fields';
import { intentAlignment } from './intent';
import type { ScoreComponent, ScoreResult, SoftPreferenceResult } from './types';

/**
 * Transparent, rules-based weights. Tune here; every component is visible in the
 * developer panel. Totals are only used for ordering, never shown to users.
 */
export const WEIGHTS = {
  intent: { same: 25, close: 16, open: 10, apart: 6, opposite: 0 },
  distanceMax: 15,
  distanceFloor: 3,
  ageMax: 10,
  agePenaltyPerYear: 3,
  perSharedInterest: 4,
  sharedInterestsMax: 20,
  softMatch: 6,
  softMiss: -6,
  bothNonSmokers: 3,
  childrenSame: 5,
  childrenFlexible: 2,
  childrenConflict: -8,
  freshness: { day: 8, threeDays: 5, week: 2, month: 0, stale: -5 },
  depthMax: 4,
} as const;

const DAY = 86_400_000;

function softRule<T extends string>(label: string, rule: FilterRule<T> | null, value: T | undefined): SoftPreferenceResult | null {
  if (!rule || rule.mode !== 'preference') return null;
  if (value === undefined) return { label, outcome: 'unknown', detail: 'Not shared' };
  const ok = rule.values.includes(value);
  return { label, outcome: ok ? 'matched' : 'missed', detail: `${value}${ok ? ' matches' : ' is outside'} your preference` };
}

function softHeight(prefs: Preferences, height: number | undefined): SoftPreferenceResult | null {
  const rule = prefs.height;
  if (!rule || rule.mode !== 'preference') return null;
  if (height === undefined) return { label: 'Height', outcome: 'unknown', detail: 'Not shared' };
  const ok = height >= rule.minCm && height <= rule.maxCm;
  return { label: 'Height', outcome: ok ? 'matched' : 'missed', detail: `${height} cm${ok ? ' matches' : ' is outside'} your preference` };
}

export function scoreCandidate(viewer: Profile, prefs: Preferences, candidate: Profile, distanceKm: number, now = Date.now()): ScoreResult {
  const components: ScoreComponent[] = [];

  // Dating intention
  const alignment = intentAlignment(viewer.intent, candidate.intent);
  components.push({ id: 'intent', label: 'Dating intention', points: WEIGHTS.intent[alignment], max: WEIGHTS.intent.same, detail: alignment });

  // Distance: full points inside the preferred distance, tapering to the hard maximum.
  const { preferredKm, maxKm } = prefs.distance;
  let distancePts: number = WEIGHTS.distanceMax;
  if (distanceKm > preferredKm) {
    const span = Math.max(1, maxKm - preferredKm);
    const t = Math.min(1, (distanceKm - preferredKm) / span);
    distancePts = Math.round(WEIGHTS.distanceMax - t * (WEIGHTS.distanceMax - WEIGHTS.distanceFloor));
  }
  components.push({ id: 'distance', label: 'Distance', points: distancePts, max: WEIGHTS.distanceMax, detail: `${distanceKm} km (preferred ${preferredKm}, max ${maxKm})` });

  // Age: soft preference ranking (dealbreakers already filtered).
  const age = profileAge(candidate);
  const ageMax = prefs.age.max >= 80 ? Infinity : prefs.age.max;
  const yearsOutside = age < prefs.age.min ? prefs.age.min - age : age > ageMax ? age - ageMax : 0;
  const agePts = Math.max(0, WEIGHTS.ageMax - yearsOutside * WEIGHTS.agePenaltyPerYear);
  components.push({ id: 'age', label: 'Age preference', points: agePts, max: WEIGHTS.ageMax, detail: yearsOutside ? `${age}, ${yearsOutside} yr outside range` : `${age}, within range` });

  // Shared interests
  const shared = candidate.interests.filter((i) => viewer.interests.includes(i));
  components.push({
    id: 'interests',
    label: 'Shared interests',
    points: Math.min(WEIGHTS.sharedInterestsMax, shared.length * WEIGHTS.perSharedInterest),
    max: WEIGHTS.sharedInterestsMax,
    detail: shared.length ? shared.map((i) => getInterest(i).label).join(', ') : 'None',
  });

  // Soft preferences ("I'd prefer this, but I'm open")
  const softPreferences = [
    softRule('Dating intention', prefs.intents, candidate.intent),
    softRule('Smoking', prefs.smoking, visibleSmoking(candidate)),
    softRule('Drinking', prefs.drinking, visibleDrinking(candidate)),
    softRule('Has children', prefs.children, visibleChildren(candidate)),
    softRule('Wants children', prefs.wantsChildren, visibleWantsChildren(candidate)),
    softRule('Religion', prefs.religion, visibleReligion(candidate)),
    softRule('Politics', prefs.politics ?? null, visiblePolitics(candidate)),
    softRule('Education', prefs.education ?? null, visibleEducationLevel(candidate)),
    softHeight(prefs, visibleHeight(candidate)),
  ].filter((r): r is SoftPreferenceResult => r !== null);
  const softPts = softPreferences.reduce((sum, r) => sum + (r.outcome === 'matched' ? WEIGHTS.softMatch : r.outcome === 'missed' ? WEIGHTS.softMiss : 0), 0);
  components.push({
    id: 'soft',
    label: 'Soft preferences',
    points: softPts,
    max: softPreferences.length * WEIGHTS.softMatch,
    detail: softPreferences.length ? softPreferences.map((r) => `${r.label}: ${r.outcome}`).join(', ') : 'None set',
  });

  // Lifestyle compatibility, independent of stated preferences.
  let lifestyle = 0;
  const notes: string[] = [];
  if (viewer.smoking === 'never' && visibleSmoking(candidate) === 'never') {
    lifestyle += WEIGHTS.bothNonSmokers;
    notes.push('both non-smokers');
  }
  const theirPlan = visibleWantsChildren(candidate);
  if (theirPlan) {
    const mine = viewer.wantsChildren;
    if (mine === theirPlan) {
      lifestyle += WEIGHTS.childrenSame;
      notes.push('same plans for children');
    } else if ((mine === 'wants' && theirPlan === 'does_not_want') || (mine === 'does_not_want' && theirPlan === 'wants')) {
      lifestyle += WEIGHTS.childrenConflict;
      notes.push('different plans for children');
    } else if (mine === 'open' || theirPlan === 'open') {
      lifestyle += WEIGHTS.childrenFlexible;
      notes.push('flexible on children');
    }
  }
  components.push({ id: 'lifestyle', label: 'Lifestyle fit', points: lifestyle, max: WEIGHTS.bothNonSmokers + WEIGHTS.childrenSame, detail: notes.join(', ') || 'Neutral' });

  // Activity freshness: people who are actually around are more likely to reply.
  const idleDays = candidate.lastActiveAt ? (now - new Date(candidate.lastActiveAt).getTime()) / DAY : 30;
  const f = WEIGHTS.freshness;
  const freshPts = idleDays <= 1 ? f.day : idleDays <= 3 ? f.threeDays : idleDays <= 7 ? f.week : idleDays <= 30 ? f.month : f.stale;
  components.push({ id: 'freshness', label: 'Recently active', points: freshPts, max: f.day, detail: `${Math.round(idleDays * 10) / 10} days since active` });

  // Profile depth: a little credit for giving people something to respond to.
  const depth = Math.min(WEIGHTS.depthMax, (candidate.prompts.length >= 3 ? 2 : 0) + (candidate.bio ? 1 : 0) + (candidate.photos.length >= 4 ? 1 : 0));
  components.push({ id: 'depth', label: 'Profile depth', points: depth, max: WEIGHTS.depthMax, detail: `${candidate.prompts.length} prompts, ${candidate.photos.length} photos${candidate.bio ? ', bio' : ''}` });

  return { total: components.reduce((s, c) => s + c.points, 0), components, softPreferences };
}
