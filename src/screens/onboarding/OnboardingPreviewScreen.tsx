import { useState } from 'react';
import { Navigate } from 'react-router';
import { ONBOARDING_ROUTES } from '../../app/navigation';
import { ProfileView } from '../../components/profile/ProfileView';
import { ListGroup, ListRow } from '../../components/ui';
import { draftToPreferences, draftToProfile } from '../../onboarding/draft';
import { clearOnboardingDraft, useOnboardingDraft } from '../../onboarding/useOnboardingDraft';
import { isValid, validators } from '../../onboarding/validation';
import { useRepositories } from '../../repositories/RepositoryContext';
import { useSession } from '../../session/SessionProvider';
import { SECTION_LABELS, STEPS } from './stepRegistry';
import { StepFrame } from './StepFrame';
import { useBack } from './useStepNavigation';
import './OnboardingPreviewScreen.css';

/** "Preview your profile": the real profile component, plus links back to any answer. */
export function OnboardingPreviewScreen() {
  const { draft } = useOnboardingDraft();
  const { users } = useRepositories();
  const { refresh } = useSession();
  const back = useBack();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const firstInvalid = STEPS.find((s) => !isValid(validators[s.id](draft)));
  // While finishing, the draft is cleared before the route changes; don't bounce back into the flow.
  if (firstInvalid && busy) return null;
  if (firstInvalid) return <Navigate to={ONBOARDING_ROUTES.step(firstInvalid.id)} replace />;

  const profile = draftToProfile(draft);
  const lastStep = STEPS[STEPS.length - 1]!;

  const finish = async () => {
    setBusy(true);
    setError(null);
    try {
      await users.completeOnboarding(profile, draftToPreferences(draft));
      // Saved: the draft is no longer needed. `busy` keeps this screen from bouncing back into the flow.
      clearOnboardingDraft();
      // The session gate now sees a finished profile and opens Explore.
      await refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'We couldn’t save your profile. Try again.');
      setBusy(false);
    }
  };

  const sections = (Object.keys(SECTION_LABELS) as (keyof typeof SECTION_LABELS)[]).map((section) => ({
    section,
    steps: STEPS.filter((s) => s.section === section),
  }));

  return (
    <StepFrame
      stepKey="preview"
      eyebrow="Almost done"
      title="Preview your profile"
      subtitle="This is how other people will see you. Tap any answer below to change it."
      progress={1}
      progressLabel="Final step"
      onBack={() => back(ONBOARDING_ROUTES.step(lastStep.id))}
      primaryLabel="Looks good, finish"
      onPrimary={() => void finish()}
      primaryBusy={busy}
      footerNote={error}
    >
      <div className="preview">
        <ProfileView profile={profile} />
        <div className="preview__edit">
          <h2 className="preview__heading">Edit your answers</h2>
          {sections.map(({ section, steps }) => (
            <section key={section} className="preview__group" aria-label={SECTION_LABELS[section]}>
              <h3 className="preview__group-title">{SECTION_LABELS[section]}</h3>
              <ListGroup label={SECTION_LABELS[section]}>
                {steps.map((s) => (
                  <ListRow key={s.id} title={s.editLabel} subtitle={s.summary(draft)} to={`${ONBOARDING_ROUTES.step(s.id)}?from=preview`} chevron />
                ))}
              </ListGroup>
            </section>
          ))}
        </div>
      </div>
    </StepFrame>
  );
}
