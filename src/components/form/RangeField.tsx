import { useId, type CSSProperties, type ReactNode } from 'react';

interface RangeFieldProps {
  label: string;
  value: number;
  min: number;
  max: number;
  step?: number;
  onChange: (value: number) => void;
  /** Large readout, e.g. "30 km". */
  format: (value: number) => string;
  hint?: ReactNode;
}

/** Native range input with a large readout. Keyboard and screen-reader friendly. */
export function RangeField({ label, value, min, max, step = 1, onChange, format, hint }: RangeFieldProps) {
  const id = useId();
  const pct = ((value - min) / (max - min)) * 100;
  return (
    <div className="range-field">
      <div className="range-field__head">
        <label htmlFor={id} className="range-field__label">{label}</label>
        <output htmlFor={id} className="range-field__value">{format(value)}</output>
      </div>
      <input
        id={id}
        type="range"
        className="range"
        min={min}
        max={max}
        step={step}
        value={value}
        aria-valuetext={format(value)}
        style={{ '--range-pct': `${pct}%` } as CSSProperties}
        onChange={(e) => onChange(Number(e.target.value))}
      />
      {hint && <p className="field__hint">{hint}</p>}
    </div>
  );
}
