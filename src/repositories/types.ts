import type { ID, Match, Message, Preferences, Profile, User } from '../domain/types';

/**
 * Repository contracts used by the UI. The prototype implements them with
 * localStorage (`./local`). A Supabase (or other) implementation can replace
 * them later without touching screens or components.
 *
 * All methods are async on purpose, so the UI already handles loading and errors.
 */

export interface UserRepository {
  getCurrentUser(): Promise<User>;
  /** Null until onboarding has been completed. */
  getPreferences(): Promise<Preferences | null>;
  savePreferences(preferences: Preferences): Promise<Preferences>;
  /** Saves the finished profile and preferences and marks onboarding complete. */
  completeOnboarding(profile: Profile, preferences: Preferences): Promise<User>;
}

export interface ProfileRepository {
  getProfile(profileId: ID): Promise<Profile | null>;
  getProfileByUserId(userId: ID): Promise<Profile | null>;
  /** The signed-in user's own profile, or null before onboarding. */
  getCurrentProfile(): Promise<Profile | null>;
  /** Create or replace the signed-in user's own profile. */
  saveCurrentProfile(profile: Profile): Promise<Profile>;
  /** Every profile except the current user's. Ranking happens elsewhere. */
  listCandidates(): Promise<Profile[]>;
}

export interface MatchRepository {
  listMatches(): Promise<Match[]>;
  listMessages(matchId: ID): Promise<Message[]>;
}

export interface Repositories {
  users: UserRepository;
  profiles: ProfileRepository;
  matches: MatchRepository;
}

/** Thrown when a write could not be persisted (e.g. device storage is full). */
export class StorageFullError extends Error {
  constructor() {
    super("There isn't enough space on this device to save that. Try removing a photo or using smaller images.");
    this.name = 'StorageFullError';
  }
}
