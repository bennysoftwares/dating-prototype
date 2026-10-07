import { useMemo, useState } from 'react';
import { ChoiceList, TextField } from '../../../components/form';
import { Icon } from '../../../components/ui';
import { CITIES, getCity } from '../../../domain/cities';
import { GENDER_OPTIONS, PROFILE_LIMITS } from '../../../domain/profileOptions';
import { draftAge } from '../../../onboarding/draft';
import type { StepProps } from './types';
import './steps.css';

export function NameStep({ draft, update, errors }: StepProps) {
  return (
    <TextField
      id="firstName"
      label="First name"
      hideLabel
      className="input input--large"
      placeholder="Your first name"
      value={draft.firstName}
      onChange={(firstName) => update({ firstName })}
      error={errors.firstName}
      hint="This is how you'll appear. You can't change it often, so use your real first name."
      maxLength={PROFILE_LIMITS.firstNameMax}
      autoComplete="given-name"
      autoCapitalize="words"
      enterKeyHint="next"
      autoFocus
    />
  );
}

export function BirthdayStep({ draft, update, errors }: StepProps) {
  const age = draftAge(draft);
  const today = new Date();
  const maxDate = new Date(today.getFullYear() - PROFILE_LIMITS.minAge, today.getMonth(), today.getDate());
  return (
    <div className="step-stack">
      <TextField
        id="birthDate"
        label="Date of birth"
        hideLabel
        type="date"
        value={draft.birthDate}
        onChange={(birthDate) => update({ birthDate })}
        error={errors.birthDate}
        max={maxDate.toISOString().slice(0, 10)}
        min="1925-01-01"
        autoComplete="bday"
        hint="Only your age is shown on your profile, never your birthday."
      />
      <p className="step-callout" aria-live="polite">
        {age !== null && age >= PROFILE_LIMITS.minAge ? (
          <>
            <Icon name="cake" size={20} /> You're {age}
          </>
        ) : null}
      </p>
    </div>
  );
}

export function GenderStep({ draft, update, errors }: StepProps) {
  return (
    <ChoiceList
      legend="Gender"
      hideLegend
      options={GENDER_OPTIONS}
      value={draft.gender}
      onChange={(gender) => update({ gender })}
      error={errors.gender}
    />
  );
}

export function LocationStep({ draft, update, errors }: StepProps) {
  const selected = getCity(draft.cityId);
  const [query, setQuery] = useState('');
  const matches = useMemo(() => {
    const q = query.trim().toLowerCase();
    const list = q ? CITIES.filter((c) => `${c.city} ${c.country}`.toLowerCase().includes(q)) : CITIES;
    return list.slice(0, 8);
  }, [query]);

  return (
    <div className="step-stack">
      <TextField
        id="citySearch"
        label="Search for your city"
        hideLabel
        type="search"
        placeholder="Search cities"
        value={query}
        onChange={setQuery}
        autoComplete="address-level2"
        enterKeyHint="search"
      />
      {selected && (
        <p className="step-callout">
          <Icon name="pin" size={20} /> {selected.city}, {selected.country}
        </p>
      )}
      {matches.length > 0 ? (
        <ChoiceList
          legend="Cities"
          hideLegend
          options={matches.map((c) => ({ value: c.id, label: c.city, description: c.country }))}
          value={draft.cityId}
          onChange={(cityId) => update({ cityId })}
          error={errors.cityId}
        />
      ) : (
        <p className="step-note">No cities match “{query}”. This demo includes a short list of cities.</p>
      )}
      <p className="step-note">
        <Icon name="shield" size={16} /> We only ever show approximate distance, like “8 km away”. Never your exact location.
      </p>
    </div>
  );
}
