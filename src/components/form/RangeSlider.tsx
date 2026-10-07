import type { CSSProperties } from 'react';

interface RangeSliderProps {
  /** Accessible names for the two handles, e.g. "Youngest age" / "Oldest age". */
  labels: [string, string];
  value: [number, number];
  min: number;
  max: number;
  step?: number;
  onChange: (value: [number, number]) => void;
  /** Called when a handle is released (e.g. to save). */
  onCommit?: () => void;
  format?: (v: number) => string;
}

/**
 * Two-handle range built from two native range inputs, so each handle keeps full keyboard
 * and screen-reader support. The handles can meet but never cross.
 */
export function RangeSlider({ labels, value: [lo, hi], min, max, step = 1, onChange, onCommit, format = String }: RangeSliderProps) {
  const pct = (v: number) => ((v - min) / (max - min)) * 100;
  const style = { '--lo': `${pct(lo)}%`, '--hi': `${pct(hi)}%` } as CSSProperties;
  const commit = onCommit ? { onPointerUp: onCommit, onKeyUp: onCommit, onBlur: onCommit } : {};
  return (
    <div className="range2" style={style}>
      <div className="range2__track" aria-hidden="true" />
      <input
        type="range"
        className="range2__input"
        aria-label={labels[0]}
        aria-valuetext={format(lo)}
        min={min}
        max={max}
        step={step}
        value={lo}
        onChange={(e) => onChange([Math.min(Number(e.target.value), hi), hi])}
        {...commit}
      />
      <input
        type="range"
        className="range2__input"
        aria-label={labels[1]}
        aria-valuetext={format(hi)}
        min={min}
        max={max}
        step={step}
        value={hi}
        onChange={(e) => onChange([lo, Math.max(Number(e.target.value), lo)])}
        {...commit}
      />
    </div>
  );
}
