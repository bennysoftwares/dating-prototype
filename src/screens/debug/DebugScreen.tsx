import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router';
import { NAV_ITEMS } from '../../app/navigation';
import { Screen, Section } from '../../components/layout';
import { Button, Card, IconButton, ListGroup, ListRow, SegmentedControl } from '../../components/ui';
import { brand } from '../../config/brand';
import { DB_SCHEMA_VERSION, localDb } from '../../repositories/local/localDb';
import { storage } from '../../storage/storage';
import { useTheme, type ThemePreference } from '../../theme/ThemeProvider';
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

  useEffect(() => storage.subscribe(() => setKeys(storage.keys())), []);

  const meta = localDb.meta();
  const counts = {
    profiles: localDb.profiles().length,
    matches: localDb.matches().length,
    messages: localDb.messages().length,
  };

  const resetDemoData = () => {
    localDb.reset();
    window.location.reload();
  };

  const clearAll = () => {
    if (!window.confirm('Clear all locally stored prototype data?')) return;
    storage.clearAll();
    window.location.reload();
  };

  return (
    <Screen
      title="Developer"
      eyebrow="Hidden panel"
      actions={<IconButton icon="close" label="Close developer panel" onClick={() => navigate(-1)} />}
      className="debug"
    >
      <Section title="Build">
        <ListGroup label="Build info">
          <ListRow title={brand.name} subtitle={`v${brand.version} · ${import.meta.env.MODE}`} />
          <ListRow title="Data schema" subtitle={`v${DB_SCHEMA_VERSION} · seeded ${meta ? new Date(meta.seededAt).toLocaleString() : 'never'}`} />
          <ListRow title="Mock data" subtitle={`${counts.profiles} profiles · ${counts.matches} matches · ${counts.messages} messages`} />
        </ListGroup>
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
          <Button variant="secondary" icon="refresh" onClick={resetDemoData} block>Reset demo data</Button>
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
