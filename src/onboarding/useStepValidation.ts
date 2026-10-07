import { useState } from 'react';
import type { ProfileDraft } from './draft';
import { isValid, validators, type StepErrors, type StepId } from './validation';

/**
 * Errors appear only after the user tries to continue on a step, then update live
 * as fields are fixed. Tracking *which* step was attempted means errors never leak
 * into the next step.
 */
export function useStepValidation(stepId: StepId | undefined, draft: ProfileDraft) {
  const [attemptedStep, setAttemptedStep] = useState<StepId | null>(null);
  const errors: StepErrors = stepId && attemptedStep === stepId ? validators[stepId](draft) : {};

  /** Returns true if the step is valid; otherwise reveals errors and focuses the first one. */
  const check = (): boolean => {
    if (!stepId) return false;
    if (isValid(validators[stepId](draft))) return true;
    setAttemptedStep(stepId);
    requestAnimationFrame(() => {
      const el = document.querySelector<HTMLElement>('[aria-invalid="true"], .field__error[role="alert"]');
      el?.scrollIntoView({ block: 'center', behavior: 'smooth' });
      if (el?.matches('input, textarea')) el.focus();
    });
    return false;
  };

  return { errors, check };
}
