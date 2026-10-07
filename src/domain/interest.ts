export const INTEREST_IDS = [
  'gaming', 'movies', 'horror', 'music', 'concerts', 'gym', 'hiking', 'cooking',
  'travel', 'photography', 'art', 'history', 'books', 'animals', 'technology',
  'football', 'motorsport', 'faith', 'coffee', 'food', 'nature', 'board_games',
  'comedy', 'fishing', 'cars', 'running', 'cycling', 'swimming', 'camping', 'diy',
  'fashion', 'anime', 'science', 'writing',
] as const;

export type InterestId = (typeof INTEREST_IDS)[number];

export interface Interest {
  id: InterestId;
  label: string;
}

const LABEL_OVERRIDES: Partial<Record<InterestId, string>> = {
  board_games: 'Board games',
  diy: 'DIY',
};

function toLabel(id: InterestId): string {
  return LABEL_OVERRIDES[id] ?? id.charAt(0).toUpperCase() + id.slice(1);
}

export const INTERESTS: readonly Interest[] = INTEREST_IDS.map((id) => ({ id, label: toLabel(id) }));

const BY_ID = new Map(INTERESTS.map((i) => [i.id, i]));

export function getInterest(id: InterestId): Interest {
  return BY_ID.get(id) ?? { id, label: toLabel(id) };
}
