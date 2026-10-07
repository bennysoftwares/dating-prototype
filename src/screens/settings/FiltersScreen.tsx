import { useCallback, useEffect, useRef, useState, type CSSProperties } from 'react';
import { useNavigate } from 'react-router';
import { ROUTES } from '../../app/navigation';
import { ChipSelect, ChoiceList, ModeToggle, RangeField, RangeSlider, Switch } from '../../components/form';
import { Screen, Section } from '../../components/layout';
import { BottomSheet, Button, ErrorState, IconButton, ListGroup, ListRow, LoadingRegion, SettingsCard, Skeleton, useToast, type IconName } from '../../components/ui';
import { DATING_INTENT_INFO } from '../../domain/intent';
import { useBack } from '../onboarding/useStepNavigation';
import { useDiscovery } from '../../discovery/DiscoveryProvider';
import { MEET_OPTIONS, PROFILE_LIMITS as L } from '../../domain/profileOptions';
import type { FilterMode, Gender, Preferences } from '../../domain/types';
import { useAsync } from '../../hooks/useAsync';
import { useRepositories } from '../../repositories/RepositoryContext';
import { ADDITIONAL_KEYS, getRule, heightSummary, ruleSummary, RULE_FILTERS, showMeSummary, type RuleKey } from './filterConfig';
import './Settings.css';

type Editing = { kind: 'showMe' | 'age' | 'distance' | 'height' } | { kind: 'rule'; key: RuleKey } | null;

const SAVE_DELAY_MS = 450;

/**
 * Discovery settings: who you see in Explore and Standouts. Sliders and switches save as you
 * go (Explore refills from the new pool); list-style filters open a sheet. Preferences rank
 * people higher without excluding anyone; dealbreakers remove people outside them entirely.
 */
