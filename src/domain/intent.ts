export const DATING_INTENTS = [
  'long_term',
  'long_term_open_short',
  'short_term_open_long',
  'casual',
  'figuring_out',
] as const;

export type DatingIntent = (typeof DATING_INTENTS)[number];

export interface DatingIntentInfo {
  id: DatingIntent;
  label: string;
  /** One plain-language sentence. Intentions are never hidden behind vague wording. */
  description: string;
}

export const DATING_INTENT_INFO: Record<DatingIntent, DatingIntentInfo> = {
  long_term: {
    id: 'long_term',
    label: 'Long-term relationship',
    description: 'Looking for a committed, long-term partner.',
  },
  long_term_open_short: {
    id: 'long_term_open_short',
    label: 'Long-term, open to short',
    description: 'Hoping for something lasting, open to seeing where it goes.',
  },
  short_term_open_long: {
    id: 'short_term_open_long',
    label: 'Short-term, open to long',
    description: 'Keeping it light for now, open to more with the right person.',
  },
  casual: {
    id: 'casual',
    label: 'Casual dating',
    description: 'Dating casually without expectations of commitment.',
  },
  figuring_out: {
    id: 'figuring_out',
    label: 'Still figuring it out',
    description: 'Open-minded and working out what feels right.',
  },
};
