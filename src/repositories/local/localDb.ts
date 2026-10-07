import { createDemoPreferences, createDemoProfile, createMockConnections, createMockDates, createSeed } from '../../data/mock';
import type { Block, DailyPicks, DateFeedback, DatePlan, Like, Match, Message, Pass, Preferences, PrivacySettings, Profile, Report, User } from '../../domain/types';
import { storage } from '../../storage/storage';
import { STORAGE_KEYS } from '../../storage/keys';
import { sleep } from '../../utils/sleep';
import {
  isBlock,
  isDailyPicks,
  isDatePlan,
  isFeedback,
  isLike,
  isMatch,
  isMessage,
  isPass,
  isPreferences,
  isPrivacy,
  isProfile,
  isReport,
  isUser,
} from './guards';

/**
 * Bump when the seed or stored shapes change. Old data is discarded and
 * re-seeded instead of crashing the app.
 *
 * v2: onboarding. New accounts start un-onboarded; own profile id is "p-me".
 * v3: discovery. ~28 mock profiles with activity data; likes, passes, daily picks.
 * v4: matching & messaging. Received likes, match contexts, read markers, drafts.
 * v5: safety, privacy, verification, dates. Blocks, reports, date plans, private feedback.
 */
export const DB_SCHEMA_VERSION = 5;

interface DbMeta {
  schemaVersion: number;
  seededAt: string;
}

/** A stored list with every malformed record dropped (see guards.ts). */
function list<T>(key: string, guard: (v: unknown) => v is T): T[] {
  const raw = storage.get<unknown[]>(key, [], { validate: (v): v is unknown[] => Array.isArray(v) });
  return raw.filter(guard);
}

const K = STORAGE_KEYS;

export const localDb = {
  ensureSeeded(): void {
    const meta = storage.get<DbMeta | null>(K.dbMeta.key, null);
    if (meta?.schemaVersion === DB_SCHEMA_VERSION && this.user()) return;
    if (meta?.schemaVersion === 4 && this.user()) return this.migrateFromV4();
    if ((meta?.schemaVersion === 2 || meta?.schemaVersion === 3) && this.user()) return this.migrate(meta.schemaVersion);
    this.reset();
  },

  /** v4 → v5: keep everything the user did; refresh mock people so they gain Part 5 fields. */
  migrateFromV4(): void {
    const seed = createSeed();
    const user = this.user()!;
    const own = this.profiles().find((p) => p.userId === user.id);
    storage.set(K.dbProfiles.key, own ? [own, ...seed.profiles] : seed.profiles, K.dbProfiles.version);
    this.resetSafetyAndDates();
    storage.set<DbMeta>(K.dbMeta.key, { schemaVersion: DB_SCHEMA_VERSION, seededAt: new Date().toISOString() });
  },

  /** Clear blocks, reports, dates, feedback and privacy settings. */
  resetSafetyAndDates(): void {
    storage.set(K.dbBlocks.key, [], K.dbBlocks.version);
    storage.set(K.dbReports.key, [], K.dbReports.version);
    storage.set(K.dbDateFeedback.key, [], K.dbDateFeedback.version);
    storage.set(K.dbPrivacy.key, { hideFromContacts: false }, K.dbPrivacy.version);
    const user = this.user();
    const own = user && this.profiles().find((p) => p.id === user.profileId);
    const dates = user && own ? createMockDates(this.matches(), user.id) : [];
    storage.set(K.dbDates.key, dates, K.dbDates.version);
    // Each date plan appears in the chat as a shared date card.
    const others = this.messages().filter((m) => m.kind !== 'date');
    const cards: Message[] = dates.map((d) => ({ id: `msg-${d.id}`, matchId: d.matchId, senderId: d.proposedBy, kind: 'date', body: '', dateId: d.id, sentAt: d.createdAt }));
    this.writeMessages([...others, ...cards].sort((a, b) => a.sentAt.localeCompare(b.sentAt)));
    if (cards.length) {
      this.writeMatches(this.matches().map((m) => {
        const card = cards.find((c) => c.matchId === m.id);
        return card && card.sentAt > m.lastActivityAt ? { ...m, lastActivityAt: card.sentAt } : m;
      }));
    }
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
    this.resetSafetyAndDates();
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
    this.resetSafetyAndDates();
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
    this.resetSafetyAndDates();
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
    this.resetSafetyAndDates();
    storage.remove(K.onboardingDraft.key);
    storage.remove(K.onboardingPhotos.key);
  },

  meta(): DbMeta | null {
    return storage.get<DbMeta | null>(K.dbMeta.key, null);
  },

  user(): User | null {
    return storage.get<User | null>(K.dbUser.key, null, { validate: (v): v is User => isUser(v) });
  },
  preferences(): Preferences | null {
    return storage.get<Preferences | null>(K.dbPreferences.key, null, { validate: (v): v is Preferences => isPreferences(v) });
  },
  profiles(): Profile[] {
    return list(K.dbProfiles.key, isProfile);
  },
  matches(): Match[] {
    return list(K.dbMatches.key, isMatch);
  },
  messages(): Message[] {
    return list(K.dbMessages.key, isMessage);
  },
  likes(): Like[] {
    return list(K.dbLikes.key, isLike);
  },
  passes(): Pass[] {
    return list(K.dbPasses.key, isPass);
  },
  dailyPicks(): DailyPicks | null {
    return storage.get<DailyPicks | null>(K.dbDailyPicks.key, null, {
      validate: (v): v is DailyPicks | null => v === null || isDailyPicks(v),
    });
  },
  blocks(): Block[] {
    return list(K.dbBlocks.key, isBlock);
  },
  reports(): Report[] {
    return list(K.dbReports.key, isReport);
  },
  dates(): DatePlan[] {
    return list(K.dbDates.key, isDatePlan);
  },
  dateFeedback(): DateFeedback[] {
    return list(K.dbDateFeedback.key, isFeedback);
  },
  privacy(): PrivacySettings {
    return storage.get<PrivacySettings>(K.dbPrivacy.key, { hideFromContacts: false }, { validate: (v): v is PrivacySettings => isPrivacy(v) });
  },
  /** User ids the current user has blocked. Blocked people disappear everywhere. */
  blockedUserIds(): Set<string> {
    const me = this.user()?.id;
    return new Set(this.blocks().filter((b) => b.blockerId === me).map((b) => b.blockedUserId));
  },
  writeBlocks(blocks: Block[]): boolean {
    return storage.set(K.dbBlocks.key, blocks, K.dbBlocks.version);
  },
  writeReports(reports: Report[]): boolean {
    return storage.set(K.dbReports.key, reports, K.dbReports.version);
  },
  writeDates(dates: DatePlan[]): boolean {
    return storage.set(K.dbDates.key, dates, K.dbDates.version);
  },
  writeDateFeedback(feedback: DateFeedback[]): boolean {
    return storage.set(K.dbDateFeedback.key, feedback, K.dbDateFeedback.version);
  },
  writePrivacy(privacy: PrivacySettings): boolean {
    return storage.set(K.dbPrivacy.key, privacy, K.dbPrivacy.version);
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
