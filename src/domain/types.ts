import type { DatingIntent } from './intent';
import type { InterestId } from './interest';

export type { DatingIntent } from './intent';
export type { Interest, InterestId } from './interest';

export type ID = string;
/** ISO 8601 timestamp, e.g. "2026-10-07T18:30:00.000Z". */
export type ISODateTime = string;
/** ISO 8601 calendar date, e.g. "1999-04-12". */
export type ISODate = string;

/* ------------------------------------------------------------------ */
/* Account                                                             */
/* ------------------------------------------------------------------ */

/** "paused": hidden from Discover; matches and chats keep working. */
export type AccountStatus = 'active' | 'paused';

/** The account behind a profile. Auth-related fields will live here. */
export interface User {
  id: ID;
  createdAt: ISODateTime;
  lastActiveAt: ISODateTime;
  status: AccountStatus;
  onboardingComplete: boolean;
  profileId: ID;
  /** Incognito: only people you like can see your profile. */
  incognito?: boolean;
  /** Exactly two plans. Missing means Free. No payments exist in the prototype. */
  plan?: Plan;
}

/** One Free plan and one Premium plan. No other tiers, no consumables. */
export type Plan = 'free' | 'premium';

/** Account-level privacy choices that aren't part of the public profile. */
export interface PrivacySettings {
  /** Prototype only: contacts are never uploaded. */
  hideFromContacts: boolean;
}

/* ------------------------------------------------------------------ */
/* Profile                                                             */
/* ------------------------------------------------------------------ */

export type Gender = 'woman' | 'man' | 'nonbinary';
export type Frequency = 'never' | 'rarely' | 'socially' | 'regularly';
export type ChildrenStatus = 'none' | 'has_children';
export type WantsChildren = 'wants' | 'open' | 'does_not_want' | 'unsure';
export type EducationLevel = 'secondary' | 'vocational' | 'undergraduate' | 'postgraduate';

/** Mock verification. Never implies someone is safe. */
export type VerificationState = 'unverified' | 'pending' | 'verified';

export interface Verification {
  photo: VerificationState;
  id: VerificationState;
}

export interface Photo {
  id: ID;
  /** Remote or object URL. Absent for generated placeholder art. */
  url?: string;
  /** Two-colour gradient used for placeholder art and while loading. */
  tone: readonly [string, string];
  alt: string;
}

export interface PromptAnswer {
  id: ID;
  prompt: string;
  answer: string;
}

/** Coarse location only. Precise coordinates are never stored or shown. */
export interface ApproxLocation {
  city: string;
  country: string;
  /** Rounded to ~1 km precision; used only to compute approximate distance. */
  lat: number;
  lng: number;
}

/** Profile fields the owner can choose to show or hide. */
export type VisibleField =
  | 'religion'
  | 'politics'
  | 'job'
  | 'education'
  | 'children'
  | 'drinking'
  | 'smoking'
  | 'height';

export type FieldVisibility = Partial<Record<VisibleField, boolean>>;

export interface Profile {
  id: ID;
  userId: ID;
  firstName: string;
  birthDate: ISODate;
  gender: Gender;
  intent: DatingIntent;
  location: ApproxLocation;
  heightCm?: number;
  job?: string;
  education?: string;
  religion?: string;
  politics?: string;
  smoking: Frequency;
  drinking: Frequency;
  children: ChildrenStatus;
  wantsChildren: WantsChildren;
  languages: string[];
  interests: InterestId[];
  photos: Photo[];
  prompts: PromptAnswer[];
  bio?: string;
  visibility: FieldVisibility;
  updatedAt: ISODateTime;
  /** Last time this person used the app. Feeds the "activity freshness" ranking signal. */
  lastActiveAt?: ISODateTime;
  /** Highest level of education, used by the education filter. Shown with `education`. */
  educationLevel?: EducationLevel;
  verification?: Verification;
  /** Hide approximate distance from other people. */
  hideDistance?: boolean;
}

/* ------------------------------------------------------------------ */
/* Preferences                                                         */
/* ------------------------------------------------------------------ */

/**
 * A preference ranks people higher but never excludes anyone.
 * A dealbreaker removes people outside the requirement entirely.
 */
export type FilterMode = 'preference' | 'dealbreaker';

export interface FilterRule<T> {
  values: T[];
  mode: FilterMode;
}

export interface Preferences {
  userId: ID;
  interestedIn: Gender[];
  age: { min: number; max: number; mode: FilterMode };
  /** Soft target and hard ceiling, in kilometres. */
  distance: { preferredKm: number; maxKm: number };
  intents: FilterRule<DatingIntent> | null;
  smoking: FilterRule<Frequency> | null;
  drinking: FilterRule<Frequency> | null;
  children: FilterRule<ChildrenStatus> | null;
  wantsChildren: FilterRule<WantsChildren> | null;
  religion: FilterRule<string> | null;
  politics?: FilterRule<string> | null;
  education?: FilterRule<EducationLevel> | null;
  height?: { minCm: number; maxCm: number; mode: FilterMode } | null;
}

/* ------------------------------------------------------------------ */
/* Matches & messages                                                  */
/* ------------------------------------------------------------------ */

/** Stored status. "Inactive" is derived from time since last activity, never stored or enforced. */
export type MatchStatus = 'active' | 'inactive' | 'archived';

/** What one person liked when the match formed, kept so context carries into the chat. */
export interface MatchContext {
  fromUserId: ID;
  /** Whose photo or prompt was liked. */
  aboutUserId: ID;
  target: LikeTarget;
  snapshot: LikeSnapshot;
  comment?: string;
  at: ISODateTime;
}

