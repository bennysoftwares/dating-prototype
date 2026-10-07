import { useRef } from 'react';
import { Link, useNavigate } from 'react-router';
import { ROUTES } from '../../app/navigation';
import { Screen, Section } from '../../components/layout';
import { ProfileHeroCard } from '../../components/profile/ProfileHeroCard';
import { Button, ErrorState, Icon, IconButton, ListGroup, ListRow, LoadingRegion, Skeleton } from '../../components/ui';
import { brand } from '../../config/brand';
import { getInterest } from '../../domain/interest';
import { useAsync } from '../../hooks/useAsync';
import { useRepositories } from '../../repositories/RepositoryContext';
import { useAccount } from '../../session/useAccount';
import { PROFILE_LIMITS } from '../../domain/profileOptions';
import { intentLabel } from '../../utils/profileFormat';
import './ProfileScreen.css';


/** Tap the version line this many times to open the hidden developer panel. */
const DEBUG_TAPS = 5;

export function ProfileScreen() {
  const { profiles } = useRepositories();
  const { paused, incognito } = useAccount();
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
    <Screen title="Profile" actions={<IconButton icon="settings" label="Settings" onClick={() => navigate(ROUTES.settings)} />}>
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
          {(paused || incognito || state.data.verification?.photo === 'verified') && (
            <ul className="profile__status" role="list" aria-label="Account status">
              {paused && <li><Link to={ROUTES.privacy} className="profile__status-chip"><Icon name="pause" size={16} /> Paused</Link></li>}
              {incognito && <li><Link to={ROUTES.privacy} className="profile__status-chip"><Icon name="incognito" size={16} /> Incognito</Link></li>}
              {state.data.verification?.photo === 'verified' && <li><Link to={ROUTES.verification} className="profile__status-chip profile__status-chip--ok"><Icon name="verified" size={16} /> Photo verified</Link></li>}
            </ul>
          )}
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

      <Section title="More">
        <ListGroup label="More">
          <ListRow icon="settings" title="Settings" subtitle="Privacy, safety, filters, appearance" to={ROUTES.settings} chevron />
          {state.status === 'success' && state.data?.verification?.photo !== 'verified' && (
            <ListRow icon="verified" title="Verify your photos" subtitle="Show people your photos are really you" to={ROUTES.verification} chevron />
          )}
        </ListGroup>
      </Section>

      <footer className="profile__footer">
        <button type="button" className="profile__version" onClick={onVersionTap}>
          {brand.name} · v{brand.version}
        </button>
      </footer>
    </Screen>
  );
}
