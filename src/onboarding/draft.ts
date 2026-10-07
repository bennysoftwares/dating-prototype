import { CURRENT_PROFILE_ID, CURRENT_USER_ID } from '../data/mock';
import { findCityByName, getCity, toApproxLocation } from '../domain/cities';
import type {
  ChildrenStatus,
  DatingIntent,
  EducationLevel,
  FieldVisibility,
  FilterMode,
  FilterRule,
  Frequency,
  Gender,
  InterestId,
  Photo,
  Preferences,
  Profile,
  PromptAnswer,
  WantsChildren,
} from '../domain/types';
import { ageFromBirthDate } from '../utils/time';

/**
 * Everything onboarding collects, in a flat, form-friendly shape.
 * Unanswered required fields are `null`; unanswered optional text is `''`.
 * The same shape powers "Edit profile", so both flows share every step.
 */
export interface ProfileDraft {
  firstName: string;
  birthDate: string;
  gender: Gender | null;
  interestedIn: Gender[];
  cityId: string | null;
  preferredKm: number;
  maxKm: number;
  intent: DatingIntent | null;
  ageMin: number | null;
  ageMax: number | null;
  ageMode: FilterMode;
  heightCm: number | null;
  job: string;
  education: string;
  educationLevel: EducationLevel | null;
  religion: string;
  politics: string;
  smoking: Frequency | null;
  drinking: Frequency | null;
  children: ChildrenStatus | null;
  wantsChildren: WantsChildren | null;
  languages: string[];
  interests: InterestId[];
  photos: Photo[];
  prompts: PromptAnswer[];
  bio: string;
  visibility: Required<FieldVisibility>;
  filters: DraftFilters;
}

export interface DraftFilters {
  smoking: FilterRule<Frequency> | null;
  drinking: FilterRule<Frequency> | null;
  children: FilterRule<ChildrenStatus> | null;
  wantsChildren: FilterRule<WantsChildren> | null;
  religion: FilterRule<string> | null;
}

export type DraftPatch = Partial<ProfileDraft>;

export const DEFAULT_VISIBILITY: Required<FieldVisibility> = {
  religion: true,
  politics: true,
  job: true,
  education: true,
  children: true,
  drinking: true,
  smoking: true,
  height: true,
};

export function createEmptyDraft(): ProfileDraft {
  return {
    firstName: '',
    birthDate: '',
    gender: null,
    interestedIn: [],
    cityId: null,
    preferredKm: 30,
    maxKm: 60,
    intent: null,
    ageMin: null,
    ageMax: null,
    ageMode: 'preference',
    heightCm: null,
    job: '',
    education: '',
    educationLevel: null,
    religion: '',
    politics: '',
    smoking: null,
    drinking: null,
    children: null,
    wantsChildren: null,
    languages: [],
    interests: [],
    photos: [],
    prompts: [],
    bio: '',
    visibility: { ...DEFAULT_VISIBILITY },
    filters: { smoking: null, drinking: null, children: null, wantsChildren: null, religion: null },
  };
}

/** Merge stored data over a fresh draft so older or partial drafts never crash a step. */
export function normalizeDraft(value: unknown): ProfileDraft {
  const base = createEmptyDraft();
  if (!value || typeof value !== 'object') return base;
  const v = value as Partial<ProfileDraft>;
  return {
    ...base,
    ...v,
    visibility: { ...base.visibility, ...(v.visibility ?? {}) },
    filters: { ...base.filters, ...(v.filters ?? {}) },
    interestedIn: Array.isArray(v.interestedIn) ? v.interestedIn : [],
    languages: Array.isArray(v.languages) ? v.languages : [],
    interests: Array.isArray(v.interests) ? v.interests : [],
    photos: Array.isArray(v.photos) ? v.photos : [],
    prompts: Array.isArray(v.prompts) ? v.prompts : [],
  };
}

export function draftAge(draft: Pick<ProfileDraft, 'birthDate'>): number | null {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(draft.birthDate)) return null;
  const age = ageFromBirthDate(draft.birthDate);
  return Number.isFinite(age) ? age : null;
}

/** A sensible starting age range around the user's own age. */
export function suggestedAgeRange(age: number | null): { min: number; max: number } {
  if (age === null) return { min: 24, max: 34 };
  return { min: Math.max(18, age - 4), max: Math.max(22, age + 5) };
}

