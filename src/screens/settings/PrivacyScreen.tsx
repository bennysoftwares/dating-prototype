import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router';
import { Switch } from '../../components/form';
import { Screen, Section } from '../../components/layout';
import { ErrorState, IconButton, LoadingRegion, Skeleton, useToast } from '../../components/ui';
import type { FieldVisibility, PrivacySettings, Profile, VisibleField } from '../../domain/types';
import { useAsync } from '../../hooks/useAsync';
import { useRepositories } from '../../repositories/RepositoryContext';
import { useAccount } from '../../session/useAccount';
import './Settings.css';

const FIELDS: { field: VisibleField; label: string }[] = [
  { field: 'height', label: 'Height' },
  { field: 'job', label: 'Job' },
  { field: 'education', label: 'Education' },
  { field: 'drinking', label: 'Drinking' },
  { field: 'smoking', label: 'Smoking' },
  { field: 'children', label: 'Children' },
  { field: 'religion', label: 'Religion' },
  { field: 'politics', label: 'Politics' },
];

/** Privacy & Visibility: who can see you, and what they see. */
export function PrivacyScreen() {
  const navigate = useNavigate();
  const toast = useToast();
  const { profiles, account } = useRepositories();
  const { paused, incognito, setPaused, setIncognito } = useAccount();
  const state = useAsync(async () => ({ profile: await profiles.getCurrentProfile(), privacy: await account.getPrivacy() }), [profiles, account]);
  const [profile, setProfile] = useState<Profile | null>(null);
  // Switches flip immediately; the account state catches up when the save completes.
  const [incognitoOn, setIncognitoOn] = useState(incognito);
  const [pausedOn, setPausedOn] = useState(paused);
  useEffect(() => setIncognitoOn(incognito), [incognito]);
  useEffect(() => setPausedOn(paused), [paused]);
  const [privacy, setPrivacy] = useState<PrivacySettings | null>(null);

  useEffect(() => {
    if (state.status === 'success') {
      setProfile(state.data.profile);
      setPrivacy(state.data.privacy);
    }
  }, [state.status, state.data]);

  const saveProfile = async (patch: Partial<Profile>) => {
    if (!profile) return;
    const next = { ...profile, ...patch };
    setProfile(next);
    try {
      await profiles.saveCurrentProfile(next);
    } catch {
      setProfile(profile);
      toast({ message: 'That didn’t save. Try again.' });
    }
  };

  const setField = (field: VisibleField, on: boolean) => {
    const visibility: FieldVisibility = { ...profile?.visibility, [field]: on };
    void saveProfile({ visibility });
  };

  return (
    <Screen title="Privacy" leading={<IconButton icon="chevronLeft" label="Back" onClick={() => navigate(-1)} />}>
      {state.status === 'loading' && <LoadingRegion label="Loading"><Skeleton height={240} /></LoadingRegion>}
      {state.status === 'error' && <ErrorState onRetry={state.retry} />}
      {profile && privacy && (
        <>
          <Section title="Visibility">
            <div className="settings__switches">
              <Switch
                label="Incognito mode"
                description="When enabled, only people you like can see your profile."
                checked={incognitoOn}
                onChange={(on) => {
                  setIncognitoOn(on);
                  setIncognito(on).then(
                    () => toast({ message: on ? 'Incognito is on' : 'Incognito is off' }),
                    () => {
                      setIncognitoOn(!on);
                      toast({ message: 'That didn’t save. Try again.' });
                    },
                  );
                }}
              />
              <Switch
                label="Pause profile"
                description="Stop appearing in Discover without deleting matches. Your conversations stay."
                checked={pausedOn}
                onChange={(on) => {
                  setPausedOn(on);
                  setPaused(on).then(
                    () => toast({ message: on ? 'Your profile is paused' : 'Your profile is visible again' }),
                    () => {
                      setPausedOn(!on);
                      toast({ message: 'That didn’t save. Try again.' });
                    },
                  );
                }}
              />
            </div>
          </Section>

          <Section title="Location" description="We never show your precise location. Other people only see an approximate distance, like “8 km away”.">
            <div className="settings__switches">
              <Switch
                label="Hide distance"
                description="Don't show how far away you are on your profile."
                checked={Boolean(profile.hideDistance)}
                onChange={(on) => void saveProfile({ hideDistance: on })}
              />
            </div>
          </Section>

          <Section title="Show on profile" description="Hidden answers are never shown to anyone. If someone's dealbreaker depends on a hidden answer, you won't appear for them.">
            <div className="settings__switches">
              {FIELDS.map(({ field, label }) => (
                <Switch key={field} label={label} checked={profile.visibility[field] !== false} onChange={(on) => setField(field, on)} compact={false} />
              ))}
            </div>
          </Section>

          <Section title="Contacts">
            <div className="settings__switches">
              <Switch
                label="Hide from contacts"
                description="Don't show my profile to people in my phone's contacts, and don't show them to me."
                checked={privacy.hideFromContacts}
                onChange={(on) => {
                  const next = { ...privacy, hideFromContacts: on };
                  setPrivacy(next);
                  void account.savePrivacy(next);
                }}
              />
            </div>
            <p className="settings__note">
              <span className="settings__badge">Prototype</span> Contacts are never uploaded in this prototype. A real version would match hashed phone numbers on your device.
            </p>
          </Section>

          <Section title="Messaging">
            <p className="settings__note">Read receipts are off and your activity status is hidden. Nobody can see when you were last online or whether you've read their message.</p>
          </Section>
        </>
      )}
    </Screen>
  );
}
