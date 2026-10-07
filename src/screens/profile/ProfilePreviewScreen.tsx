import { useNavigate } from 'react-router';
import { ROUTES } from '../../app/navigation';
import { Screen } from '../../components/layout';
import { ProfileView } from '../../components/profile/ProfileView';
import { Button, ErrorState, IconButton, LoadingRegion, Skeleton } from '../../components/ui';
import { useOwnProfile } from '../../hooks/useOwnProfile';
import './ProfileScreen.css';

/** Your profile exactly as other people see it. */
export function ProfilePreviewScreen() {
  const navigate = useNavigate();
  const state = useOwnProfile();
  return (
    <Screen
      title="Preview"
      eyebrow="How others see you"
      leading={<IconButton icon="chevronLeft" label="Back" onClick={() => navigate(-1)} />}
    >
      {state.status === 'loading' && (
        <LoadingRegion label="Loading preview">
          <Skeleton ratio="4 / 5" className="profile__hero-skeleton" />
        </LoadingRegion>
      )}
      {state.status === 'error' && <ErrorState onRetry={state.retry} />}
      {state.status === 'success' && state.data.profile && (
        <div className="profile__preview">
          <ProfileView profile={state.data.profile} />
          <Button variant="secondary" icon="edit" onClick={() => navigate(ROUTES.profileEdit)} block>
            Edit profile
          </Button>
        </div>
      )}
    </Screen>
  );
}
