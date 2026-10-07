import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router';
import { ChipSelect, ChoiceList, ModeToggle, RangeField } from '../../components/form';
import { Screen, Section } from '../../components/layout';
import { BottomSheet, Button, ErrorState, IconButton, ListGroup, ListRow, LoadingRegion, Skeleton, useToast } from '../../components/ui';
import { useDiscovery } from '../../discovery/DiscoveryProvider';
import { MEET_OPTIONS, PROFILE_LIMITS as L } from '../../domain/profileOptions';
import type { FilterMode, Gender, Preferences } from '../../domain/types';
import { useAsync } from '../../hooks/useAsync';
import { useRepositories } from '../../repositories/RepositoryContext';
import { ADDITIONAL_KEYS, ageSummary, distanceSummary, getRule, heightSummary, ruleSummary, RULE_FILTERS, showMeSummary, type RuleKey } from './filterConfig';
import './Settings.css';

type Editing = { kind: 'showMe' | 'age' | 'distance' | 'height' } | { kind: 'rule'; key: RuleKey } | null;

/**
 * Every filter in one place. Preferences rank people higher without excluding anyone;
 * dealbreakers remove people outside the requirement entirely.
 */
export function FiltersScreen() {
  const navigate = useNavigate();
  const toast = useToast();
  const { users } = useRepositories();
  const discovery = useDiscovery();
  const state = useAsync(() => users.getPreferences(), [users]);
  const [prefs, setPrefs] = useState<Preferences | null>(null);
  const [editing, setEditing] = useState<Editing>(null);
  const [draft, setDraft] = useState<Preferences | null>(null);

  useEffect(() => {
    if (state.status === 'success') setPrefs(state.data);
  }, [state.status, state.data]);

  const open = (e: Editing) => {
    setDraft(prefs);
    setEditing(e);
  };

  const save = async (next: Preferences) => {
    await users.savePreferences(next);
    setPrefs(next);
    setEditing(null);
    void discovery.refresh();
    toast({ message: 'Filters updated' });
  };

  return (
    <Screen title="Filters" leading={<IconButton icon="chevronLeft" label="Back" onClick={() => navigate(-1)} />}>
      <p className="settings__intro">
        <strong>Preference</strong>: people who fit rank higher, but nobody is hidden. <strong>Dealbreaker</strong>: people outside it never appear.
      </p>
      {state.status === 'loading' && (
        <LoadingRegion label="Loading filters"><Skeleton height={240} /></LoadingRegion>
      )}
      {state.status === 'error' && <ErrorState onRetry={state.retry} />}
      {prefs && (
        <>
          <Section title="Core">
            <ListGroup label="Core filters">
              <ListRow title="Show me" subtitle={`${showMeSummary(prefs)} · Always applied`} onClick={() => open({ kind: 'showMe' })} chevron />
              <ListRow title="Age" subtitle={ageSummary(prefs)} onClick={() => open({ kind: 'age' })} chevron />
              <ListRow title="Distance" subtitle={distanceSummary(prefs)} onClick={() => open({ kind: 'distance' })} chevron />
              <ListRow title="Dating intention" subtitle={ruleSummary(prefs, 'intents')} onClick={() => open({ kind: 'rule', key: 'intents' })} chevron />
            </ListGroup>
          </Section>
          <Section title="More filters">
            <ListGroup label="Additional filters">
              {ADDITIONAL_KEYS.slice(0, 6).map((key) => (
                <ListRow key={key} title={RULE_FILTERS[key].title} subtitle={ruleSummary(prefs, key)} onClick={() => open({ kind: 'rule', key })} chevron />
              ))}
              <ListRow title="Height" subtitle={heightSummary(prefs)} onClick={() => open({ kind: 'height' })} chevron />
              <ListRow title="Education" subtitle={ruleSummary(prefs, 'education')} onClick={() => open({ kind: 'rule', key: 'education' })} chevron />
            </ListGroup>
          </Section>
          <p className="settings__note">Filters only use what people choose to show. If a dealbreaker field is hidden on someone's profile, they won't appear.</p>
        </>
      )}

      {draft && editing && <FilterSheet editing={editing} draft={draft} setDraft={setDraft} onClose={() => setEditing(null)} onSave={save} />}
    </Screen>
  );
}

interface FilterSheetProps {
  editing: NonNullable<Editing>;
  draft: Preferences;
  setDraft: (p: Preferences) => void;
  onClose: () => void;
  onSave: (p: Preferences) => Promise<void>;
}