export interface Match {
  id: ID;
  /** Always exactly two user IDs. */
  userIds: readonly [ID, ID];
  createdAt: ISODateTime;
  lastActivityAt: ISODateTime;
  status: MatchStatus;
  /** Legacy free-text context (Part 1 mock data). */
  context?: string;
  /** Both people's likes, including any comments. */
  contexts?: MatchContext[];
  /** Set when the user archives the conversation. Archived chats stay recoverable. */
  archivedAt?: ISODateTime | null;
  /** "Keep for later" on the Still interested? prompt. */
  keptForLaterAt?: ISODateTime | null;
  /**
   * Private read markers, per user, used only to show *your own* unread state.
   * Never shown to the other person (no read receipts by default).
   */
  lastReadAt?: Partial<Record<ID, ISODateTime>>;
}

export type MessageKind = 'text' | 'photo' | 'voice' | 'date';

export interface Message {
  id: ID;
  matchId: ID;
  senderId: ID;
  kind: MessageKind;
  body: string;
  sentAt: ISODateTime;
  /** A like comment carried into the chat, quoting what was liked. */
  likeContext?: { aboutUserId: ID; snapshot: LikeSnapshot };
  /** Photo-message placeholder (no upload yet). */
  photo?: { tone: readonly [string, string] };
  /** Voice-note placeholder (no audio yet). */
  voice?: { durationSec: number };
  /** A shared date card ("date" messages). */
  dateId?: ID;
}

/* ------------------------------------------------------------------ */
/* Discovery: likes, passes, daily picks                               */
/* ------------------------------------------------------------------ */

/** What a like is attached to. Contextual likes (photo / prompt) are encouraged. */
export type LikeTarget =
  | { kind: 'profile' }
  | { kind: 'photo'; photoId: ID }
  | { kind: 'prompt'; promptId: ID };

/**
 * A copy of what was liked, so the context survives later profile edits.
 * Photos keep only id + tone; the image itself is resolved from the profile.
 */
export type LikeSnapshot =
  | { kind: 'profile' }
  | { kind: 'photo'; photoId: ID; tone: readonly [string, string] }
  | { kind: 'prompt'; prompt: string; answer: string };

export interface Like {
  id: ID;
  fromUserId: ID;
  /** Set on received likes so the liker's profile can be shown. */
  fromProfileId?: ID;
  toUserId: ID;
  toProfileId: ID;
  target: LikeTarget;
  snapshot?: LikeSnapshot;
  /** Optional message sent with the like. */
  comment?: string;
  createdAt: ISODateTime;
}

export interface Pass {
  id: ID;
  fromUserId: ID;
  toProfileId: ID;
  createdAt: ISODateTime;
}

/** The curated set for one calendar day. Fixed for the day so it never reshuffles. */
export interface DailyPicks {
  /** Local calendar date, YYYY-MM-DD. */
  date: string;
  profileIds: ID[];
  /** Changes when preferences change, so the set can be refreshed fairly. */
  fingerprint: string;
  /** Explore more opened for this day. */
  exploreOpened: boolean;
  /**
   * The rewind buffer: exactly one previous discovery action, replaced by every new
   * pass or like and cleared after a rewind. Recorded for everyone; only Premium can use it.
   */
  lastAction?: DiscoveryAction | null;
  /** @deprecated Part 3 storage; read as a pass `lastAction`. */
  undoablePassId?: ID | null;
}

export interface DiscoveryAction {
  kind: 'pass' | 'like';
  /** The Pass or Like record id. */
  recordId: ID;
  profileId: ID;
}

/* ------------------------------------------------------------------ */
/* Safety                                                              */
/* ------------------------------------------------------------------ */

export interface Block {
  id: ID;
  blockerId: ID;
  blockedUserId: ID;
  createdAt: ISODateTime;
}

export const REPORT_CATEGORIES = [
  'fake_profile',
  'harassment',
  'sexual_content',
  'hate_or_threats',
  'underage',
  'spam_scam',
  'privacy_concern',
  'other',
] as const;
export type ReportCategory = (typeof REPORT_CATEGORIES)[number];

/** Reports are private. The reported person is never told who reported them. */
export interface Report {
  id: ID;
  reporterId: ID;
  reportedUserId: ID;
  category: ReportCategory;
  details?: string;
  alsoBlocked: boolean;
  createdAt: ISODateTime;
  status: 'received';
}

/* ------------------------------------------------------------------ */
/* Dates                                                               */
/* ------------------------------------------------------------------ */

export type DatePlanStatus = 'proposed' | 'accepted' | 'changed' | 'cancelled';

export interface DatePlan {
  id: ID;
  matchId: ID;
  proposedBy: ID;
  /** Local date YYYY-MM-DD and time HH:mm. */
  date: string;
  time: string;
  venue?: string;
  note?: string;
  status: DatePlanStatus;
  /** The plan this one replaced via "Suggest change". */
  replaces?: ID;
  createdAt: ISODateTime;
  respondedAt?: ISODateTime;
}

export type DateOutcome = 'see_again' | 'not_sure' | 'not_a_match' | 'did_not_go';

/** Private post-date feedback. Never shown to the other person; feeds recommendations later. */
export interface DateFeedback {
  id: ID;
  dateId: ID;
  matchId: ID;
  aboutUserId: ID;
  outcome: DateOutcome;
  worked?: string;
  didnt?: string;
  createdAt: ISODateTime;
}
