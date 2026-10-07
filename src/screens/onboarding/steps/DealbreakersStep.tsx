import { ChipSelect, ModeToggle, Switch } from '../../../components/form';
import { DRINKING_OPTIONS, RELIGION_OPTIONS, SMOKING_OPTIONS, type Option } from '../../../domain/profileOptions';
import type { FilterRule } from '../../../domain/types';
import type { DraftFilters } from '../../../onboarding/draft';
import type { StepProps } from './types';
import './steps.css';

interface FilterConfig {
  key: keyof DraftFilters;
  title: string;
  question: string;
  options: Option<string>[];
}

const FILTERS: FilterConfig[] = [
  { key: 'smoking', title: 'Smoking', question: 'Who are you open to?', options: SMOKING_OPTIONS.map((o) => ({ ...o, label: `Smokes ${o.label.toLowerCase()}` })) },
  { key: 'drinking', title: 'Drinking', question: 'Who are you open to?', options: DRINKING_OPTIONS.map((o) => ({ ...o, label: `Drinks ${o.label.toLowerCase()}` })) },
  { key: 'children', title: 'Has children', question: 'Who are you open to?', options: [
    { value: 'none', label: "Doesn't have children" },
    { value: 'has_children', label: 'Has children' },
  ] },
  { key: 'wantsChildren', title: 'Wants children', question: 'Who are you open to?', options: [
    { value: 'wants', label: 'Wants children' },
    { value: 'open', label: 'Open to children' },
    { value: 'unsure', label: 'Not sure yet' },
    { value: 'does_not_want', label: "Doesn't want children" },
  ] },
  { key: 'religion', title: 'Religion', question: 'Who are you open to?', options: RELIGION_OPTIONS.map((r) => ({ value: r, label: r })) },
];

/**
 * For each lifestyle filter: no preference (default), a soft preference, or a dealbreaker.
 * Everything is off by default, so nobody is filtered out unless the user chooses it.
 */
export function DealbreakersStep({ draft, update, errors }: StepProps) {
  const setRule = (key: keyof DraftFilters, rule: FilterRule<string> | null) =>
    update({ filters: { ...draft.filters, [key]: rule } as DraftFilters });

  return (
    <div className="step-stack">
      <ul className="filter-list" role="list">
        {FILTERS.map((f) => {
          const rule = draft.filters[f.key] as FilterRule<string> | null;
          return (
            <li key={f.key} className="filter-item">
              <Switch
                label={f.title}
                description={rule ? (rule.mode === 'dealbreaker' ? 'Dealbreaker' : 'Preference') : 'No preference'}
                checked={rule !== null}
                onChange={(on) => setRule(f.key, on ? { values: f.options.map((o) => o.value), mode: 'preference' } : null)}
              />
              {rule && (
                <div className="filter-item__body">
                  <ChipSelect
                    legend={f.question}
                    options={f.options}
                    value={rule.values}
                    onChange={(values) => setRule(f.key, { ...rule, values })}
                    error={errors[f.key]}
                  />
                  <ModeToggle legend={`How strict is ${f.title.toLowerCase()}?`} value={rule.mode} onChange={(mode) => setRule(f.key, { ...rule, mode })} />
                </div>
              )}
            </li>
          );
        })}
      </ul>
    </div>
  );
}
