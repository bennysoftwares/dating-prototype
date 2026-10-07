import { forwardRef, type InputHTMLAttributes, type TextareaHTMLAttributes } from 'react';
import { describedBy, Field } from './Field';

interface TextFieldProps extends Omit<InputHTMLAttributes<HTMLInputElement>, 'onChange'> {
  id: string;
  label: string;
  value: string;
  onChange: (value: string) => void;
  hint?: string;
  error?: string;
  hideLabel?: boolean;
  /** Show a live "12/30" counter when maxLength is set. */
  showCount?: boolean;
}

export const TextField = forwardRef<HTMLInputElement, TextFieldProps>(function TextField(
  { id, label, value, onChange, hint, error, hideLabel, showCount, maxLength, ...rest },
  ref,
) {
  return (
    <Field
      id={id}
      label={label}
      hint={hint}
      error={error}
      hideLabel={hideLabel}
      aside={showCount && maxLength ? `${value.length}/${maxLength}` : undefined}
    >
      <input
        ref={ref}
        id={id}
        className="input"
        value={value}
        maxLength={maxLength}
        aria-invalid={error ? true : undefined}
        aria-describedby={describedBy(id, Boolean(hint), error)}
        onChange={(e) => onChange(e.target.value)}
        {...rest}
      />
    </Field>
  );
});

interface TextAreaProps extends Omit<TextareaHTMLAttributes<HTMLTextAreaElement>, 'onChange'> {
  id: string;
  label: string;
  value: string;
  onChange: (value: string) => void;
  maxLength: number;
  hint?: string;
  error?: string;
  hideLabel?: boolean;
}

export const TextArea = forwardRef<HTMLTextAreaElement, TextAreaProps>(function TextArea(
  { id, label, value, onChange, maxLength, hint, error, hideLabel, rows = 4, ...rest },
  ref,
) {
  const remaining = maxLength - value.length;
  return (
    <Field
      id={id}
      label={label}
      hint={hint}
      error={error}
      hideLabel={hideLabel}
      aside={<span className={remaining < 20 ? 'field__count--low' : undefined}>{remaining}</span>}
    >
      <textarea
        ref={ref}
        id={id}
        className="input input--textarea"
        value={value}
        rows={rows}
        maxLength={maxLength}
        aria-invalid={error ? true : undefined}
        aria-describedby={describedBy(id, Boolean(hint), error)}
        onChange={(e) => onChange(e.target.value)}
        {...rest}
      />
    </Field>
  );
});
