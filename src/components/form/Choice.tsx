import { useId, type ReactNode } from 'react';
import { cx } from '../../utils/cx';
import { Icon } from '../ui/Icon';

export interface ChoiceOption<T extends string> {
  value: T;
  label: string;
  description?: string;
}

interface ChoiceListProps<T extends string> {
  legend: string;
  hideLegend?: boolean;
  options: readonly ChoiceOption<T>[];
  error?: string;
  /** Compact two-column layout for short labels. */
  columns?: 1 | 2;
}

interface SingleProps<T extends string> extends ChoiceListProps<T> {
  multiple?: false;
  value: T | null;
  onChange: (value: T) => void;
  /** Allow tapping the selected option again to clear it (for optional questions). */
  allowDeselect?: boolean;
  onClear?: () => void;
}

interface MultiProps<T extends string> extends ChoiceListProps<T> {
  multiple: true;
  value: readonly T[];
  onChange: (value: T[]) => void;
  max?: number;
}

/**
 * Large, thumb-friendly option cards built on native radio/checkbox inputs,
 * so keyboard and screen-reader behaviour comes for free.
 */
export function ChoiceList<T extends string>(props: SingleProps<T> | MultiProps<T>) {
  const name = useId();
  const { legend, hideLegend, options, error, columns = 1 } = props;
  const selected = (v: T) => (props.multiple ? props.value.includes(v) : props.value === v);
  const atMax = props.multiple && props.max !== undefined && props.value.length >= props.max;

  const toggle = (v: T) => {
    if (props.multiple) {
      const next = props.value.includes(v) ? props.value.filter((x) => x !== v) : [...props.value, v];
      props.onChange(next);
    } else if (props.value === v && props.allowDeselect) {
      props.onClear?.();
    } else {
      props.onChange(v);
    }
  };

  return (
    <fieldset className="choices" aria-describedby={error ? `${name}-error` : undefined}>
      <legend className={cx('choices__legend', hideLegend && 'visually-hidden')}>{legend}</legend>
      <div className={cx('choices__grid', columns === 2 && 'choices__grid--2')}>
        {options.map((opt) => {
          const isOn = selected(opt.value);
          return (
            <label key={opt.value} className={cx('choice', isOn && 'choice--on')}>
              <input
                type={props.multiple ? 'checkbox' : 'radio'}
                name={name}
                value={opt.value}
                checked={isOn}
                disabled={!isOn && atMax}
                onChange={() => toggle(opt.value)}
                onClick={(e) => {
                  // Radios don't fire onChange when re-clicked; support deselect for optional questions.
                  if (!props.multiple && isOn && props.allowDeselect) {
                    e.preventDefault();
                    toggle(opt.value);
                  }
                }}
              />
              <span className="choice__text">
                <span className="choice__label">{opt.label}</span>
                {opt.description && <span className="choice__description">{opt.description}</span>}
              </span>
              <span className={cx('choice__mark', props.multiple && 'choice__mark--square')} aria-hidden="true">
                {isOn && <Icon name="check" size={16} strokeWidth={2.5} />}
              </span>
            </label>
          );
        })}
      </div>
      <p id={`${name}-error`} className="field__error" role={error ? 'alert' : undefined}>{error ?? ''}</p>
    </fieldset>
  );
}

interface ChipSelectProps<T extends string> {
  legend: string;
  hideLegend?: boolean;
  options: readonly ChoiceOption<T>[];
  value: readonly T[];
  onChange: (value: T[]) => void;
  max?: number;
  error?: string;
  footer?: ReactNode;
}

/** Wrapping multi-select chips for longer lists (interests, languages). */
export function ChipSelect<T extends string>({ legend, hideLegend, options, value, onChange, max, error, footer }: ChipSelectProps<T>) {
  const errId = useId();
  const atMax = max !== undefined && value.length >= max;
  return (
    <fieldset className="choices" aria-describedby={error ? errId : undefined}>
      <legend className={cx('choices__legend', hideLegend && 'visually-hidden')}>{legend}</legend>
      <div className="chip-select">
        {options.map((opt) => {
          const isOn = value.includes(opt.value);
          return (
            <label key={opt.value} className={cx('chip-option', isOn && 'chip-option--on', !isOn && atMax && 'chip-option--disabled')}>
              <input
                type="checkbox"
                checked={isOn}
                disabled={!isOn && atMax}
                onChange={() => onChange(isOn ? value.filter((v) => v !== opt.value) : [...value, opt.value])}
              />
              {isOn && <Icon name="check" size={15} strokeWidth={2.5} />}
              {opt.label}
            </label>
          );
        })}
      </div>
      {footer}
      <p id={errId} className="field__error" role={error ? 'alert' : undefined}>{error ?? ''}</p>
    </fieldset>
  );
}
