import { Children, type ReactNode } from 'react';
import { Link } from 'react-router';
import { cx } from '../../utils/cx';
import { Icon, type IconName } from './Icon';
import './ListRow.css';

interface ListRowProps {
  leading?: ReactNode;
  icon?: IconName;
  title: ReactNode;
  subtitle?: ReactNode;
  trailing?: ReactNode;
  /** Renders the row as a link. */
  to?: string;
  onClick?: () => void;
  chevron?: boolean;
  className?: string;
}

export function ListRow({ leading, icon, title, subtitle, trailing, to, onClick, chevron, className }: ListRowProps) {
  const content = (
    <>
      {icon && !leading && (
        <span className="row__icon" aria-hidden="true">
          <Icon name={icon} size={20} />
        </span>
      )}
      {leading}
      <span className="row__text">
        <span className="row__title">{title}</span>
        {subtitle && <span className="row__subtitle">{subtitle}</span>}
      </span>
      {trailing && <span className="row__trailing">{trailing}</span>}
      {chevron && <Icon name="chevronRight" size={18} className="row__chevron" />}
    </>
  );

  const cls = cx('row', (to || onClick) && 'row--interactive', className);
  if (to) return <Link to={to} className={cls}>{content}</Link>;
  if (onClick) return <button type="button" onClick={onClick} className={cls}>{content}</button>;
  return <div className={cls}>{content}</div>;
}

export function ListGroup({ children, label }: { children: ReactNode; label?: string }) {
  return (
    <ul className="list-group" role="list" aria-label={label}>
      {Children.toArray(children).map((child, i) => (
        <li key={i}>{child}</li>
      ))}
    </ul>
  );
}
