import { useId } from 'react';
import { cx } from '../../utils/cx';
import { Icon } from '../ui/Icon';

interface SwitchProps {
  label: string;
  description?: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
  compact?: boolean;
}

/** Native checkbox with switch semantics. The whole row is the touch target. */
export function Switch({ label, description, checked, onChange, compact }: SwitchProps) {
  const id = useId();
  return (
    <label htmlFor={id} className={cx('switch-row', compact && 'switch-row--compact')}>
      <span className="switch-row__text">
        <span className="switch-row__label">{label}</span>
        {description && <span className="switch-row__description">{description}</span>}
      </span>
      <input id={id} type="checkbox" role="switch" className="switch" checked={checked} onChange={(e) => onChange(e.target.checked)} />
    </label>
  );
}

/** "Show on profile" control used next to personal fields. */
export function VisibilityToggle({ checked, onChange, field }: { checked: boolean; onChange: (v: boolean) => void; field: string }) {
  const id = useId();
  return (
    <label htmlFor={id} className="visibility">
      <Icon name={checked ? 'eye' : 'eyeOff'} size={18} />
      <span className="visibility__label">
        Show on profile<span className="visually-hidden">: {field}</span>
      </span>
      <span className="visibility__state" aria-hidden="true">{checked ? 'On' : 'Off'}</span>
      <input id={id} type="checkbox" role="switch" className="switch switch--sm" checked={checked} onChange={(e) => onChange(e.target.checked)} />
    </label>
  );
}
