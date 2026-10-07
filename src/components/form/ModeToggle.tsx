import type { FilterMode } from '../../domain/types';
import { SegmentedControl } from '../ui/SegmentedControl';

export const MODE_COPY: Record<FilterMode, string> = {
  preference: "I'd prefer this, but I'm open.",
  dealbreaker: "Don't show me people outside this.",
};

/** Preference vs dealbreaker, with the meaning spelled out underneath. */
export function ModeToggle({ value, onChange, legend }: { value: FilterMode; onChange: (m: FilterMode) => void; legend: string }) {
  return (
    <div className="mode-toggle">
      <SegmentedControl<FilterMode>
        legend={legend}
        value={value}
        onChange={onChange}
        options={[
          { value: 'preference', label: 'Preference' },
          { value: 'dealbreaker', label: 'Dealbreaker' },
        ]}
      />
      <p className="mode-toggle__copy" aria-live="polite">{MODE_COPY[value]}</p>
    </div>
  );
}
