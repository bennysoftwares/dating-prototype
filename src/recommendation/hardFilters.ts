import { DATING_INTENT_INFO } from '../domain/intent';
import { GENDER_OPTIONS } from '../domain/profileOptions';
import type { FilterRule, Preferences, Profile } from '../domain/types';
import { profileAge } from '../utils/profileFormat';
import { visibleChildren, visibleDrinking, visibleReligion, visibleSmoking, visibleWantsChildren } from './fields';
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
  ];

  return { passed: checks.every((c) => c.passed), checks };
}