export function FiltersScreen() {
  const navigate = useNavigate();
  const back = useBack();
  const toast = useToast();
  const { users, profiles } = useRepositories();
  const discovery = useDiscovery();
  const state = useAsync(() => users.getPreferences(), [users]);
  const own = useAsync(() => profiles.getCurrentProfile(), [profiles]);
  const [prefs, setPrefs] = useState<Preferences | null>(null);
  const [editing, setEditing] = useState<Editing>(null);
  const [draft, setDraft] = useState<Preferences | null>(null);
  const [status, setStatus] = useState('');

  useEffect(() => {
    if (state.status === 'success') setPrefs(state.data);
  }, [state.status, state.data]);

  // Inline controls save shortly after the last change, and always before leaving.
  const latest = useRef<Preferences | null>(null);
  const timer = useRef<number | undefined>(undefined);
  const flush = useCallback(async () => {
    window.clearTimeout(timer.current);
    timer.current = undefined;
    const next = latest.current;
    if (!next) return;
    latest.current = null;
    try {
      await users.savePreferences(next);
      setStatus('Saved');
      void discovery.refresh();
    } catch {
      toast({ message: 'That didn’t save. Try again.' });
    }
  }, [users, discovery, toast]);
  const flushRef = useRef(flush);
  flushRef.current = flush;
  useEffect(() => () => void flushRef.current(), []);

  const change = (next: Preferences, immediate = false) => {
    setPrefs(next);
    setStatus('');
    latest.current = next;
    window.clearTimeout(timer.current);
    if (immediate) void flush();
    else timer.current = window.setTimeout(() => void flush(), SAVE_DELAY_MS);
  };

  const open = (e: Editing) => {
    setDraft(prefs);
    setEditing(e);
  };

  const save = async (next: Preferences) => {
    await users.savePreferences(next);
    setPrefs(next);
    setEditing(null);
    void discovery.refresh();
    toast({ message: 'Discovery settings updated' });
  };

  const done = () => {
    void flush();
    back(ROUTES.explore);
  };

  const location = own.status === 'success' && own.data ? `${own.data.location.city}, ${own.data.location.country}` : '';
  const ageMax = prefs && prefs.age.max >= 80 ? 80 : prefs?.age.max ?? 80;
  const minPhotos = prefs?.minPhotos ?? 1;

  return (
    <Screen
      title="Discovery settings"
      subtitle="Choose who you see in Explore and Standouts."
      leading={<IconButton icon="chevronLeft" label="Back" onClick={done} />}
      actions={<Button variant="quiet" onClick={done} className="settings__done">Done</Button>}
      className="screen--compact-title"
    >
      <p className="visually-hidden" role="status">{status}</p>
      {state.status === 'loading' && (
        <LoadingRegion label="Loading discovery settings"><Skeleton height={320} /></LoadingRegion>
      )}
      {state.status === 'error' && <ErrorState onRetry={state.retry} />}
      {prefs && (
        <>
          <div className="scard-list">
            <SettingsCard icon="pin" title="Location" description={location || 'Your town or city'} onClick={() => navigate(ROUTES.profileEditStep('location'))} />

            <SettingsCard icon="target" title="Max distance" description="Show people up to this distance away." value={`${prefs.distance.maxKm} km`}>
              <input
                type="range"
                className="range"
                aria-label="Maximum distance"
                aria-valuetext={`${prefs.distance.maxKm} km`}
                min={L.distanceMinKm}
                max={L.distanceMaxKm}
                value={prefs.distance.maxKm}
                style={{ '--range-pct': `${((prefs.distance.maxKm - L.distanceMinKm) / (L.distanceMaxKm - L.distanceMinKm)) * 100}%` } as CSSProperties}
                onChange={(e) => {
                  const maxKm = Number(e.target.value);
                  change({ ...prefs, distance: { maxKm, preferredKm: Math.min(prefs.distance.preferredKm, maxKm) } });
                }}
              />
            </SettingsCard>

            <SettingsCard icon="users" title="Interested in" description="Who you'd like to meet." value={showMeSummary(prefs)} onClick={() => open({ kind: 'showMe' })} />

            <SettingsCard icon="cake" title="Age range" description="Show people in this age range." value={`${prefs.age.min} – ${ageMax >= 80 ? '80+' : ageMax}`}>
              <RangeSlider
                labels={['Youngest age', 'Oldest age']}
                value={[prefs.age.min, ageMax]}
                min={L.minAge}
                max={80}
                format={(v) => (v >= 80 ? '80 or older' : `${v}`)}
                onChange={([min, max]) => change({ ...prefs, age: { ...prefs.age, min, max: max >= 80 ? L.maxAge : max } })}
              />
              <Switch
                compact
                label="Only show people in this range"
                description={prefs.age.mode === 'dealbreaker' ? 'Nobody outside it appears.' : 'Off: people just outside rank lower but can still appear.'}
                checked={prefs.age.mode === 'dealbreaker'}
                onChange={(on) => change({ ...prefs, age: { ...prefs.age, mode: on ? 'dealbreaker' : 'preference' } }, true)}
              />
            </SettingsCard>

            <SettingsCard
              icon="heart"
              title="Relationship goals"
              description={!prefs.intents ? "Choose what you're open to." : prefs.intents.mode === 'dealbreaker' ? 'Dealbreaker: only these goals appear.' : 'Preference: these goals rank higher.'}
              value={goalsSummary(prefs)} onClick={() => open({ kind: 'rule', key: 'intents' })} />
          </div>

          <Section title="Profile preferences">
            <div className="scard-list">
              <SettingsCard
                icon="shield"
                title="Verified profiles only"
                description="Only show people who are photo verified."
                control={<input type="checkbox" role="switch" className="switch" checked={Boolean(prefs.verifiedOnly)} onChange={(e) => change({ ...prefs, verifiedOnly: e.target.checked }, true)} />}
              />
              <SettingsCard
                icon="document"
                title="Has a bio"
                description="Only show people who have written a bio."
                control={<input type="checkbox" role="switch" className="switch" checked={Boolean(prefs.requireBio)} onChange={(e) => change({ ...prefs, requireBio: e.target.checked }, true)} />}
              />
              <SettingsCard icon="image" title="Minimum number of photos" description="Show people with at least this many photos." value={minPhotos}>
                <input
                  type="range"
                  className="range"
                  aria-label="Minimum number of photos"
                  min={1}
                  max={6}
                  value={minPhotos}
                  style={{ '--range-pct': `${((minPhotos - 1) / 5) * 100}%` } as CSSProperties}
                  onChange={(e) => change({ ...prefs, minPhotos: Number(e.target.value) })}
                />
              </SettingsCard>
            </div>
          </Section>

          <Section title="More filters" description="Each one can be a preference (ranks higher) or a dealbreaker (excludes).">
            <ListGroup label="More filters">
              <ListRow icon="pin" title="Preferred distance" subtitle={`Closer than ${prefs.distance.preferredKm} km ranks higher`} onClick={() => open({ kind: 'distance' })} chevron />
              {ADDITIONAL_KEYS.slice(0, 6).map((key) => (
                <ListRow key={key} icon={RULE_ICONS[key]} title={RULE_FILTERS[key].title} subtitle={ruleSummary(prefs, key)} onClick={() => open({ kind: 'rule', key })} chevron />
              ))}
              <ListRow icon="ruler" title="Height" subtitle={heightSummary(prefs)} onClick={() => open({ kind: 'height' })} chevron />
              <ListRow icon="graduation" title="Education" subtitle={ruleSummary(prefs, 'education')} onClick={() => open({ kind: 'rule', key: 'education' })} chevron />
            </ListGroup>
          </Section>
          <p className="settings__note">Filters only use what people choose to show. If a dealbreaker field is hidden on someone's profile, they won't appear.</p>
        </>
      )}

      {draft && editing && <FilterSheet editing={editing} draft={draft} setDraft={setDraft} onClose={() => setEditing(null)} onSave={save} />}
    </Screen>
  );
}

const RULE_ICONS: Record<RuleKey, IconName> = {
  intents: 'heart',
  children: 'home',
  wantsChildren: 'baby',
  smoking: 'smoke',
  drinking: 'wine',
  religion: 'sparkle',
  politics: 'flag',
  education: 'graduation',
};

function goalsSummary(prefs: Preferences): string {
  if (!prefs.intents) return 'Open to all';
  const labels = prefs.intents.values.map((v) => DATING_INTENT_INFO[v].label);
  return labels.length > 1 ? `${labels[0]} +${labels.length - 1}` : labels[0] ?? 'Open to all';
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
