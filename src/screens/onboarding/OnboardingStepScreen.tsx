import { useEffect } from 'react';
import { Navigate, useNavigate, useParams, useSearchParams } from 'react-router';
import { ONBOARDING_ROUTES } from '../../app/navigation';
import { useOnboardingDraft } from '../../onboarding/useOnboardingDraft';
import { useStepValidation } from '../../onboarding/useStepValidation';
import { isValid, validators } from '../../onboarding/validation';
import { getStep, SECTION_LABELS, STEPS } from './stepRegistry';
import { StepFrame } from './StepFrame';
import { useBack, useDirection } from './useStepNavigation';

/** One onboarding step, addressed by URL (`#/onboarding/:stepId`) so browser back works. */
export function OnboardingStepScreen() {
  const { stepId } = useParams();
  const [search] = useSearchParams();
  /** Editing a single answer from the preview screen: Continue returns there. */
  const fromPreview = search.get('from') === 'preview';
  const navigate = useNavigate();
  const back = useBack();
  const { draft, update, setLastStep } = useOnboardingDraft();
  const step = getStep(stepId);
  const index = step ? STEPS.indexOf(step) : -1;
  const direction = useDirection(index);
  const { errors, check } = useStepValidation(step?.id, draft);

  useEffect(() => {
    if (step) setLastStep(step.id);
  }, [step, setLastStep]);

  if (!step) return <Navigate to={ONBOARDING_ROUTES.step(STEPS[0]!.id)} replace />;

  // Don't allow deep-linking past an unanswered required step.
  const firstInvalid = STEPS.slice(0, index).find((s) => !s.optional && !isValid(validators[s.id](draft)));
  if (firstInvalid) return <Navigate to={ONBOARDING_ROUTES.step(firstInvalid.id)} replace />;

  const next = STEPS[index + 1];
  const prev = STEPS[index - 1];
  const goNext = () => {
    if (fromPreview) back(ONBOARDING_ROUTES.preview);
    else navigate(next ? ONBOARDING_ROUTES.step(next.id) : ONBOARDING_ROUTES.preview);
  };
  const goBack = () => back(fromPreview ? ONBOARDING_ROUTES.preview : prev ? ONBOARDING_ROUTES.step(prev.id) : ONBOARDING_ROUTES.welcome);

  const { Component } = step;
  return (
    <StepFrame
      stepKey={step.id}
      direction={direction}
      eyebrow={SECTION_LABELS[step.section]}
      title={step.title}
      subtitle={step.subtitle}
      progress={(index + 1) / (STEPS.length + 1)}
      progressLabel={`Step ${index + 1} of ${STEPS.length + 1}`}
      onBack={goBack}
      onSkip={step.optional && !fromPreview ? goNext : undefined}
      primaryLabel={fromPreview ? 'Done' : 'Continue'}
      onPrimary={() => check() && goNext()}
    >
      <Component draft={draft} update={update} errors={errors} mode="onboarding" />
    </StepFrame>
  );
}
