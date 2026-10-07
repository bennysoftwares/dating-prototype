import { useNavigate } from 'react-router';
import { ROUTES } from '../../app/navigation';
import { Screen, Section } from '../../components/layout';
import { ErrorState, IconButton, ListGroup, ListRow, LoadingRegion, Skeleton } from '../../components/ui';
import { useOwnProfile } from '../../hooks/useOwnProfile';
import { profileToDraft } from '../../onboarding/draft';
import { SECTION_LABELS, STEPS } from '../onboarding/stepRegistry';
import type { SectionId } from '../onboarding/steps/types';

/** Every onboarding answer, grouped, each opening the same step UI for editing. */
export function ProfileEditScreen() {
  const navigate = useNavigate();
  const state = useOwnProfile();

  return (
    <Screen
      title="Edit profile"
      actions={<IconButton icon="eye" label="Preview profile" onClick={() => navigate(ROUTES.profilePreview)} />}
      leading={<IconButton icon="chevronLeft" label="Back to profile" onClick={() => navigate(ROUTES.profile)} />}
    >
      {state.status === 'loading' && (
        <LoadingRegion label="Loading your profile">
          <Skeleton height={240} />
        </LoadingRegion>
      )}
      {state.status === 'error' && <ErrorState onRetry={state.retry} />}
      {state.status === 'success' && state.data.profile && (() => {
        const draft = profileToDraft(state.data.profile, state.data.preferences);
        return (Object.keys(SECTION_LABELS) as SectionId[]).map((section) => (
          <Section key={section} title={SECTION_LABELS[section]}>
            <ListGroup label={SECTION_LABELS[section]}>
              {STEPS.filter((s) => s.section === section).map((s) => (
                <ListRow key={s.id} title={s.editLabel} subtitle={s.summary(draft)} to={ROUTES.profileEditStep(s.id)} chevron />
              ))}
            </ListGroup>
          </Section>
        ));
      })()}
      {state.status === 'success' && !state.data.profile && <ErrorState message="We couldn't find your profile." onRetry={state.retry} />}
    </Screen>
  );
}
