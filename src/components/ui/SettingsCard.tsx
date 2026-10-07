import type { ReactNode } from 'react';
import { cx } from '../../utils/cx';
import { Icon, type IconName } from './Icon';
import './SettingsCard.css';

interface SettingsCardProps {
  icon: IconName;
  title: string;
  description?: ReactNode;
  /** Current value shown on the right, e.g. "48 km". */
  value?: ReactNode;
  /** Makes the whole card a button with a chevron. */
  onClick?: () => void;
  /** A control on the right (e.g. a switch). Clicking anywhere on the card toggles it via its label. */
  control?: ReactNode;
  /** A control underneath (e.g. a slider). */
  children?: ReactNode;
  className?: string;
}

/** One soft card per setting: icon circle, serif title, a short explanation and the control. */
export function SettingsCard({ icon, title, description, value, onClick, control, children, className }: SettingsCardProps) {
  const head = (
    <>
      <span className="scard__icon" aria-hidden="true"><Icon name={icon} size={22} /></span>
      <span className="scard__text">
        <span className="scard__title">{title}</span>
        {description && <span className="scard__desc">{description}</span>}
      </span>
      {value !== undefined && <span className="scard__value">{value}</span>}
      {onClick && <Icon name="chevronRight" size={20} className="scard__chevron" />}
      {control}
    </>
  );
  if (onClick) {
    return (
      <button type="button" className={cx('scard', 'scard--button', className)} onClick={onClick}>
        <span className="scard__head">{head}</span>
      </button>
    );
  }
  const Head = control ? 'label' : 'div';
  return (
    <div className={cx('scard', className)}>
      <Head className="scard__head">{head}</Head>
      {children && <div className="scard__body">{children}</div>}
    </div>
  );
}
