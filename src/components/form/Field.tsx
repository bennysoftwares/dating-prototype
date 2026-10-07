import type { ReactNode } from 'react';
import { cx } from '../../utils/cx';
import './Form.css';

interface FieldProps {
  id: string;
  label: ReactNode;
  hint?: ReactNode;
  error?: string;
  /** Right-aligned text in the label row, e.g. a character counter. */
  aside?: ReactNode;
  hideLabel?: boolean;
  children: ReactNode;
}

/** Label, control, hint and error with stable spacing (errors never shift layout). */
export function Field({ id, label, hint, error, aside, hideLabel, children }: FieldProps) {
  return (
    <div className={cx('field', error && 'field--error')}>
      <div className={cx('field__label-row', hideLabel && 'visually-hidden')}>
        <label htmlFor={id} className="field__label">{label}</label>
        {aside && <span className="field__aside">{aside}</span>}
      </div>
      {children}
      {hint && !error && <p id={`${id}-hint`} className="field__hint">{hint}</p>}
      <p id={`${id}-error`} className="field__error" role={error ? 'alert' : undefined}>{error ?? ''}</p>
    </div>
  );
}

/** aria-describedby value for a control inside <Field>. */
export function describedBy(id: string, hasHint: boolean, error?: string) {
  return [hasHint && !error ? `${id}-hint` : null, error ? `${id}-error` : null].filter(Boolean).join(' ') || undefined;
}
