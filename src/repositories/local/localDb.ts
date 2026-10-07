import { createDemoPreferences, createDemoProfile, createSeed } from '../../data/mock';
import type { Match, Message, Preferences, Profile, User } from '../../domain/types';
import { storage } from '../../storage/storage';
import { STORAGE_KEYS } from '../../storage/keys';
import { sleep } from '../../utils/sleep';

/**
 * Bump when the seed or stored shapes change. Old data is discarded and
 * re-seeded instead of crashing the app.
 *
 * v2: onboarding. New accounts start un-onboarded; own profile id is "p-me".
 */
export const DB_SCHEMA_VERSION = 2;

interface DbMeta {
  schemaVersion: number;
  seededAt: string;
}

const isArray = (v: unknown): v is unknown[] => Array.isArray(v);
const isObject = (v: unknown): v is object => typeof v === 'object' && v !== null;

const K = STORAGE_KEYS;

export const localDb = {
  ensureSeeded(): void {
    const meta = storage.get<DbMeta | null>(K.dbMeta.key, null);
    if (meta?.schemaVersion === DB_SCHEMA_VERSION && this.user()) return;
    this.reset();
  },

  /** Wipe app data back to a fresh, un-onboarded account. Keeps theme. */
  reset(): void {
    const seed = createSeed();
    storage.set(K.dbUser.key, seed.user, K.dbUser.version);
    storage.set(K.dbPreferences.key, seed.preferences, K.dbPreferences.version);
    storage.set(K.dbProfiles.key, seed.profiles, K.dbProfiles.version);
    storage.set(K.dbMatches.key, seed.matches, K.dbMatches.version);
    storage.set(K.dbMessages.key, seed.messages, K.dbMessages.version);
    storage.remove(K.onboardingDraft.key);
    storage.remove(K.onboardingPhotos.key);
    storage.set<DbMeta>(K.dbMeta.key, { schemaVersion: DB_SCHEMA_VERSION, seededAt: new Date().toISOString() });
  },

  /** Skip onboarding with the preconfigured demo user (Alex). */
  loadDemoUser(): void {
    const user = this.user();
    if (!user) this.reset();
    const profile = createDemoProfile(new Date().toISOString());
    this.writeOwnProfile(profile);
    this.writePreferences(createDemoPreferences());
    this.writeUser({ ...this.user()!, onboardingComplete: true });
    storage.remove(K.onboardingDraft.key);
    storage.remove(K.onboardingPhotos.key);
  },

  /** Send the account back to the start of onboarding with a blank draft. */
  restartOnboarding(): void {
    const user = this.user();
    if (!user) return this.reset();
    this.writeUser({ ...user, onboardingComplete: false });
    storage.set(K.dbProfiles.key, this.profiles().filter((p) => p.userId !== user.id), K.dbProfiles.version);
    storage.set(K.dbPreferences.key, null, K.dbPreferences.version);
    storage.remove(K.onboardingDraft.key);
    storage.remove(K.onboardingPhotos.key);
  },

  meta(): DbMeta | null {
    return storage.get<DbMeta | null>(K.dbMeta.key, null);
  },

  user(): User | null {
    return storage.get<User | null>(K.dbUser.key, null, { validate: (v): v is User => isObject(v) });
  },
  preferences(): Preferences | null {
    return storage.get<Preferences | null>(K.dbPreferences.key, null, { validate: (v): v is Preferences => isObject(v) });
  },
  profiles(): Profile[] {
    return storage.get<Profile[]>(K.dbProfiles.key, [], { validate: (v): v is Profile[] => isArray(v) });
  },
  matches(): Match[] {
    return storage.get<Match[]>(K.dbMatches.key, [], { validate: (v): v is Match[] => isArray(v) });
  },
  messages(): Message[] {
    return storage.get<Message[]>(K.dbMessages.key, [], { validate: (v): v is Message[] => isArray(v) });
  },

  writeUser(user: User): boolean {
    return storage.set(K.dbUser.key, user, K.dbUser.version);
  },
  writePreferences(preferences: Preferences): boolean {
    return storage.set(K.dbPreferences.key, preferences, K.dbPreferences.version);
  },
  /** Upsert the current user's profile. */
  writeOwnProfile(profile: Profile): boolean {
    const others = this.profiles().filter((p) => p.id !== profile.id && p.userId !== profile.userId);
    return storage.set(K.dbProfiles.key, [profile, ...others], K.dbProfiles.version);
  },
};

/** Simulated network latency so loading states are exercised during development. */
export const SIMULATED_LATENCY_MS = 180;

export async function withLatency<T>(fn: () => T): Promise<T> {
  await sleep(SIMULATED_LATENCY_MS);
  return fn();
}
