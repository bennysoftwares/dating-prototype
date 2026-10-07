import { createDemoPreferences, createDemoProfile, createMockConnections, createSeed } from '../../data/mock';
import type { DailyPicks, Like, Match, Message, Pass, Preferences, Profile, User } from '../../domain/types';
import { storage } from '../../storage/storage';
import { STORAGE_KEYS } from '../../storage/keys';
import { sleep } from '../../utils/sleep';

/**
 * Bump when the seed or stored shapes change. Old data is discarded and
 * re-seeded instead of crashing the app.
 *
 * v2: onboarding. New accounts start un-onboarded; own profile id is "p-me".
 * v3: discovery. ~28 mock profiles with activity data; likes, passes, daily picks.
 * v4: matching & messaging. Received likes, match contexts, read markers, drafts.
 */
export const DB_SCHEMA_VERSION = 4;

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
    if ((meta?.schemaVersion === 2 || meta?.schemaVersion === 3) && this.user()) return this.migrate(meta.schemaVersion);
    this.reset();
  },

  /**
   * Keep the user's account, own profile and preferences (and, from v3, their
   * discovery history); refresh everyone else and seed Part 4 connections.
   */
  migrate(from: number): void {
    const seed = createSeed();
    const user = this.user()!;
    const own = this.profiles().find((p) => p.userId === user.id);
    storage.set(K.dbProfiles.key, own ? [own, ...seed.profiles] : seed.profiles, K.dbProfiles.version);
    if (from < 3) this.resetDiscovery();
    else this.writeLikes(this.likes().filter((l) => l.fromUserId === user.id));
    this.resetConnections();
    storage.set<DbMeta>(K.dbMeta.key, { schemaVersion: DB_SCHEMA_VERSION, seededAt: new Date().toISOString() });
  },

  /**
   * Replace matches, messages, received likes and drafts with fresh mock data
   * built around the user's own profile. Sent likes and passes are kept.
   */
  resetConnections(): void {
    const user = this.user();
    const own = user && this.profiles().find((p) => p.id === user.profileId);
    const prefs = this.preferences();
    const sent = user ? this.likes().filter((l) => l.fromUserId === user.id) : [];
    storage.remove(K.drafts.key);
    if (!user || !own || !prefs || !user.onboardingComplete) {
      this.writeMatches([]);
      this.writeMessages([]);
      this.writeLikes(sent);
      return;
    }
    const decided = new Set([...sent.map((l) => l.toProfileId), ...this.passes().map((p) => p.toProfileId)]);
    const others = this.profiles().filter((p) => p.userId !== user.id);
    const seed = createMockConnections(own, prefs, others, decided);
    this.writeMatches(seed.matches);
    this.writeMessages(seed.messages);
    this.writeLikes([...sent, ...seed.receivedLikes]);
  },

  /** Clear the user's own likes, passes and today's picks. Likes received are kept. */
  resetDiscovery(): void {
    const me = this.user()?.id;
    storage.set(K.dbLikes.key, this.likes().filter((l) => me && l.fromUserId !== me), K.dbLikes.version);
    storage.set(K.dbPasses.key, [], K.dbPasses.version);
    storage.set(K.dbDailyPicks.key, null, K.dbDailyPicks.version);
  },

  /** Wipe app data back to a fresh, un-onboarded account. Keeps theme. */
  reset(): void {
    const seed = createSeed();
    storage.set(K.dbUser.key, seed.user, K.dbUser.version);
    storage.set(K.dbPreferences.key, seed.preferences, K.dbPreferences.version);
    storage.set(K.dbProfiles.key, seed.profiles, K.dbProfiles.version);
    storage.set(K.dbMatches.key, seed.matches, K.dbMatches.version);
    storage.set(K.dbMessages.key, seed.messages, K.dbMessages.version);
    this.resetDiscovery();
    storage.remove(K.drafts.key);
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
    this.resetDiscovery();
    this.resetConnections();
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
    this.resetDiscovery();
    this.resetConnections();
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
  likes(): Like[] {
    return storage.get<Like[]>(K.dbLikes.key, [], { validate: (v): v is Like[] => isArray(v) });
  },
  passes(): Pass[] {
    return storage.get<Pass[]>(K.dbPasses.key, [], { validate: (v): v is Pass[] => isArray(v) });
  },
  dailyPicks(): DailyPicks | null {
    return storage.get<DailyPicks | null>(K.dbDailyPicks.key, null, {
      validate: (v): v is DailyPicks | null => v === null || (isObject(v) && Array.isArray((v as DailyPicks).profileIds)),
    });
  },
  writeMatches(matches: Match[]): boolean {
    return storage.set(K.dbMatches.key, matches, K.dbMatches.version);
  },
  writeMessages(messages: Message[]): boolean {
    return storage.set(K.dbMessages.key, messages, K.dbMessages.version);
  },
  writeLikes(likes: Like[]): boolean {
    return storage.set(K.dbLikes.key, likes, K.dbLikes.version);
  },
  writePasses(passes: Pass[]): boolean {
    return storage.set(K.dbPasses.key, passes, K.dbPasses.version);
  },
  writeDailyPicks(daily: DailyPicks | null): boolean {
    return storage.set(K.dbDailyPicks.key, daily, K.dbDailyPicks.version);
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
