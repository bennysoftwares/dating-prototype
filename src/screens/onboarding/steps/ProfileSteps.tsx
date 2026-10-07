import { ChipSelect, TextArea } from '../../../components/form';
import { INTERESTS } from '../../../domain/interest';
import { PROFILE_LIMITS as L } from '../../../domain/profileOptions';
import type { StepProps } from './types';
import './steps.css';

export function InterestsStep({ draft, update, errors }: StepProps) {
  const n = draft.interests.length;
  return (
    <ChipSelect
      legend="Interests"
      hideLegend
      options={INTERESTS.map((i) => ({ value: i.id, label: i.label }))}
      value={draft.interests}
      onChange={(interests) => update({ interests })}
      max={L.interestsMax}
      error={errors.interests}
      footer={
        <p className="step-counter" aria-live="polite">
          {n} selected · choose {L.interestsMin}–{L.interestsMax}
        </p>
      }
    />
  );
}

export function BioStep({ draft, update, errors }: StepProps) {
  return (
    <TextArea
      id="bio"
      label="Bio"
      hideLabel
      placeholder="A couple of lines about you, in your own words."
      value={draft.bio}
      onChange={(bio) => update({ bio })}
      maxLength={L.bioMax}
      error={errors.bio}
      rows={5}
    />
  );
}
