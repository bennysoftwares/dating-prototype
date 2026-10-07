import { DATING_INTENT_INFO } from '../domain/intent';
import { getInterest } from '../domain/interest';
import { DRINKING_DISPLAY, SMOKING_DISPLAY, WANTS_CHILDREN_DISPLAY } from '../domain/profileOptions';
import type { Profile } from '../domain/types';
import { visibleDrinking, visiblePolitics, visibleReligion, visibleSmoking, visibleWantsChildren } from './fields';
import { bothLongTermLeaning, intentAlignment, SAME_INTENT_REASON } from './intent';
import type { Compatibility, DifferenceItem } from './types';

/**
 * Plain-language compatibility between the viewer and a candidate.
 * Only uses fields the candidate chose to show. No percentages, ever.
 */
export function buildCompatibility(viewer: Profile, candidate: Profile): Compatibility {
  const shared = candidate.interests.filter((i) => viewer.interests.includes(i)).map((i) => getInterest(i).label);
  const aligned: string[] = [];
  const different: DifferenceItem[] = [];

  const alignment = intentAlignment(viewer.intent, candidate.intent);
  if (alignment === 'same') aligned.push(DATING_INTENT_INFO[candidate.intent].label);
  else if (bothLongTermLeaning(viewer.intent, candidate.intent)) aligned.push('Both open to long-term');
  else different.push({ topic: 'Looking for', mine: DATING_INTENT_INFO[viewer.intent].label, theirs: DATING_INTENT_INFO[candidate.intent].label });

  const smoking = visibleSmoking(candidate);
  if (smoking) {
    if (smoking === viewer.smoking) aligned.push(SMOKING_DISPLAY[smoking]);
    else different.push({ topic: 'Smoking', mine: SMOKING_DISPLAY[viewer.smoking], theirs: SMOKING_DISPLAY[smoking] });
  }

  const drinking = visibleDrinking(candidate);
  if (drinking) {
    if (drinking === viewer.drinking) aligned.push(DRINKING_DISPLAY[drinking]);
    else different.push({ topic: 'Drinking', mine: DRINKING_DISPLAY[viewer.drinking], theirs: DRINKING_DISPLAY[drinking] });
  }

  const wants = visibleWantsChildren(candidate);
  if (wants) {
    if (wants === viewer.wantsChildren) aligned.push(WANTS_CHILDREN_DISPLAY[wants]);
    else different.push({ topic: 'Children', mine: WANTS_CHILDREN_DISPLAY[viewer.wantsChildren], theirs: WANTS_CHILDREN_DISPLAY[wants] });
  }

  const religion = visibleReligion(candidate);
  if (religion && viewer.religion) {
    if (religion === viewer.religion) aligned.push(religion);
    else different.push({ topic: 'Beliefs', mine: viewer.religion, theirs: religion });
  }

  const politics = visiblePolitics(candidate);
  if (politics && viewer.politics) {
    if (politics === viewer.politics) aligned.push(`${politics} politics`);
    else different.push({ topic: 'Politics', mine: viewer.politics, theirs: politics });
  }

  const sharedLanguage = candidate.languages.find((l) => l !== 'English' && viewer.languages.includes(l));
  if (sharedLanguage) aligned.push(`Both speak ${sharedLanguage}`);

  return { shared, aligned, different };
}

/** The few most relevant reasons, for cards and summaries. */
export function buildReasons(viewer: Profile, candidate: Profile, compatibility: Compatibility, distanceKm: number): string[] {
  const reasons: string[] = [];
  const alignment = intentAlignment(viewer.intent, candidate.intent);
  if (alignment === 'same') reasons.push(SAME_INTENT_REASON[candidate.intent]);
  else if (bothLongTermLeaning(viewer.intent, candidate.intent)) reasons.push('You’re both open to something long-term');

  const n = compatibility.shared.length;
  if (n >= 2) reasons.push(`${n} shared interests`);
  else if (n === 1) reasons.push(`You both like ${compatibility.shared[0]!.toLowerCase()}`);

  if (viewer.smoking === 'never' && visibleSmoking(candidate) === 'never') reasons.push('Neither of you smokes');
  if (viewer.wantsChildren === 'wants' && visibleWantsChildren(candidate) === 'wants') reasons.push('You both want children');

  reasons.push(`${distanceKm} km away`);
  return reasons;
}
