import { getCity } from '../../domain/cities';
import { DATING_INTENT_INFO } from '../../domain/intent';
import { getInterest } from '../../domain/interest';
import {
  CHILDREN_DISPLAY,
  DRINKING_DISPLAY,
  GENDER_OPTIONS,
  MEET_OPTIONS,
  SMOKING_DISPLAY,
  WANTS_CHILDREN_DISPLAY,
} from '../../domain/profileOptions';
import { draftAge } from '../../onboarding/draft';
import type { StepId } from '../../onboarding/validation';
import { BeliefsStep, FamilyStep, HeightStep, LanguagesStep, LifestyleStep, WorkStep } from './steps/AboutSteps';
import { BirthdayStep, GenderStep, LocationStep, NameStep } from './steps/BasicsSteps';
import { AgeRangeStep, DistanceStep, IntentStep, MeetStep } from './steps/DatingSteps';
import { DealbreakersStep } from './steps/DealbreakersStep';
import { PhotosStep } from './steps/PhotosStep';
import { BioStep, InterestsStep } from './steps/ProfileSteps';
import { PromptsStep } from './steps/PromptsStep';
import type { SectionId, StepDef } from './steps/types';

export const SECTION_LABELS: Record<SectionId, string> = {
  basics: 'The basics',
  dating: 'Dating',
  about: 'About you',
  profile: 'Your profile',
};

const labelOf = <T extends string>(opts: { value: T; label: string }[], v: T | null) => opts.find((o) => o.value === v)?.label ?? '';
const notSet = 'Not set';
const orNotSet = (s: string) => s || notSet;

