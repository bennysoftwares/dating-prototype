import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router';
import { NAV_ITEMS } from '../../app/navigation';
import { Screen, Section } from '../../components/layout';
import { Button, Card, IconButton, ListGroup, ListRow, SegmentedControl } from '../../components/ui';
import { brand } from '../../config/brand';
import { createDemoPreferences, createDemoProfile } from '../../data/mock';
import { profileToDraft } from '../../onboarding/draft';
import { DB_SCHEMA_VERSION, localDb } from '../../repositories/local/localDb';
import { STORAGE_KEYS } from '../../storage/keys';
import { storage } from '../../storage/storage';
import { useTheme, type ThemePreference } from '../../theme/ThemeProvider';
import { DebugRecommendations } from './DebugRecommendations';
import { SafeAreaReadout } from './SafeAreaReadout';
import './DebugScreen.css';

/**
 * Hidden developer panel (`#/debug`, or tap the version line on Profile 5×).
 * Later parts add recommendation scores, simulated likes/matches and account states.
 */
export function DebugScreen() {
  const navigate = useNavigate();
  const { preference, resolved, setPreference } = useTheme();
  const [keys, setKeys] = useState(() => storage.keys());
  const [recVersion, setRecVersion] = useState(0);

  useEffect(() => storage.subscribe(() => setKeys(storage.keys())), []);

  const meta = localDb.meta();
  const counts = {
    profiles: localDb.profiles().length,
    matches: localDb.matches().length,
    messages: localDb.messages().length,
  };

  const user = localDb.user();
  const draftExists = storage.raw(STORAGE_KEYS.onboardingDraft.key) !== null;

  /** Data actions change the account state, so reload into the right place. */
  const reloadTo = (hash: string) => {
    window.location.hash = hash;
    window.location.reload();
  };

  const resetDemoData = () => {
    localDb.reset();
    reloadTo('#/welcome');
  };

  const loadDemo = () => {
    localDb.loadDemoUser();
    reloadTo('#/profile');
  };

  const restartOnboarding = () => {
    localDb.restartOnboarding();
    reloadTo('#/welcome');
  };

  const prefillDraft = () => {
    localDb.restartOnboarding();
    const draft = profileToDraft(createDemoProfile(new Date().toISOString()), createDemoPreferences());
    const { photos, ...rest } = draft;
    storage.set(STORAGE_KEYS.onboardingDraft.key, { ...rest, lastStepId: 'bio' }, STORAGE_KEYS.onboardingDraft.version);
    storage.set(STORAGE_KEYS.onboardingPhotos.key, photos, STORAGE_KEYS.onboardingPhotos.version);
    reloadTo('#/onboarding/preview');
  };

  const clearAll = () => {
    if (!window.confirm('Clear all locally stored prototype data?')) return;
    storage.clearAll();
    reloadTo('#/welcome');
  };

  return (
    <Screen
      title="Developer"
      eyebrow="Hidden panel"
      actions={<IconButton icon="close" label="Close developer panel" onClick={() => navigate(user?.onboardingComplete ? '/profile' : '/welcome')} />}
      className="debug"
    >
      <Section title="Build">
        <ListGroup label="Build info">
          <ListRow title={brand.name} subtitle={`v${brand.version} · ${import.meta.env.MODE}`} />
          <ListRow title="Data schema" subtitle={`v${DB_SCHEMA_VERSION} · seeded ${meta ? new Date(meta.seededAt).toLocaleString() : 'never'}`} />
          <ListRow title="Mock data" subtitle={`${counts.profiles} profiles · ${counts.matches} matches · ${counts.messages} messages`} />
        </ListGroup>
      </Section>

      <Section title="Account & onboarding">
        <ListGroup label="Onboarding status">
          <ListRow title="Onboarding" trailing={user?.onboardingComplete ? 'Complete' : 'Not complete'} />
          <ListRow title="Saved onboarding draft" trailing={draftExists ? 'Yes' : 'None'} />
        </ListGroup>
        <div className="debug__actions">
          <Button variant="secondary" icon="user" onClick={loadDemo} block>Load demo user (Alex)</Button>
          <Button variant="secondary" icon="refresh" onClick={restartOnboarding} block>Restart onboarding (blank)</Button>
          <Button variant="secondary" icon="edit" onClick={prefillDraft} block>Prefill onboarding with Alex</Button>
        </div>
      </Section>

      <Section title="Recommendations" description="Scores are for development only. People never see numbers.">
        <div className="debug__actions">
          <Button variant="secondary" icon="refresh" onClick={() => { localDb.writeDailyPicks(null); setRecVersion((v) => v + 1); }} block>Regenerate today's picks</Button>
          <Button variant="secondary" icon="undo" onClick={() => { localDb.resetDiscovery(); setRecVersion((v) => v + 1); }} block>Reset likes, passes and picks</Button>
        </div>
        <DebugRecommendations version={recVersion} />
      </Section>

      <Section title="Theme" description={`Resolved: ${resolved}`}>
        <SegmentedControl<ThemePreference>
          legend="Theme"
          value={preference}
          onChange={setPreference}
          options={[
            { value: 'system', label: 'System' },
            { value: 'light', label: 'Light' },
            { value: 'dark', label: 'Dark' },
          ]}
        />
      </Section>

      <Section title="Viewport & safe areas">
        <SafeAreaReadout />
      </Section>

      <Section title="Routes">
        <ListGroup label="Routes">
          {NAV_ITEMS.map((item) => (
            <ListRow key={item.to} icon={item.icon} title={item.label} subtitle={`#${item.to}`} to={item.to} chevron />
          ))}
        </ListGroup>
      </Section>

      <Section title={`Local storage (${keys.length})`}>
        <Card padded={false}>
          {keys.length === 0 && <p className="debug__empty">Nothing stored yet.</p>}
          {keys.map((k) => {
            const raw = storage.raw(k) ?? '';
            return (
              <details key={k} className="debug__key">
                <summary>
                  <code>{brand.storageNamespace}:{k}</code>
                  <span>{(raw.length / 1024).toFixed(1)} KB</span>
                </summary>
                <pre>{prettyJson(raw)}</pre>
              </details>
            );
          })}
        </Card>
      </Section>

      <Section title="Actions">
        <div className="debug__actions">
          <Button variant="secondary" icon="refresh" onClick={resetDemoData} block>Reset demo data (fresh account)</Button>
          <Button variant="quiet" onClick={clearAll} block>Clear all local data</Button>
        </div>
      </Section>
    </Screen>
  );
}

function prettyJson(raw: string): string {
  try {
    return JSON.stringify(JSON.parse(raw), null, 2);
  } catch {
    return raw;
  }
}
