import { useEffect } from 'react';
import { ChipSelect, ChoiceList, RangeField, TextField, VisibilityToggle } from '../../../components/form';
import {
  CHILDREN_OPTIONS,
  DRINKING_OPTIONS,
  EDUCATION_LEVEL_OPTIONS,
  LANGUAGE_OPTIONS,
  POLITICS_OPTIONS,
  PROFILE_LIMITS as L,
  RELIGION_OPTIONS,
  SMOKING_OPTIONS,
  WANTS_CHILDREN_OPTIONS,
} from '../../../domain/profileOptions';
import type { VisibleField } from '../../../domain/types';
import type { StepProps } from './types';
import './steps.css';

function Visibility({ draft, update, field, label }: Pick<StepProps, 'draft' | 'update'> & { field: VisibleField; label: string }) {
  return (
    <VisibilityToggle
      field={label}
      checked={draft.visibility[field]}
      onChange={(on) => update({ visibility: { ...draft.visibility, [field]: on } })}
    />
  );
}

export function HeightStep({ draft, update }: StepProps) {
  useEffect(() => {
    if (draft.heightCm === null) update({ heightCm: 170 });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  return (
    <div className="step-stack">
      <div className="step-panel">
        <RangeField
          label="Height"
          value={draft.heightCm ?? 170}
          min={L.heightMinCm}
          max={L.heightMaxCm}
          onChange={(heightCm) => update({ heightCm })}
          format={(v) => `${v} cm`}
        />
      </div>
      <Visibility draft={draft} update={update} field="height" label="Height" />
    </div>
  );
}

export function WorkStep({ draft, update, errors }: StepProps) {
  return (
    <div className="step-stack">
      <div>
        <TextField
          id="job"
          label="Job title"
          placeholder="e.g. Nurse, Designer, Student"
          value={draft.job}
          onChange={(job) => update({ job })}
          error={errors.job}
          maxLength={L.jobMax}
          autoComplete="organization-title"
          enterKeyHint="next"
        />
        <Visibility draft={draft} update={update} field="job" label="Job" />
      </div>
      <div>
        <TextField
          id="education"
          label="Education"
          placeholder="e.g. University of Gothenburg"
          value={draft.education}
          onChange={(education) => update({ education })}
          error={errors.education}
          maxLength={L.educationMax}
          enterKeyHint="done"
        />
        <ChoiceList
          legend="Highest level of education (optional)"
          options={EDUCATION_LEVEL_OPTIONS}
          value={draft.educationLevel}
          onChange={(educationLevel) => update({ educationLevel })}
          allowDeselect
          onClear={() => update({ educationLevel: null })}
        />
        <Visibility draft={draft} update={update} field="education" label="Education" />
      </div>
    </div>
  );
}

const toOptions = (list: readonly string[]) => list.map((v) => ({ value: v, label: v }));

export function BeliefsStep({ draft, update }: StepProps) {
  return (
    <div className="step-stack">
      <div>
        <ChoiceList
          legend="Religion or beliefs"
          options={toOptions(RELIGION_OPTIONS)}
          columns={2}
          value={draft.religion || null}
          onChange={(religion) => update({ religion })}
          allowDeselect
          onClear={() => update({ religion: '' })}
        />
        <Visibility draft={draft} update={update} field="religion" label="Religion" />
      </div>
      <div>
        <ChoiceList
          legend="Politics"
          options={toOptions(POLITICS_OPTIONS)}
          columns={2}
          value={draft.politics || null}
          onChange={(politics) => update({ politics })}
          allowDeselect
          onClear={() => update({ politics: '' })}
        />
        <Visibility draft={draft} update={update} field="politics" label="Politics" />
      </div>
      <p className="step-note">Tap a selected option again to clear it.</p>
    </div>
  );
}

export function LifestyleStep({ draft, update, errors }: StepProps) {
  return (
    <div className="step-stack">
      <div>
        <ChoiceList legend="Do you drink?" options={DRINKING_OPTIONS} columns={2} value={draft.drinking} onChange={(drinking) => update({ drinking })} error={errors.drinking} />
        <Visibility draft={draft} update={update} field="drinking" label="Drinking" />
      </div>
      <div>
        <ChoiceList legend="Do you smoke?" options={SMOKING_OPTIONS} columns={2} value={draft.smoking} onChange={(smoking) => update({ smoking })} error={errors.smoking} />
        <Visibility draft={draft} update={update} field="smoking" label="Smoking" />
      </div>
    </div>
  );
}

export function FamilyStep({ draft, update, errors }: StepProps) {
  return (
    <div className="step-stack">
      <ChoiceList legend="Do you have children?" options={CHILDREN_OPTIONS} value={draft.children} onChange={(children) => update({ children })} error={errors.children} />
      <ChoiceList
        legend="Do you want children?"
        options={WANTS_CHILDREN_OPTIONS}
        value={draft.wantsChildren}
        onChange={(wantsChildren) => update({ wantsChildren })}
        error={errors.wantsChildren}
      />
      <Visibility draft={draft} update={update} field="children" label="Children" />
    </div>
  );
}

export function LanguagesStep({ draft, update, errors }: StepProps) {
  return (
    <ChipSelect
      legend="Languages you speak"
      hideLegend
      options={toOptions(LANGUAGE_OPTIONS)}
      value={draft.languages}
      onChange={(languages) => update({ languages })}
      error={errors.languages}
    />
  );
}
