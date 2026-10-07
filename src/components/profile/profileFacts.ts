import { getInterest } from '../../domain/interest';
import {
  CHILDREN_DISPLAY,
  DRINKING_DISPLAY,
  SMOKING_DISPLAY,
  WANTS_CHILDREN_DISPLAY,
} from '../../domain/profileOptions';
import type { Profile, VisibleField } from '../../domain/types';
import { formatHeight } from '../../utils/profileFormat';
import type { IconName } from '../ui/Icon';

export interface Fact {
  key: string;
  icon: IconName;
  label: string;
}

/** A field is shown unless its owner explicitly hid it. */
export const isVisible = (profile: Pick<Profile, 'visibility'>, field: VisibleField) => profile.visibility[field] !== false;

export function basicFacts(p: Profile): Fact[] {
  const facts: Fact[] = [];
  if (p.heightCm && isVisible(p, 'height')) facts.push({ key: 'height', icon: 'ruler', label: formatHeight(p.heightCm) });
  if (p.job && isVisible(p, 'job')) facts.push({ key: 'job', icon: 'briefcase', label: p.job });
  if (p.education && isVisible(p, 'education')) facts.push({ key: 'education', icon: 'graduation', label: p.education });
  if (p.languages.length) facts.push({ key: 'languages', icon: 'globe', label: p.languages.join(', ') });
  return facts;
}

export function lifestyleFacts(p: Profile): Fact[] {
  const facts: Fact[] = [];
  if (isVisible(p, 'drinking')) facts.push({ key: 'drinking', icon: 'wine', label: DRINKING_DISPLAY[p.drinking] });
  if (isVisible(p, 'smoking')) facts.push({ key: 'smoking', icon: 'smoke', label: SMOKING_DISPLAY[p.smoking] });
  if (isVisible(p, 'children')) {
    facts.push({ key: 'children', icon: 'home', label: CHILDREN_DISPLAY[p.children] });
    facts.push({ key: 'wantsChildren', icon: 'baby', label: WANTS_CHILDREN_DISPLAY[p.wantsChildren] });
  }
  if (p.religion && isVisible(p, 'religion')) facts.push({ key: 'religion', icon: 'sparkle', label: p.religion });
  if (p.politics && isVisible(p, 'politics')) facts.push({ key: 'politics', icon: 'flag', label: p.politics });
  return facts;
}

export const interestLabels = (p: Profile) => p.interests.map((id) => getInterest(id).label);
