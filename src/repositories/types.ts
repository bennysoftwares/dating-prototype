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
  getPreferences(): Promise<Preferences>;
}

export interface ProfileRepository {
  getProfile(profileId: ID): Promise<Profile | null>;
  getProfileByUserId(userId: ID): Promise<Profile | null>;
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
