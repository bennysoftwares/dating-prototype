import type { ComponentType } from 'react';
import type { DraftPatch, ProfileDraft } from '../../../onboarding/draft';
import type { StepErrors, StepId } from '../../../onboarding/validation';

export interface StepProps {
  draft: ProfileDraft;
  /** Returns false if the change couldn't be saved (e.g. storage full). */
  update: (patch: DraftPatch) => boolean;
  /** Only populated after the user tries to continue. */
  errors: StepErrors;
  mode: 'onboarding' | 'edit';
}

export type SectionId = 'basics' | 'dating' | 'about' | 'profile';

export interface StepDef {
  id: StepId;
  section: SectionId;
  title: string;
  subtitle?: string;
  /** Optional steps show "Skip" and never block progress. */
  optional?: boolean;
  /** Short label used in Edit profile and the preview's edit links. */
  editLabel: string;
  /** One-line summary of the current answer for the edit list. */
  summary: (draft: ProfileDraft) => string;
  Component: ComponentType<StepProps>;
}
