import type { Preferences, User } from '../../domain/types';
import { daysAgo } from '../../utils/time';
import { createMockMatches, createMockMessages } from './conversations';
import { CURRENT_USER_ID, createCurrentUserProfile, createMockProfiles } from './profiles';

export { CURRENT_USER_ID } from './profiles';

export function createCurrentUser(now = Date.now()): User {
  return {
    id: CURRENT_USER_ID,
    createdAt: daysAgo(14, now),
    lastActiveAt: new Date(now).toISOString(),
    status: 'active',
    onboardingComplete: true,
    profileId: 'p-alex',
  };
}

export function createCurrentPreferences(): Preferences {
  return {
    userId: CURRENT_USER_ID,
    interestedIn: ['woman'],
    age: { min: 23, max: 33, mode: 'preference' },
    distance: { preferredKm: 30, maxKm: 60 },
    intents: { values: ['long_term', 'long_term_open_short'], mode: 'preference' },
    smoking: { values: ['never', 'rarely'], mode: 'preference' },
    drinking: null,
    children: null,
    wantsChildren: null,
    religion: null,
  };
}

/** The full seed used on first launch and by "reset demo data". */
export function createSeed(now = Date.now()) {
  const iso = new Date(now).toISOString();
  return {
    user: createCurrentUser(now),
    preferences: createCurrentPreferences(),
    profiles: [createCurrentUserProfile(iso), ...createMockProfiles(iso)],
    matches: createMockMatches(now),
    messages: createMockMessages(now),
  };
}

export type Seed = ReturnType<typeof createSeed>;
