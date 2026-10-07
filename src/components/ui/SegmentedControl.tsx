import { useId } from 'react';
import { Icon, type IconName } from './Icon';
import './SegmentedControl.css';

interface Option<T extends string> {
  value: T;
  label: string;
  icon?: IconName;
}

interface SegmentedControlProps<T extends string> {
  legend: string;
  value: T;
  options: Option<T>[];
  onChange: (value: T) => void;
}

/** Accessible single-choice control built on native radio inputs. */
export function SegmentedControl<T extends string>({ legend, value, options, onChange }: SegmentedControlProps<T>) {
  const name = useId();
  return (
    <fieldset className="segmented">
      <legend className="visually-hidden">{legend}</legend>
      {options.map((opt) => (
        <label key={opt.value} className="segmented__option">
          <input
            type="radio"
            name={name}
            value={opt.value}
            checked={value === opt.value}
            onChange={() => onChange(opt.value)}
          />
          <span className="segmented__face">
            {opt.icon && <Icon name={opt.icon} size={18} />}
            {opt.label}
          </span>
        </label>
      ))}
    </fieldset>
  );
}
