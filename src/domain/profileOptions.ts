import type { ChildrenStatus, Frequency, Gender, WantsChildren } from './types';

/* Limits ------------------------------------------------------------ */

export const PROFILE_LIMITS = {
  minAge: 18,
  maxAge: 99,
  firstNameMax: 30,
  photosMin: 3,
  photosMax: 6,
  promptsMin: 2,
  promptsMax: 3,
  promptAnswerMax: 150,
  interestsMin: 5,
  interestsMax: 10,
  bioMax: 300,
  jobMax: 60,
  educationMax: 60,
  heightMinCm: 140,
  heightMaxCm: 215,
  distanceMinKm: 2,
  distanceMaxKm: 160,
} as const;

/* Labels ------------------------------------------------------------ */

export interface Option<T extends string> {
  value: T;
  label: string;
}

export const GENDER_OPTIONS: Option<Gender>[] = [
  { value: 'woman', label: 'Woman' },
  { value: 'man', label: 'Man' },
  { value: 'nonbinary', label: 'Non-binary' },
];

/** Plural labels for "who do you want to meet". */
export const MEET_OPTIONS: Option<Gender>[] = [
  { value: 'woman', label: 'Women' },
  { value: 'man', label: 'Men' },
  { value: 'nonbinary', label: 'Non-binary people' },
];

export const SMOKING_OPTIONS: Option<Frequency>[] = [
  { value: 'never', label: 'Never' },
  { value: 'rarely', label: 'Rarely' },
  { value: 'socially', label: 'Socially' },
  { value: 'regularly', label: 'Regularly' },
];

export const DRINKING_OPTIONS: Option<Frequency>[] = SMOKING_OPTIONS;

export const CHILDREN_OPTIONS: Option<ChildrenStatus>[] = [
  { value: 'none', label: "Don't have children" },
  { value: 'has_children', label: 'Have children' },
];

export const WANTS_CHILDREN_OPTIONS: Option<WantsChildren>[] = [
  { value: 'wants', label: 'Want children' },
  { value: 'open', label: 'Open to children' },
  { value: 'unsure', label: 'Not sure yet' },
  { value: 'does_not_want', label: "Don't want children" },
];

export const RELIGION_OPTIONS = [
  'Agnostic', 'Atheist', 'Buddhist', 'Catholic', 'Christian', 'Hindu',
  'Jewish', 'Muslim', 'Sikh', 'Spiritual', 'Other',
] as const;

export const POLITICS_OPTIONS = ['Liberal', 'Moderate', 'Conservative', 'Not political', 'Other'] as const;

export const LANGUAGE_OPTIONS = [
  'English', 'Swedish', 'Norwegian', 'Danish', 'Finnish', 'German', 'French', 'Spanish',
  'Italian', 'Portuguese', 'Dutch', 'Polish', 'Arabic', 'Persian', 'Turkish', 'Russian',
  'Ukrainian', 'Hindi', 'Mandarin', 'Japanese', 'Korean', 'Somali', 'Tigrinya', 'Greek',
] as const;

/** How each lifestyle value reads on a profile. */
export const SMOKING_DISPLAY: Record<Frequency, string> = {
  never: "Doesn't smoke",
  rarely: 'Smokes rarely',
  socially: 'Smokes socially',
  regularly: 'Smokes regularly',
};

export const DRINKING_DISPLAY: Record<Frequency, string> = {
  never: "Doesn't drink",
  rarely: 'Drinks rarely',
  socially: 'Drinks socially',
  regularly: 'Drinks regularly',
};

export const CHILDREN_DISPLAY: Record<ChildrenStatus, string> = {
  none: 'No children',
  has_children: 'Has children',
};

export const WANTS_CHILDREN_DISPLAY: Record<WantsChildren, string> = {
  wants: 'Wants children',
  open: 'Open to children',
  unsure: 'Not sure about children',
  does_not_want: "Doesn't want children",
};

/* Prompts ----------------------------------------------------------- */

export const PROFILE_PROMPTS = [
  'A perfect Sunday looks like...',
  "Something I'll never shut up about...",
  'Together we could...',
  'The quickest way to my heart is...',
  "I'm weirdly passionate about...",
  'My ideal first date...',
  'One thing you should know about me...',
  "I'll fall for you if...",
  'A green flag I look for...',
  "The hill I'll die on...",
  'My most irrational fear...',
  "We'll get along if...",
  "I'm looking for someone who...",
  'A random fact I love...',
  'The best way to spend a Friday night...',
] as const;
