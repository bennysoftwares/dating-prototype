import { cx } from '../../utils/cx';
import { Icon, type IconName } from './Icon';
import './ActionList.css';

export interface Action {
  label: string;
  icon: IconName;
  onSelect: () => void;
  danger?: boolean;
  disabled?: boolean;
}

/** Large tappable rows for sheets (e.g. photo actions). */
export function ActionList({ actions }: { actions: Action[] }) {
  return (
    <ul className="action-list" role="list">
      {actions.map((a) => (
        <li key={a.label}>
          <button type="button" className={cx('action-list__item', a.danger && 'action-list__item--danger')} onClick={a.onSelect} disabled={a.disabled}>
            <Icon name={a.icon} size={22} />
            {a.label}
          </button>
        </li>
      ))}
    </ul>
  );
}
