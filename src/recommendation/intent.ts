import type { DatingIntent } from '../domain/types';

/** How "long-term" each intention is. figuring_out sits outside the scale. */
const LONG_TERM_SCALE: Partial<Record<DatingIntent, number>> = {
  long_term: 3,
  long_term_open_short: 2,
  short_term_open_long: 1,
  casual: 0,
};

export type IntentAlignment = 'same' | 'close' | 'open' | 'apart' | 'opposite';

export function intentAlignment(a: DatingIntent, b: DatingIntent): IntentAlignment {
  if (a === b) return 'same';
  if (a === 'figuring_out' || b === 'figuring_out') return 'open';
  const gap = Math.abs((LONG_TERM_SCALE[a] ?? 0) - (LONG_TERM_SCALE[b] ?? 0));
  return gap === 1 ? 'close' : gap === 2 ? 'apart' : 'opposite';
}

/** Both at least open to something long-term. */
export const bothLongTermLeaning = (a: DatingIntent, b: DatingIntent) => (LONG_TERM_SCALE[a] ?? 0) >= 2 && (LONG_TERM_SCALE[b] ?? 0) >= 2;

export const SAME_INTENT_REASON: Record<DatingIntent, string> = {
  long_term: 'You both want a long-term relationship',
  long_term_open_short: 'You’re both hoping for something long-term',
  short_term_open_long: 'You’re both keeping it light, open to more',
  casual: 'You’re both looking for something casual',
  figuring_out: 'You’re both still figuring it out',
};
