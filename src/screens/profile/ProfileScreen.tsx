import { useRef } from 'react';
import { useNavigate } from 'react-router';
import { ROUTES } from '../../app/navigation';
import { Screen, Section } from '../../components/layout';
import { ProfileHeroCard } from '../../components/profile/ProfileHeroCard';
import { Button, ErrorState, ListGroup, ListRow, LoadingRegion, SegmentedControl, Skeleton } from '../../components/ui';
import { brand } from '../../config/brand';
import { getInterest } from '../../domain/interest';
import { useAsync } from '../../hooks/useAsync';
import { useRepositories } from '../../repositories/RepositoryContext';
import { useTheme, type ThemePreference } from '../../theme/ThemeProvider';
import { PROFILE_LIMITS } from '../../domain/profileOptions';
import { intentLabel } from '../../utils/profileFormat';
import './ProfileScreen.css';

const THEME_OPTIONS: { value: ThemePreference; label: string; icon: 'device' | 'sun' | 'moon' }[] = [
  { value: 'system', label: 'System', icon: 'device' },
  { value: 'light', label: 'Light', icon: 'sun' },
  { value: 'dark', label: 'Dark', icon: 'moon' },
];

/** Tap the version line this many times to open the hidden developer panel. */
const DEBUG_TAPS = 5;

export function ProfileScreen() {
  const { profiles } = useRepositories();
  const { preference, setPreference } = useTheme();
  const navigate = useNavigate();
  const taps = useRef({ count: 0, last: 0 });

  const state = useAsync(async () => {
    return profiles.getCurrentProfile();
  }, [profiles]);

  const onVersionTap = () => {
    const now = Date.now();
    taps.current.count = now - taps.current.last < 600 ? taps.current.count + 1 : 1;
    taps.current.last = now;
    if (taps.current.count >= DEBUG_TAPS) {
      taps.current.count = 0;
      navigate(ROUTES.debug);
    }
  };

  return (
    <Screen title="Profile">
      {state.status === 'loading' && (
        <LoadingRegion label="Loading your profile">
          <Skeleton ratio="4 / 5" className="profile__hero-skeleton" />
        </LoadingRegion>
      )}
      {state.status === 'error' && <ErrorState onRetry={state.retry} />}
      {state.status === 'success' && !state.data && <ErrorState message="We couldn't find your profile." onRetry={state.retry} />}

      {state.status === 'success' && state.data && (
        <>
          <ProfileHeroCard profile={state.data} as="div" />
          <div className="profile__actions">
            <Button icon="edit" size="lg" block onClick={() => navigate(ROUTES.profileEdit)}>Edit profile</Button>
            <Button icon="eye" size="lg" variant="secondary" block onClick={() => navigate(ROUTES.profilePreview)}>Preview</Button>
          </div>
          <Section title="Your profile">
            <ListGroup label="Profile summary">
              <ListRow icon="camera" title="Photos" subtitle={`${state.data.photos.length} of ${PROFILE_LIMITS.photosMax}`} to={ROUTES.profileEditStep('photos')} chevron />
              <ListRow icon="edit" title="Prompts" subtitle={`${state.data.prompts.length} of ${PROFILE_LIMITS.promptsMax} answered`} to={ROUTES.profileEditStep('prompts')} chevron />
              <ListRow icon="sparkle" title="Interests" subtitle={state.data.interests.map((id) => getInterest(id).label).join(', ')} to={ROUTES.profileEditStep('interests')} chevron />
              <ListRow icon="heart" title="Looking for" subtitle={intentLabel(state.data)} to={ROUTES.profileEditStep('intent')} chevron />
            </ListGroup>
          </Section>
        </>
      )}

      <Section title="Appearance">
        <SegmentedControl legend="Theme" value={preference} options={THEME_OPTIONS} onChange={setPreference} />
      </Section>

      <footer className="profile__footer">
        <button type="button" className="profile__version" onClick={onVersionTap}>
          {brand.name} · v{brand.version}
        </button>
      </footer>
    </Screen>
  );
}