function FilterSheet({ editing, draft, setDraft, onClose, onSave }: FilterSheetProps) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const rule = editing.kind === 'rule' ? getRule(draft, editing.key) : null;
  const optional = editing.kind === 'rule' || editing.kind === 'height';

  const TITLES = { showMe: 'Show me', age: 'Age', distance: 'Distance', height: 'Height' } as const;
  const title = editing.kind === 'rule' ? RULE_FILTERS[editing.key].title : TITLES[editing.kind];

  const validate = (): string | null => {
    if (editing.kind === 'showMe' && draft.interestedIn.length === 0) return 'Choose at least one.';
    if (editing.kind === 'rule' && rule && rule.values.length === 0) return 'Pick at least one option, or clear this filter.';
    return null;
  };

  const submit = async (next: Preferences) => {
    const problem = validate();
    if (problem) return setError(problem);
    setBusy(true);
    try {
      await onSave(next);
    } catch {
      setError('That didn’t save. Try again.');
      setBusy(false);
    }
  };

  const clear = () => {
    if (editing.kind === 'rule') void submit({ ...draft, [editing.key]: null });
    if (editing.kind === 'height') void submit({ ...draft, height: null });
  };

  const setRule = (values: string[] | null, mode?: FilterMode) => {
    if (editing.kind !== 'rule') return;
    setDraft({ ...draft, [editing.key]: values === null ? null : { values, mode: mode ?? rule?.mode ?? 'preference' } });
  };

  return (
    <BottomSheet
      open
      onClose={onClose}
      title={title}
      footer={
        <>
          {error && <p className="field__error" role="alert">{error}</p>}
          <Button size="lg" block onClick={() => void submit(draft)} disabled={busy}>Save</Button>
          {optional && (rule || (editing.kind === 'height' && draft.height)) && (
            <Button variant="quiet" block onClick={clear}>Clear filter</Button>
          )}
        </>
      }
    >
      <div className="filter-sheet">
        {editing.kind === 'showMe' && (
          <>
            <ChoiceList multiple legend="Show me" hideLegend options={MEET_OPTIONS} value={draft.interestedIn} onChange={(v) => setDraft({ ...draft, interestedIn: v as Gender[] })} />
            <p className="settings__note">This is always applied.</p>
          </>
        )}

        {editing.kind === 'age' && (
          <>
            <RangeField label="Youngest" value={draft.age.min} min={L.minAge} max={80} onChange={(v) => setDraft({ ...draft, age: { ...draft.age, min: v, max: Math.max(v, draft.age.max) } })} format={(v) => `${v}`} />
            <RangeField
              label="Oldest"
              value={Math.min(draft.age.max, 80)}
              min={L.minAge}
              max={80}
              onChange={(v) => setDraft({ ...draft, age: { ...draft.age, max: v >= 80 ? L.maxAge : v, min: Math.min(v, draft.age.min) } })}
              format={(v) => (v >= 80 ? '80+' : `${v}`)}
            />
            <ModeToggle legend="How strict is age?" value={draft.age.mode} onChange={(mode) => setDraft({ ...draft, age: { ...draft.age, mode } })} />
          </>
        )}

        {editing.kind === 'distance' && (
          <>
            <RangeField
              label="Preferred distance"
              value={draft.distance.preferredKm}
              min={L.distanceMinKm}
              max={L.distanceMaxKm}
              onChange={(v) => setDraft({ ...draft, distance: { preferredKm: v, maxKm: Math.max(v, draft.distance.maxKm) } })}
              format={(v) => `${v} km`}
              hint="A preference. People a bit further away can still appear, lower down."
            />
            <RangeField
              label="Hard maximum"
              value={draft.distance.maxKm}
              min={L.distanceMinKm}
              max={L.distanceMaxKm}
              onChange={(v) => setDraft({ ...draft, distance: { maxKm: v, preferredKm: Math.min(v, draft.distance.preferredKm) } })}
              format={(v) => `${v} km`}
              hint="A dealbreaker. Nobody further away will appear."
            />
          </>
        )}

        {editing.kind === 'height' && (
          <>
            {!draft.height ? (
              <Button variant="secondary" onClick={() => setDraft({ ...draft, height: { minCm: 160, maxCm: 190, mode: 'preference' } })}>Set a height range</Button>
            ) : (
              <>
                <RangeField label="Shortest" value={draft.height.minCm} min={L.heightMinCm} max={L.heightMaxCm} onChange={(v) => setDraft({ ...draft, height: { ...draft.height!, minCm: v, maxCm: Math.max(v, draft.height!.maxCm) } })} format={(v) => `${v} cm`} />
                <RangeField label="Tallest" value={draft.height.maxCm} min={L.heightMinCm} max={L.heightMaxCm} onChange={(v) => setDraft({ ...draft, height: { ...draft.height!, maxCm: v, minCm: Math.min(v, draft.height!.minCm) } })} format={(v) => `${v} cm`} />
                <ModeToggle legend="How strict is height?" value={draft.height.mode} onChange={(mode) => setDraft({ ...draft, height: { ...draft.height!, mode } })} />
              </>
            )}
          </>
        )}

        {editing.kind === 'rule' && (
          <>
            {!rule ? (
              <>
                <p className="settings__note">No preference. Everyone is shown regardless of {RULE_FILTERS[editing.key].title.toLowerCase()}.</p>
                <Button variant="secondary" onClick={() => setRule(RULE_FILTERS[editing.key].options.map((o) => o.value))}>Set a filter</Button>
              </>
            ) : (
              <>
                <ChipSelect legend={RULE_FILTERS[editing.key].question} options={RULE_FILTERS[editing.key].options} value={rule.values} onChange={(v) => setRule(v)} />
                <ModeToggle legend={`How strict is ${RULE_FILTERS[editing.key].title.toLowerCase()}?`} value={rule.mode} onChange={(mode) => setRule(rule.values, mode)} />
              </>
            )}
          </>
        )}
      </div>
    </BottomSheet>
  );
}
