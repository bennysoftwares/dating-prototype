import type { Profile, VisibleField } from '../domain/types';

/**
 * A candidate's field only counts as known if they chose to show it.
 * Hidden fields are never used to explain a match, so private answers can't leak
 * through compatibility text. For dealbreakers, unknown means "can't confirm" and excludes.
 */
export function visibleValue<K extends keyof Profile>(p: Profile, key: K, field: VisibleField): Profile[K] | undefined {
  if (p.visibility[field] === false) return undefined;
  const v = p[key];
  return v === '' ? undefined : v;
}

export const visibleSmoking = (p: Profile) => visibleValue(p, 'smoking', 'smoking');
export const visibleDrinking = (p: Profile) => visibleValue(p, 'drinking', 'drinking');
export const visibleChildren = (p: Profile) => visibleValue(p, 'children', 'children');
export const visibleWantsChildren = (p: Profile) => visibleValue(p, 'wantsChildren', 'children');
export const visibleReligion = (p: Profile) => visibleValue(p, 'religion', 'religion');
export const visiblePolitics = (p: Profile) => visibleValue(p, 'politics', 'politics');
export const visibleHeight = (p: Profile) => visibleValue(p, 'heightCm', 'height');
export const visibleEducationLevel = (p: Profile) => visibleValue(p, 'educationLevel', 'education');
