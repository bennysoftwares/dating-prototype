import { useEffect } from 'react';
import { ChoiceList, ModeToggle, RangeField } from '../../../components/form';
import { DATING_INTENTS, DATING_INTENT_INFO } from '../../../domain/intent';
import { MEET_OPTIONS, PROFILE_LIMITS as L } from '../../../domain/profileOptions';
import { draftAge, suggestedAgeRange } from '../../../onboarding/draft';
import type { StepProps } from './types';
import './steps.css';

export function MeetStep({ draft, update, errors }: StepProps) {
  return (
    <ChoiceList
      multiple
      legend="Show me"
      hideLegend
      options={MEET_OPTIONS}
      value={draft.interestedIn}
      onChange={(interestedIn) => update({ interestedIn })}
      error={errors.interestedIn}
    />
  );
}

export function IntentStep({ draft, update, errors }: StepProps) {
  return (
    <ChoiceList
      legend="Dating intention"
      hideLegend
      options={DATING_INTENTS.map((id) => ({ value: id, label: DATING_INTENT_INFO[id].label, description: DATING_INTENT_INFO[id].description }))}
      value={draft.intent}
      onChange={(intent) => update({ intent })}
      error={errors.intent}
    />
  );
}

export function AgeRangeStep({ draft, update, errors }: StepProps) {
  const needsDefault = draft.ageMin === null || draft.ageMax === null;
  useEffect(() => {
    if (needsDefault) {
      const r = suggestedAgeRange(draftAge(draft));
      update({ ageMin: draft.ageMin ?? r.min, ageMax: draft.ageMax ?? r.max });
    }
    // Only fill in a starting range once.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [needsDefault]);

  const min = draft.ageMin ?? 18;
  const max = draft.ageMax ?? 99;
  const upper = 80;

  return (
    <div className="step-stack">
      <p className="step-big-value" aria-live="polite">
        {min} – {max >= upper ? `${upper}+` : max}
      </p>
      <RangeField
        label="Youngest"
        value={min}
        min={L.minAge}
        max={upper}
        onChange={(v) => update({ ageMin: v, ageMax: Math.max(v, max) })}
        format={(v) => `${v}`}
      />
      <RangeField
        label="Oldest"
        value={Math.min(max, upper)}
        min={L.minAge}
        max={upper}
        onChange={(v) => update({ ageMax: v >= upper ? L.maxAge : v, ageMin: Math.min(v, min) })}
        format={(v) => (v >= upper ? `${upper}+` : `${v}`)}
      />
      <p className="field__error" role={errors.ageRange ? 'alert' : undefined}>{errors.ageRange ?? ''}</p>
      <ModeToggle legend="How strict is this age range?" value={draft.ageMode} onChange={(ageMode) => update({ ageMode })} />
    </div>
  );
}

export function DistanceStep({ draft, update, errors }: StepProps) {
  const km = (v: number) => `${v} km`;
  return (
    <div className="step-stack">
      <div className="step-panel">
        <RangeField
          label="Preferred distance"
          value={draft.preferredKm}
          min={L.distanceMinKm}
          max={L.distanceMaxKm}
          onChange={(preferredKm) => update({ preferredKm, maxKm: Math.max(draft.maxKm, preferredKm) })}
          format={km}
          hint="A preference. People a bit further away can still appear, just lower down."
        />
      </div>
      <div className="step-panel">
        <RangeField
          label="Hard maximum"
          value={draft.maxKm}
          min={L.distanceMinKm}
          max={L.distanceMaxKm}
          onChange={(maxKm) => update({ maxKm, preferredKm: Math.min(draft.preferredKm, maxKm) })}
          format={km}
          hint="A dealbreaker. You'll never see anyone further away than this."
        />
        <p className="field__error" role={errors.maxKm ? 'alert' : undefined}>{errors.maxKm ?? ''}</p>
      </div>
    </div>
  );
}
