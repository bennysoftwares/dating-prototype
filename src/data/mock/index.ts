import type { Preferences, User } from '../../domain/types';
import { daysAgo } from '../../utils/time';
import { createMockMatches, createMockMessages } from './conversations';
import { CURRENT_PROFILE_ID, CURRENT_USER_ID, createMockProfiles } from './profiles';

export { CURRENT_PROFILE_ID, CURRENT_USER_ID, createDemoProfile } from './profiles';

/** A brand-new account that still needs to complete onboarding. */
export function createCurrentUser(now = Date.now()): User {
  return {
    id: CURRENT_USER_ID,
    createdAt: daysAgo(14, now),
    lastActiveAt: new Date(now).toISOString(),
    status: 'active',
    onboardingComplete: false,
    profileId: CURRENT_PROFILE_ID,
  };
}

/** Preferences that go with the demo profile (Alex). */
export function createDemoPreferences(): Preferences {
  return {
    userId: CURRENT_USER_ID,
    interestedIn: ['woman'],
    age: { min: 23, max: 32, mode: 'preference' },
    distance: { preferredKm: 30, maxKm: 60 },
    intents: null,
    smoking: { values: ['never', 'rarely'], mode: 'preference' },
    drinking: null,
    children: null,
    wantsChildren: { values: ['wants', 'open', 'unsure'], mode: 'preference' },
    religion: null,
  };
}

/** The full seed used on first launch and by "reset demo data". */
export function createSeed(now = Date.now()) {
  const iso = new Date(now).toISOString();
  return {
    user: createCurrentUser(now),
    preferences: null as Preferences | null,
    profiles: createMockProfiles(iso),
    matches: createMockMatches(now),
    messages: createMockMessages(now),
  };
}

export type Seed = ReturnType<typeof createSeed>;
