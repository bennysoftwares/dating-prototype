import { useState } from 'react';
import { useNavigate } from 'react-router';
import { ROUTES } from '../../app/navigation';
import { TextField } from '../../components/form';
import { Screen, Section } from '../../components/layout';
import { BottomSheet, Button, IconButton, ListGroup, ListRow, SegmentedControl, useToast } from '../../components/ui';
import { brand } from '../../config/brand';
import { useConnections } from '../../connections/ConnectionsProvider';
import { useAsync } from '../../hooks/useAsync';
import { useOwnProfile } from '../../hooks/useOwnProfile';
import { useRepositories } from '../../repositories/RepositoryContext';
import { useAccount } from '../../session/useAccount';
import { useSession } from '../../session/SessionProvider';
import { useTheme, type ThemePreference } from '../../theme/ThemeProvider';
import './Settings.css';

const THEME_OPTIONS: { value: ThemePreference; label: string; icon: 'device' | 'sun' | 'moon' }[] = [
  { value: 'system', label: 'System', icon: 'device' },
  { value: 'light', label: 'Light', icon: 'sun' },
  { value: 'dark', label: 'Dark', icon: 'moon' },
];

/** One calm place for account, privacy, safety and app settings. */
export function SettingsScreen() {
  const navigate = useNavigate();
  const toast = useToast();
  const { account, safety } = useRepositories();
  const { refresh } = useSession();
  const { paused, incognito } = useAccount();
  const { conversations } = useConnections();
  const { preference, setPreference } = useTheme();
  const own = useOwnProfile();
  const blocks = useAsync(() => safety.listBlocks(), [safety]);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [confirmText, setConfirmText] = useState('');

  const verification = own.status === 'success' ? own.data.profile?.verification : undefined;
  const verifiedLabel = verification?.photo === 'verified' ? (verification.id === 'verified' ? 'Photo and ID verified' : 'Photo verified') : 'Not verified';
  const archivedCount = conversations.filter((c) => c.state === 'archived').length;

  const download = async () => {
    const data = await account.exportData();
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${brand.storageNamespace}-my-data.json`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
    toast({ message: 'Your data was downloaded' });
  };

  const deleteAccount = async () => {
    await account.deleteAccount();
    setDeleteOpen(false);
    await refresh();
    navigate('/welcome', { replace: true });
  };

  return (
    <Screen title="Settings" leading={<IconButton icon="chevronLeft" label="Back to profile" onClick={() => navigate(ROUTES.profile)} />}>
      <Section title="Account">
        <ListGroup label="Account">
          <ListRow icon="user" title="Profile status" subtitle={paused ? 'Paused · hidden from Discover' : incognito ? 'Active · Incognito' : 'Active'} to={ROUTES.privacy} chevron />
          <ListRow icon="verified" title="Verification" subtitle={verifiedLabel} to={ROUTES.verification} chevron />
          <ListRow icon="edit" title="Edit profile" to={ROUTES.profileEdit} chevron />
        </ListGroup>
      </Section>

      <Section title="Dating">
        <ListGroup label="Dating">
          <ListRow icon="filter" title="Filters & dealbreakers" subtitle="Age, distance, intention and more" to={ROUTES.filters} chevron />
        </ListGroup>
      </Section>

      <Section title="Privacy & safety">
        <ListGroup label="Privacy and safety">
          <ListRow icon="eyeOff" title="Privacy & visibility" subtitle="Incognito, pause, distance, profile fields" to={ROUTES.privacy} chevron />
          <ListRow icon="shield" title="Safety" subtitle="Tips, reporting and your reports" to={ROUTES.safety} chevron />
          <ListRow icon="users" title="Blocked users" subtitle={blocks.status === 'success' ? `${blocks.data.length} blocked` : ' '} to={ROUTES.blocked} chevron />
          <ListRow icon="archive" title="Archived matches" subtitle={`${archivedCount} archived`} to={ROUTES.archived} chevron />
        </ListGroup>
      </Section>

      <Section title="Appearance">
        <SegmentedControl legend="Theme" value={preference} options={THEME_OPTIONS} onChange={setPreference} />
      </Section>

      <Section title="Notifications">
        <ListGroup label="Notifications">
          <ListRow icon="bell" title="Notifications" subtitle="Coming later. The prototype never sends notifications." />
        </ListGroup>
      </Section>

      <Section title="Your data">
        <ListGroup label="Your data">
          <ListRow icon="download" title="Download my data" subtitle="Everything stored about you, as a JSON file" onClick={() => void download()} />
          <ListRow icon="trash" title={<span className="settings__danger">Delete account</span>} subtitle="Prototype: clears everything on this device" onClick={() => setDeleteOpen(true)} />
        </ListGroup>
      </Section>

      <BottomSheet
        open={deleteOpen}
        onClose={() => setDeleteOpen(false)}
        title="Delete your account?"
        description="This removes your profile, matches and messages. It can't be undone."
        footer={
          <>
            <Button size="lg" block disabled={confirmText.trim().toUpperCase() !== 'DELETE'} onClick={() => void deleteAccount()}>
              Delete account
            </Button>
            <Button variant="quiet" block onClick={() => setDeleteOpen(false)}>Keep my account</Button>
          </>
        }
      >
        <div className="filter-sheet">
          <p className="settings__note">If you just need a break, you can pause your profile instead. Your matches stay.</p>
          <TextField id="confirmDelete" label="Type DELETE to confirm" value={confirmText} onChange={setConfirmText} autoCapitalize="characters" autoComplete="off" />
        </div>
      </BottomSheet>
    </Screen>
  );
}
