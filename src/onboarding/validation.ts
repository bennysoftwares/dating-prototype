import { getCity } from '../domain/cities';
import { PROFILE_LIMITS as L } from '../domain/profileOptions';
import { draftAge, type ProfileDraft } from './draft';

/** Field name → human message. Empty object means the step is valid. */
export type StepErrors = Partial<Record<string, string>>;

export const validators = {
  name(d: ProfileDraft): StepErrors {
    const name = d.firstName.trim();
    if (!name) return { firstName: 'Add your first name.' };
    if (name.length > L.firstNameMax) return { firstName: `Keep it under ${L.firstNameMax} characters.` };
    if (/\d/.test(name)) return { firstName: 'Names usually don’t include numbers.' };
    return {};
  },
  birthday(d: ProfileDraft): StepErrors {
    const age = draftAge(d);
    if (age === null) return { birthDate: 'Add your date of birth.' };
    if (age < L.minAge) return { birthDate: `You need to be ${L.minAge} or older to use this app.` };
    if (age > L.maxAge) return { birthDate: 'Double-check that year.' };
    return {};
  },
  gender(d: ProfileDraft): StepErrors {
    return d.gender ? {} : { gender: 'Choose the option that fits you best.' };
  },
  meet(d: ProfileDraft): StepErrors {
    return d.interestedIn.length ? {} : { interestedIn: 'Choose at least one.' };
  },
  location(d: ProfileDraft): StepErrors {
    return getCity(d.cityId) ? {} : { cityId: 'Choose your city.' };
  },
  distance(d: ProfileDraft): StepErrors {
    if (d.maxKm < d.preferredKm) return { maxKm: 'Your hard maximum can’t be closer than your preferred distance.' };
    return {};
  },
  intent(d: ProfileDraft): StepErrors {
    return d.intent ? {} : { intent: 'Choose what you’re looking for. You can change it any time.' };
  },
  ageRange(d: ProfileDraft): StepErrors {
    if (d.ageMin === null || d.ageMax === null) return { ageRange: 'Set an age range.' };
    if (d.ageMin > d.ageMax) return { ageRange: 'The youngest age can’t be above the oldest.' };
    if (d.ageMin < L.minAge) return { ageRange: `Everyone here is ${L.minAge} or older.` };
    return {};
  },
  height(d: ProfileDraft): StepErrors {
    return d.heightCm ? {} : { heightCm: 'Set your height.' };
  },
  work(d: ProfileDraft): StepErrors {
    const e: StepErrors = {};
    if (d.job.length > L.jobMax) e.job = `Keep it under ${L.jobMax} characters.`;
    if (d.education.length > L.educationMax) e.education = `Keep it under ${L.educationMax} characters.`;
    return e;
  },
  beliefs(): StepErrors {
    return {};
  },
  lifestyle(d: ProfileDraft): StepErrors {
    const e: StepErrors = {};
    if (!d.smoking) e.smoking = 'Choose one.';
    if (!d.drinking) e.drinking = 'Choose one.';
    return e;
  },
  family(d: ProfileDraft): StepErrors {
    const e: StepErrors = {};
    if (!d.children) e.children = 'Choose one.';
    if (!d.wantsChildren) e.wantsChildren = 'Choose one.';
    return e;
  },
  languages(d: ProfileDraft): StepErrors {
    return d.languages.length ? {} : { languages: 'Choose at least one language.' };
  },
  dealbreakers(d: ProfileDraft): StepErrors {
    const e: StepErrors = {};
    for (const [key, rule] of Object.entries(d.filters)) {
      if (rule && rule.values.length === 0) e[key] = 'Pick at least one option, or set this back to “No preference”.';
    }
    return e;
  },
  interests(d: ProfileDraft): StepErrors {
    const n = d.interests.length;
    if (n < L.interestsMin) return { interests: `Pick at least ${L.interestsMin}. You have ${n}.` };
    if (n > L.interestsMax) return { interests: `Pick up to ${L.interestsMax}.` };
    return {};
  },
  photos(d: ProfileDraft): StepErrors {
    const n = d.photos.length;
    if (n < L.photosMin) return { photos: `Add at least ${L.photosMin} photos. You have ${n}.` };
    return {};
  },
  prompts(d: ProfileDraft): StepErrors {
    const answered = d.prompts.filter((p) => p.answer.trim());
    if (answered.length < L.promptsMin) return { prompts: `Answer at least ${L.promptsMin} prompts.` };
    if (d.prompts.some((p) => p.answer.length > L.promptAnswerMax)) return { prompts: 'One of your answers is too long.' };
    return {};
  },
  bio(d: ProfileDraft): StepErrors {
    return d.bio.length > L.bioMax ? { bio: `Keep it under ${L.bioMax} characters.` } : {};
  },
} satisfies Record<string, (d: ProfileDraft) => StepErrors>;

export type StepId = keyof typeof validators;

export const isValid = (errors: StepErrors) => Object.keys(errors).length === 0;
