import type { ReactNode } from 'react';
import { Icon, type IconName } from './Icon';
import './EmptyState.css';

interface EmptyStateProps {
  icon: IconName;
  title: string;
  children?: ReactNode;
  action?: ReactNode;
}

export function EmptyState({ icon, title, children, action }: EmptyStateProps) {
  return (
    <div className="empty">
      <div className="empty__badge" aria-hidden="true">
        <Icon name={icon} size={28} />
      </div>
      <h2 className="empty__title">{title}</h2>
      {children && <p className="empty__body">{children}</p>}
      {action && <div className="empty__action">{action}</div>}
    </div>
  );
}
