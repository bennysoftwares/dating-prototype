import type { Plan, User } from './types';

/**
 * What each plan includes. Exactly two plans exist: Free and Premium.
 *
 * Free is a complete dating experience: profile, discovery, likes, matching, messaging,
 * filters and dealbreakers, privacy, verification, date planning and every safety tool.
 * Premium will sell convenience and extra control, never access to people, ranking
 * visibility or safety. There are no consumables (no Roses, Super Likes, Boosts, coins).
 *
 * Only `rewind` is gated in the prototype. Payments are not implemented.
 */
export type Feature = 'rewind';

const PREMIUM_ONLY: ReadonlySet<Feature> = new Set(['rewind']);

export function planOf(user: Pick<User, 'plan'> | null | undefined): Plan {
  return user?.plan === 'premium' ? 'premium' : 'free';
}

export function can(user: Pick<User, 'plan'> | null | undefined, feature: Feature): boolean {
  return !PREMIUM_ONLY.has(feature) || planOf(user) === 'premium';
}

/** Copy used in Settings. Honest, short, no pressure. */
export const PREMIUM_FEATURES = ['Rewind your last pass or like (one step)'];
export const ALWAYS_FREE = [
  'Creating your profile and every dealbreaker that matters',
  'Discovery, likes, matching and messaging',
  'Blocking, reporting, unmatching and every safety tool',
  'Verification, date planning and Share date',
];
