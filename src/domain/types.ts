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

export type AccountStatus = 'active' | 'paused';

/** The account behind a profile. Auth-related fields will live here. */
export interface User {
  id: ID;
  createdAt: ISODateTime;
  lastActiveAt: ISODateTime;
  status: AccountStatus;
  onboardingComplete: boolean;
  profileId: ID;
}

/* ------------------------------------------------------------------ */
/* Profile                                                             */
/* ------------------------------------------------------------------ */

export type Gender = 'woman' | 'man' | 'nonbinary';
export type Frequency = 'never' | 'rarely' | 'socially' | 'regularly';
export type ChildrenStatus = 'none' | 'has_children';
export type WantsChildren = 'wants' | 'open' | 'does_not_want' | 'unsure';

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
}

/* ------------------------------------------------------------------ */
/* Matches & messages                                                  */
/* ------------------------------------------------------------------ */

export type MatchStatus = 'active' | 'inactive' | 'archived';

export interface Match {
  id: ID;
  /** Always exactly two user IDs. */
  userIds: readonly [ID, ID];
  createdAt: ISODateTime;
  lastActivityAt: ISODateTime;
  status: MatchStatus;
  /** Human-readable reason the match happened, e.g. what each person liked. */
  context?: string;
}

export type MessageKind = 'text' | 'photo' | 'voice';

export interface Message {
  id: ID;
  matchId: ID;
  senderId: ID;
  kind: MessageKind;
  body: string;
  sentAt: ISODateTime;
}

/* ------------------------------------------------------------------ */
/* Discovery: likes, passes, daily picks                               */
/* ------------------------------------------------------------------ */

/** What a like is attached to. Contextual likes (photo / prompt) are encouraged. */
export type LikeTarget =
  | { kind: 'profile' }
  | { kind: 'photo'; photoId: ID }
  | { kind: 'prompt'; promptId: ID };

export interface Like {
  id: ID;
  fromUserId: ID;
  toUserId: ID;
  toProfileId: ID;
  target: LikeTarget;
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
  /** The single pass that can still be undone (one step only). Cleared by any other action. */
  undoablePassId?: ID | null;
}
