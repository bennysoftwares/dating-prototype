/**
 * Lightweight shape checks for stored data. Prototype data lives in localStorage, which
 * users (and older versions of the app) can leave in any state. Instead of trusting it,
 * each record is checked and malformed records are dropped, so one bad entry never
 * crashes a screen or wipes everything else.
 */
const isObj = (v: unknown): v is Record<string, unknown> => typeof v === 'object' && v !== null && !Array.isArray(v);
const str = (o: Record<string, unknown>, ...keys: string[]) => keys.every((k) => typeof o[k] === 'string');
const arr = (o: Record<string, unknown>, ...keys: string[]) => keys.every((k) => Array.isArray(o[k]));

export const isUser = (v: unknown): v is import('../../domain/types').User =>
  isObj(v) && str(v, 'id', 'profileId') && typeof v.onboardingComplete === 'boolean';

export const isAuthAccount = (v: unknown): v is import('../../domain/types').AuthAccount =>
  isObj(v) && str(v, 'id', 'userId', 'method', 'createdAt') && typeof v.emailVerified === 'boolean';

export const isPreferences = (v: unknown): v is import('../../domain/types').Preferences =>
  isObj(v) && arr(v, 'interestedIn') && isObj(v.age) && isObj(v.distance);

export const isProfile = (v: unknown): v is import('../../domain/types').Profile =>
  isObj(v) && str(v, 'id', 'userId', 'firstName', 'birthDate', 'intent') && arr(v, 'photos', 'prompts', 'interests', 'languages') && isObj(v.location) && isObj(v.visibility);

export const isMatch = (v: unknown): v is import('../../domain/types').Match =>
  isObj(v) && str(v, 'id', 'createdAt', 'lastActivityAt') && Array.isArray(v.userIds) && v.userIds.length === 2;

export const isMessage = (v: unknown): v is import('../../domain/types').Message =>
  isObj(v) && str(v, 'id', 'matchId', 'senderId', 'kind', 'sentAt') && typeof v.body === 'string';

export const isLike = (v: unknown): v is import('../../domain/types').Like =>
  isObj(v) && str(v, 'id', 'fromUserId', 'toUserId', 'toProfileId', 'createdAt') && isObj(v.target);

export const isPass = (v: unknown): v is import('../../domain/types').Pass => isObj(v) && str(v, 'id', 'fromUserId', 'toProfileId');

export const isBlock = (v: unknown): v is import('../../domain/types').Block => isObj(v) && str(v, 'id', 'blockerId', 'blockedUserId');

export const isReport = (v: unknown): v is import('../../domain/types').Report => isObj(v) && str(v, 'id', 'reporterId', 'reportedUserId', 'category');

export const isDatePlan = (v: unknown): v is import('../../domain/types').DatePlan =>
  isObj(v) && str(v, 'id', 'matchId', 'proposedBy', 'date', 'time', 'status') && /^\d{4}-\d{2}-\d{2}$/.test(String(v.date));

export const isFeedback = (v: unknown): v is import('../../domain/types').DateFeedback => isObj(v) && str(v, 'id', 'dateId', 'outcome');

export const isDailyPicks = (v: unknown): v is import('../../domain/types').DailyPicks =>
  isObj(v) && str(v, 'date', 'fingerprint') && arr(v, 'profileIds');

export const isPrivacy = (v: unknown): v is import('../../domain/types').PrivacySettings => isObj(v) && typeof v.hideFromContacts === 'boolean';