const trimOrUndefined = (s: string) => (s.trim() ? s.trim() : undefined);

/** Build a Profile from a draft. Assumes the draft passed validation. */
export function draftToProfile(draft: ProfileDraft, existing?: Profile | null): Profile {
  const city = getCity(draft.cityId);
  return {
    id: existing?.id ?? CURRENT_PROFILE_ID,
    userId: existing?.userId ?? CURRENT_USER_ID,
    firstName: draft.firstName.trim(),
    birthDate: draft.birthDate,
    gender: draft.gender ?? 'nonbinary',
    intent: draft.intent ?? 'figuring_out',
    location: city ? toApproxLocation(city) : existing?.location ?? { city: '', country: '', lat: 0, lng: 0 },
    heightCm: draft.heightCm ?? undefined,
    job: trimOrUndefined(draft.job),
    education: trimOrUndefined(draft.education),
    educationLevel: draft.educationLevel ?? undefined,
    // Account-managed fields are kept as they are when editing.
    verification: existing?.verification ?? { photo: 'unverified', id: 'unverified' },
    hideDistance: existing?.hideDistance,
    religion: trimOrUndefined(draft.religion),
    politics: trimOrUndefined(draft.politics),
    smoking: draft.smoking ?? 'never',
    drinking: draft.drinking ?? 'never',
    children: draft.children ?? 'none',
    wantsChildren: draft.wantsChildren ?? 'unsure',
    languages: draft.languages,
    interests: draft.interests,
    photos: draft.photos,
    prompts: draft.prompts.map((p) => ({ ...p, answer: p.answer.trim() })),
    bio: trimOrUndefined(draft.bio),
    visibility: { ...draft.visibility },
    updatedAt: new Date().toISOString(),
  };
}

export function draftToPreferences(draft: ProfileDraft, existing?: Preferences | null): Preferences {
  const range = suggestedAgeRange(draftAge(draft));
  return {
    userId: existing?.userId ?? CURRENT_USER_ID,
    interestedIn: draft.interestedIn,
    age: { min: draft.ageMin ?? range.min, max: draft.ageMax ?? range.max, mode: draft.ageMode },
    distance: { preferredKm: draft.preferredKm, maxKm: draft.maxKm },
    // Intent filtering is not collected in onboarding; keep whatever exists.
    intents: existing?.intents ?? null,
    smoking: draft.filters.smoking,
    drinking: draft.filters.drinking,
    children: draft.filters.children,
    wantsChildren: draft.filters.wantsChildren,
    religion: draft.filters.religion,
    // Filters only set from Settings → Filters are preserved.
    politics: existing?.politics ?? null,
    education: existing?.education ?? null,
    height: existing?.height ?? null,
  };
}

export function profileToDraft(profile: Profile, preferences: Preferences | null): ProfileDraft {
  const base = createEmptyDraft();
  return {
    ...base,
    firstName: profile.firstName,
    birthDate: profile.birthDate,
    gender: profile.gender,
    cityId: findCityByName(profile.location.city)?.id ?? null,
    intent: profile.intent,
    heightCm: profile.heightCm ?? null,
    job: profile.job ?? '',
    education: profile.education ?? '',
    educationLevel: profile.educationLevel ?? null,
    religion: profile.religion ?? '',
    politics: profile.politics ?? '',
    smoking: profile.smoking,
    drinking: profile.drinking,
    children: profile.children,
    wantsChildren: profile.wantsChildren,
    languages: [...profile.languages],
    interests: [...profile.interests],
    photos: [...profile.photos],
    prompts: profile.prompts.map((p) => ({ ...p })),
    bio: profile.bio ?? '',
    visibility: { ...base.visibility, ...profile.visibility },
    ...(preferences && {
      interestedIn: [...preferences.interestedIn],
      preferredKm: preferences.distance.preferredKm,
      maxKm: preferences.distance.maxKm,
      ageMin: preferences.age.min,
      ageMax: preferences.age.max,
      ageMode: preferences.age.mode,
      filters: {
        smoking: preferences.smoking,
        drinking: preferences.drinking,
        children: preferences.children,
        wantsChildren: preferences.wantsChildren,
        religion: preferences.religion,
      },
    }),
  };
}
