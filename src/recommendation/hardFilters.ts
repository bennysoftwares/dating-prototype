import { DATING_INTENT_INFO } from '../domain/intent';
import { EDUCATION_LEVEL_OPTIONS, GENDER_OPTIONS } from '../domain/profileOptions';
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
import type { HardCheck, HardFilterResult } from './types';

const AGE_OPEN_ENDED = 80;

function ruleCheck<T extends string>(
  id: string,
  label: string,
  rule: FilterRule<T> | null,
  value: T | undefined,
  describe: (v: T) => string = (v) => v,
): HardCheck {
  if (!rule) return { id, label, passed: true, applied: false, detail: 'No preference set' };
  if (rule.mode !== 'dealbreaker') return { id, label, passed: true, applied: false, detail: 'Preference only, affects ranking' };
  if (value === undefined) return { id, label, passed: false, applied: true, detail: 'Not shared on their profile, so it can’t be confirmed' };
  const ok = rule.values.includes(value);
  return { id, label, passed: ok, applied: true, detail: ok ? `${describe(value)} is accepted` : `${describe(value)} is outside your dealbreaker` };
}

const EDUCATION_LABEL = Object.fromEntries(EDUCATION_LEVEL_OPTIONS.map((o) => [o.value, o.label])) as Record<string, string>;

function heightCheck(prefs: Preferences, height: number | undefined): HardCheck {
  const rule = prefs.height;
  const base = { id: 'height', label: 'Height' };
  if (!rule) return { ...base, passed: true, applied: false, detail: 'No preference set' };
  if (rule.mode !== 'dealbreaker') return { ...base, passed: true, applied: false, detail: 'Preference only, affects ranking' };
  if (height === undefined) return { ...base, passed: false, applied: true, detail: 'Not shared on their profile, so it can’t be confirmed' };
  const ok = height >= rule.minCm && height <= rule.maxCm;
  return { ...base, passed: ok, applied: true, detail: `${height} cm, range ${rule.minCm}–${rule.maxCm} cm` };
}

/** Verified only, has a bio, minimum photos. Only recorded when switched on. */
function profileQualityChecks(candidate: Profile, prefs: Preferences): HardCheck[] {
  const checks: HardCheck[] = [];
  if (prefs.verifiedOnly) {
    const verified = candidate.verification?.photo === 'verified';
    checks.push({ id: 'verified', label: 'Verified profiles only', applied: true, passed: verified, detail: verified ? 'Photo verified' : 'Not photo verified' });
  }
  if (prefs.requireBio) {
    const hasBio = Boolean(candidate.bio?.trim());
    checks.push({ id: 'bio', label: 'Has a bio', applied: true, passed: hasBio, detail: hasBio ? 'Has a bio' : 'No bio' });
  }
  if ((prefs.minPhotos ?? 1) > 1) {
    const count = candidate.photos.length;
    checks.push({ id: 'photos', label: 'Minimum photos', applied: true, passed: count >= prefs.minPhotos!, detail: `${count} photos, minimum ${prefs.minPhotos}` });
  }
  return checks;
}

/**
 * Dealbreakers are applied before any scoring. Anyone who fails one is never shown.
 * The hard distance maximum and who-you-want-to-meet are always dealbreakers.
 */
export function evaluateHardFilters(candidate: Profile, prefs: Preferences, distanceKm: number): HardFilterResult {
  const age = profileAge(candidate);
  const ageMax = prefs.age.max >= AGE_OPEN_ENDED ? Infinity : prefs.age.max;
  const inAge = age >= prefs.age.min && age <= ageMax;
  const genderLabel = GENDER_OPTIONS.find((g) => g.value === candidate.gender)?.label ?? candidate.gender;

  const checks: HardCheck[] = [
    {
      id: 'gender',
      label: 'Who you want to meet',
      applied: true,
      passed: prefs.interestedIn.includes(candidate.gender),
      detail: `${genderLabel}${prefs.interestedIn.includes(candidate.gender) ? ' is' : ' is not'} in your “show me” choices`,
    },
    {
      id: 'distance',
      label: 'Hard maximum distance',
      applied: true,
      passed: distanceKm <= prefs.distance.maxKm,
      detail: `${distanceKm} km away, limit ${prefs.distance.maxKm} km`,
    },
    {
      id: 'age',
      label: 'Age range',
      applied: prefs.age.mode === 'dealbreaker',
      passed: prefs.age.mode !== 'dealbreaker' || inAge,
      detail: `${age}, range ${prefs.age.min}–${ageMax === Infinity ? `${AGE_OPEN_ENDED}+` : prefs.age.max}${prefs.age.mode === 'dealbreaker' ? '' : ' (preference only)'}`,
    },
    ruleCheck('intent', 'Dating intention', prefs.intents, candidate.intent, (v) => DATING_INTENT_INFO[v].label),
    ruleCheck('smoking', 'Smoking', prefs.smoking, visibleSmoking(candidate), (v) => `Smokes ${v}`),
    ruleCheck('drinking', 'Drinking', prefs.drinking, visibleDrinking(candidate), (v) => `Drinks ${v}`),
    ruleCheck('children', 'Has children', prefs.children, visibleChildren(candidate)),
    ruleCheck('wantsChildren', 'Wants children', prefs.wantsChildren, visibleWantsChildren(candidate)),
    ruleCheck('religion', 'Religion', prefs.religion, visibleReligion(candidate)),
    ruleCheck('politics', 'Politics', prefs.politics ?? null, visiblePolitics(candidate)),
    ruleCheck('education', 'Education', prefs.education ?? null, visibleEducationLevel(candidate), (v) => EDUCATION_LABEL[v] ?? v),
    heightCheck(prefs, visibleHeight(candidate)),
    ...profileQualityChecks(candidate, prefs),
  ];

  return { passed: checks.every((c) => c.passed), checks };
}
