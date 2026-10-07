import type { ReactNode } from 'react';
import { cx } from '../../utils/cx';
import { Icon, type IconName } from './Icon';
import './Chip.css';

interface ChipProps {
  children: ReactNode;
  icon?: IconName;
  tone?: 'neutral' | 'accent' | 'outline';
  className?: string;
}

/** Non-interactive label: interests, intent, lifestyle facts. */
export function Chip({ children, icon, tone = 'neutral', className }: ChipProps) {
  return (
    <span className={cx('chip', `chip--${tone}`, className)}>
      {icon && <Icon name={icon} size={16} />}
      {children}
    </span>
  );
}

export function ChipList({ children, label }: { children: ReactNode; label?: string }) {
  return (
    <ul className="chip-list" role="list" aria-label={label}>
      {children}
    </ul>
  );
}