/** Onboarding order. "Edit profile" reuses the same definitions. */
export const STEPS: readonly StepDef[] = [
  { id: 'name', section: 'basics', title: "What's your first name?", editLabel: 'Name', summary: (d) => orNotSet(d.firstName), Component: NameStep },
  {
    id: 'birthday', section: 'basics', title: 'When were you born?', editLabel: 'Age',
    summary: (d) => { const a = draftAge(d); return a === null ? notSet : `${a}`; }, Component: BirthdayStep,
  },
  { id: 'gender', section: 'basics', title: 'Which best describes you?', editLabel: 'Gender', summary: (d) => orNotSet(labelOf(GENDER_OPTIONS, d.gender)), Component: GenderStep },
  {
    id: 'location', section: 'basics', title: 'Where are you based?', subtitle: 'We use this to find people near you.', editLabel: 'Location',
    summary: (d) => orNotSet(getCity(d.cityId)?.city ?? ''), Component: LocationStep,
  },
  {
    id: 'meet', section: 'dating', title: 'Who are you hoping to meet?', subtitle: 'Choose everyone you’re open to.', editLabel: 'Show me',
    summary: (d) => orNotSet(MEET_OPTIONS.filter((o) => d.interestedIn.includes(o.value)).map((o) => o.label).join(', ')), Component: MeetStep,
  },
  {
    id: 'intent', section: 'dating', title: 'What are you looking for?', subtitle: 'This is shown on your profile, so people know where you stand.', editLabel: 'Looking for',
    summary: (d) => (d.intent ? DATING_INTENT_INFO[d.intent].label : notSet), Component: IntentStep,
  },
  {
    id: 'ageRange', section: 'dating', title: 'What age range?', editLabel: 'Age range',
    summary: (d) => (d.ageMin !== null && d.ageMax !== null ? `${d.ageMin}–${d.ageMax >= 80 ? '80+' : d.ageMax} · ${d.ageMode === 'dealbreaker' ? 'Dealbreaker' : 'Preference'}` : notSet),
    Component: AgeRangeStep,
  },
  {
    id: 'distance', section: 'dating', title: 'How far would you go?', subtitle: 'Set a comfortable distance and an absolute limit.', editLabel: 'Distance',
    summary: (d) => `Prefer ${d.preferredKm} km · max ${d.maxKm} km`, Component: DistanceStep,
  },
  {
    id: 'dealbreakers', section: 'dating', title: 'Anything that matters to you?',
    subtitle: 'Optional. A preference ranks people higher. A dealbreaker hides everyone outside it.', optional: true, editLabel: 'Preferences & dealbreakers',
    summary: (d) => {
      const rules = Object.values(d.filters).filter(Boolean);
      if (!rules.length) return 'No preferences';
      const hard = rules.filter((r) => r!.mode === 'dealbreaker').length;
      return `${rules.length} set${hard ? ` · ${hard} dealbreaker${hard > 1 ? 's' : ''}` : ''}`;
    },
    Component: DealbreakersStep,
  },
  { id: 'height', section: 'about', title: 'How tall are you?', editLabel: 'Height', summary: (d) => (d.heightCm ? `${d.heightCm} cm` : notSet), Component: HeightStep },
  {
    id: 'work', section: 'about', title: 'Work and education', subtitle: 'Optional. Share as much or as little as you like.', optional: true, editLabel: 'Work & education',
    summary: (d) => orNotSet([d.job, d.education].filter(Boolean).join(' · ')), Component: WorkStep,
  },
  {
    id: 'beliefs', section: 'about', title: 'Beliefs and politics', subtitle: 'Optional. Only add what you’re comfortable sharing.', optional: true, editLabel: 'Beliefs & politics',
    summary: (d) => orNotSet([d.religion, d.politics].filter(Boolean).join(' · ')), Component: BeliefsStep,
  },
  {
    id: 'lifestyle', section: 'about', title: 'Drinking and smoking', editLabel: 'Drinking & smoking',
    summary: (d) => orNotSet([d.drinking && DRINKING_DISPLAY[d.drinking], d.smoking && SMOKING_DISPLAY[d.smoking]].filter(Boolean).join(' · ')),
    Component: LifestyleStep,
  },
  {
    id: 'family', section: 'about', title: 'Children', editLabel: 'Children',
    summary: (d) => orNotSet([d.children && CHILDREN_DISPLAY[d.children], d.wantsChildren && WANTS_CHILDREN_DISPLAY[d.wantsChildren]].filter(Boolean).join(' · ')),
    Component: FamilyStep,
  },
  { id: 'languages', section: 'about', title: 'Which languages do you speak?', editLabel: 'Languages', summary: (d) => orNotSet(d.languages.join(', ')), Component: LanguagesStep },
  {
    id: 'interests', section: 'profile', title: 'What are you into?', subtitle: 'Pick 5 to 10. Shared interests help start conversations.', editLabel: 'Interests',
    summary: (d) => orNotSet(d.interests.map((i) => getInterest(i).label).join(', ')), Component: InterestsStep,
  },
  {
    id: 'photos', section: 'profile', title: 'Add your photos', subtitle: 'At least 3, up to 6. Your first photo is your main one.', editLabel: 'Photos',
    summary: (d) => `${d.photos.length} photo${d.photos.length === 1 ? '' : 's'}`, Component: PhotosStep,
  },
  {
    id: 'prompts', section: 'profile', title: 'Give them something to reply to', subtitle: 'Answer 2 or 3 prompts. Specific beats clever.', editLabel: 'Prompts',
    summary: (d) => `${d.prompts.length} answered`, Component: PromptsStep,
  },
  {
    id: 'bio', section: 'profile', title: 'Anything else?', subtitle: 'Optional. A short bio in your own words.', optional: true, editLabel: 'Bio',
    summary: (d) => orNotSet(d.bio.trim()), Component: BioStep,
  },
];

export const STEP_IDS = STEPS.map((s) => s.id);

export function getStep(id: string | undefined): StepDef | undefined {
  return STEPS.find((s) => s.id === id);
}

export function stepIndex(id: StepId): number {
  return STEPS.findIndex((s) => s.id === id);
}
