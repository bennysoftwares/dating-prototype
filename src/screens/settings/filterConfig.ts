import { DATING_INTENTS, DATING_INTENT_INFO } from '../../domain/intent';
import {
  DRINKING_OPTIONS,
  EDUCATION_LEVEL_OPTIONS,
  MEET_OPTIONS,
  POLITICS_OPTIONS,
  RELIGION_OPTIONS,
  SMOKING_OPTIONS,
  type Option,
} from '../../domain/profileOptions';
import type { FilterRule, Preferences } from '../../domain/types';

export type RuleKey = 'intents' | 'children' | 'wantsChildren' | 'smoking' | 'drinking' | 'religion' | 'politics' | 'education';

export interface RuleFilter {
  key: RuleKey;
  title: string;
  question: string;
  options: Option<string>[];
}

/** Filters built on a list of accepted values, each a preference or a dealbreaker. */
export const RULE_FILTERS: Record<RuleKey, RuleFilter> = {
  intents: {
    key: 'intents',
    title: 'Dating intention',
    question: 'Who are you open to?',
    options: DATING_INTENTS.map((id) => ({ value: id, label: DATING_INTENT_INFO[id].label })),
  },
  children: {
    key: 'children',
    title: 'Has children',
    question: 'Who are you open to?',
    options: [
      { value: 'none', label: "Doesn't have children" },
      { value: 'has_children', label: 'Has children' },
    ],
  },
  wantsChildren: {
    key: 'wantsChildren',
    title: 'Wants children',
    question: 'Who are you open to?',
    options: [
      { value: 'wants', label: 'Wants children' },
      { value: 'open', label: 'Open to children' },
      { value: 'unsure', label: 'Not sure yet' },
      { value: 'does_not_want', label: "Doesn't want children" },
    ],
  },
  smoking: { key: 'smoking', title: 'Smoking', question: 'Who are you open to?', options: SMOKING_OPTIONS.map((o) => ({ ...o, label: `Smokes ${o.label.toLowerCase()}` })) },
  drinking: { key: 'drinking', title: 'Drinking', question: 'Who are you open to?', options: DRINKING_OPTIONS.map((o) => ({ ...o, label: `Drinks ${o.label.toLowerCase()}` })) },
  religion: { key: 'religion', title: 'Religion', question: 'Who are you open to?', options: RELIGION_OPTIONS.map((r) => ({ value: r, label: r })) },
  politics: { key: 'politics', title: 'Politics', question: 'Who are you open to?', options: POLITICS_OPTIONS.map((r) => ({ value: r, label: r })) },
  education: { key: 'education', title: 'Education', question: 'Highest level of education', options: EDUCATION_LEVEL_OPTIONS },
};

export const ADDITIONAL_KEYS: RuleKey[] = ['children', 'wantsChildren', 'smoking', 'drinking', 'religion', 'politics', 'education'];

export const getRule = (prefs: Preferences, key: RuleKey) => (prefs[key] ?? null) as FilterRule<string> | null;

const modeLabel = (mode: string) => (mode === 'dealbreaker' ? 'Dealbreaker' : 'Preference');

export function ruleSummary(prefs: Preferences, key: RuleKey): string {
  const rule = getRule(prefs, key);
  if (!rule) return 'Any';
  const cfg = RULE_FILTERS[key];
  const labels = rule.values.map((v) => cfg.options.find((o) => o.value === v)?.label ?? v);
  const shown = labels.length > 2 ? `${labels.slice(0, 2).join(', ')} +${labels.length - 2}` : labels.join(', ');
  return `${shown} · ${modeLabel(rule.mode)}`;
}

export function ageSummary(p: Preferences) {
  return `${p.age.min}–${p.age.max >= 80 ? '80+' : p.age.max} · ${modeLabel(p.age.mode)}`;
}
export function distanceSummary(p: Preferences) {
  return `Prefer ${p.distance.preferredKm} km · max ${p.distance.maxKm} km`;
}
export function heightSummary(p: Preferences) {
  return p.height ? `${p.height.minCm}–${p.height.maxCm} cm · ${modeLabel(p.height.mode)}` : 'Any';
}
export function showMeSummary(p: Preferences) {
  return MEET_OPTIONS.filter((o) => p.interestedIn.includes(o.value)).map((o) => o.label).join(', ') || 'Not set';
}
