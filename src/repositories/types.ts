import type {
  Block,
  DailyPicks,
  DateFeedback,
  DatePlan,
  ID,
  Like,
  LikeTarget,
  Match,
  Message,
  Pass,
  Preferences,
  PrivacySettings,
  Profile,
  Report,
  ReportCategory,
  User,
  VerificationState,
} from '../domain/types';

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

export interface NewMessage {
  kind: Message['kind'];
  body: string;
  photo?: Message['photo'];
  voice?: Message['voice'];
}

export interface MatchRepository {
  /** All of the user's matches, including archived ones. Matches never expire. */
  listMatches(): Promise<Match[]>;
  listMessages(matchId: ID): Promise<Message[]>;
  /** Every message across the user's matches (for previews and unread state). */
  listAllMessages(): Promise<Message[]>;
  sendMessage(matchId: ID, input: NewMessage): Promise<Message>;
  /** Private read marker for the current user. Never exposed as a read receipt. */
  markRead(matchId: ID): Promise<void>;
  setArchived(matchId: ID, archived: boolean): Promise<Match>;
  /** "Keep for later" on the Still interested? prompt. */
  keepForLater(matchId: ID): Promise<Match>;
  /**
   * Notify when likes, matches or messages change (other tabs, debug tools).
   * A real backend would use realtime subscriptions here.
   */
  subscribe(onChange: () => void): () => void;
}

/** Likes other people sent to the current user. */
export interface IncomingLikeRepository {
  /** All received likes; the UI derives which are still pending. */
  listReceived(): Promise<Like[]>;
  /** Accept (creating a mutual match) or pass. */
  respond(likeId: ID, response: 'match' | 'pass'): Promise<Match | null>;
}

export interface DiscoveryState {
  likes: Like[];
  passes: Pass[];
  dailyPicks: DailyPicks | null;
}

/**
 * Likes, passes and the daily curated set. Ranking itself lives in
 * `src/recommendation` (pure functions) and would move server-side later.
 */
export interface DiscoveryRepository {
  getState(): Promise<DiscoveryState>;
  /** If they already liked you, this creates a mutual match and returns it. */
  sendLike(input: { toProfileId: ID; toUserId: ID; target: LikeTarget; comment?: string }): Promise<{ like: Like; match: Match | null }>;
  pass(toProfileId: ID): Promise<Pass>;
  /** Remove a pass so the person can be seen again (one-step undo). */
  undoPass(passId: ID): Promise<void>;
  saveDailyPicks(daily: DailyPicks): Promise<DailyPicks>;
}

/** Account state and privacy. */
export interface AccountRepository {
  /** Paused: hidden from Discover; matches and chats keep working. */
  setPaused(paused: boolean): Promise<User>;
  /** Incognito: only people you like can see your profile. */
  setIncognito(on: boolean): Promise<User>;
  getPrivacy(): Promise<PrivacySettings>;
  savePrivacy(privacy: PrivacySettings): Promise<PrivacySettings>;
  /** Mock verification. A real provider would be called here. */
  setVerification(kind: 'photo' | 'id', state: VerificationState): Promise<Profile>;
  /** Everything stored about the user, as plain JSON. */
  exportData(): Promise<Record<string, unknown>>;
  /** Prototype: wipes all local data. */
  deleteAccount(): Promise<void>;
}

/** Safety tools are available to everyone. They are never a paid feature. */
export interface SafetyRepository {
  listBlocks(): Promise<Block[]>;
  /** Blocked people disappear from Discover, Likes and Matches. They aren't told. */
  block(userId: ID): Promise<Block>;
  unblock(userId: ID): Promise<void>;
  /** The reported person is never told who reported them. */
  report(input: { userId: ID; category: ReportCategory; details?: string; alsoBlock: boolean }): Promise<Report>;
  listReports(): Promise<Report[]>;
  /** Removes the match and conversation for both people. */
  unmatch(matchId: ID): Promise<void>;
}

export interface DateInput {
  date: string;
  time: string;
  venue?: string;
  note?: string;
}

export interface DatesRepository {
  list(): Promise<DatePlan[]>;
  listFeedback(): Promise<DateFeedback[]>;
  /** Propose a date, or (with `replaces`) suggest a change to an existing one. */
  propose(matchId: ID, input: DateInput, replaces?: ID): Promise<DatePlan>;
  accept(dateId: ID): Promise<DatePlan>;
  cancel(dateId: ID): Promise<DatePlan>;
  /** Private: never shown to the other person. */
  giveFeedback(input: Omit<DateFeedback, 'id' | 'createdAt' | 'matchId' | 'aboutUserId'>): Promise<DateFeedback>;
}

export interface Repositories {
  users: UserRepository;
  profiles: ProfileRepository;
  matches: MatchRepository;
  incomingLikes: IncomingLikeRepository;
  discovery: DiscoveryRepository;
  account: AccountRepository;
  safety: SafetyRepository;
  dates: DatesRepository;
}

/** Thrown when a write could not be persisted (e.g. device storage is full). */
export class StorageFullError extends Error {
  constructor() {
    super("There isn't enough space on this device to save that. Try removing a photo or using smaller images.");
    this.name = 'StorageFullError';
  }
}
