import { useState } from 'react';
import { Navigate, useNavigate, useParams } from 'react-router';
import { ROUTES } from '../../app/navigation';
import { ErrorState, LoadingRegion, Skeleton } from '../../components/ui';
import type { Preferences, Profile } from '../../domain/types';
import { useOwnProfile } from '../../hooks/useOwnProfile';
import { draftToPreferences, draftToProfile, profileToDraft, type DraftPatch, type ProfileDraft } from '../../onboarding/draft';
import { useStepValidation } from '../../onboarding/useStepValidation';
import { useRepositories } from '../../repositories/RepositoryContext';
import { getStep } from '../onboarding/stepRegistry';
import { StepFrame } from '../onboarding/StepFrame';
import { useBack } from '../onboarding/useStepNavigation';

/** Edit one section of the profile using the exact step component from onboarding. */
export function ProfileEditStepScreen() {
  const { stepId } = useParams();
  const step = getStep(stepId);
  const state = useOwnProfile();

  if (!step) return <Navigate to={ROUTES.profileEdit} replace />;
  if (state.status === 'loading') {
    return (
      <LoadingRegion label="Loading">
        <div style={{ padding: 'calc(var(--safe-top) + 72px) var(--gutter)' }}>
          <Skeleton height={320} />
        </div>
      </LoadingRegion>
    );
  }
  if (state.status === 'error' || !state.data.profile) return <ErrorState onRetry={state.retry} />;
  return <Editor key={step.id} stepId={step.id} profile={state.data.profile} preferences={state.data.preferences} />;
}

function Editor({ stepId, profile, preferences }: { stepId: string; profile: Profile; preferences: Preferences | null }) {
  const step = getStep(stepId)!;
  const navigate = useNavigate();
  const back = useBack();
  const { users, profiles } = useRepositories();
  const [draft, setDraft] = useState<ProfileDraft>(() => profileToDraft(profile, preferences));
  const [dirty, setDirty] = useState(false);
  const [busy, setBusy] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const { errors, check } = useStepValidation(step.id, draft);

  const update = (patch: DraftPatch) => {
    setDraft((d) => ({ ...d, ...patch }));
    setDirty(true);
    return true;
  };

  const leave = () => back(ROUTES.profileEdit);

  const onBack = () => {
    if (dirty && !window.confirm('Discard your changes?')) return;
    leave();
  };

  const save = async () => {
    if (!check()) return;
    if (!dirty) return leave();
    setBusy(true);
    setSaveError(null);
    try {
      await profiles.saveCurrentProfile(draftToProfile(draft, profile));
      await users.savePreferences(draftToPreferences(draft, preferences));
      navigate(ROUTES.profileEdit, { replace: true });
    } catch (err) {
      setSaveError(err instanceof Error ? err.message : 'We couldn’t save that. Try again.');
      setBusy(false);
    }
  };

  const { Component } = step;
  return (
    <StepFrame
      stepKey={step.id}
      eyebrow="Edit profile"
      title={step.title}
      subtitle={step.subtitle}
      onBack={onBack}
      backLabel="Back to edit profile"
      primaryLabel="Save"
      onPrimary={() => void save()}
      primaryBusy={busy}
      footerNote={saveError}
    >
      <Component draft={draft} update={update} errors={errors} mode="edit" />
    </StepFrame>
  );
}
