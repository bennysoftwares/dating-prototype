import type { ButtonHTMLAttributes, ReactNode } from 'react';
import { cx } from '../../utils/cx';
import { Icon, type IconName } from './Icon';
import './Button.css';

type Variant = 'primary' | 'secondary' | 'ghost' | 'quiet';
type Size = 'md' | 'lg' | 'sm';

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  size?: Size;
  icon?: IconName;
  block?: boolean;
  children: ReactNode;
}

export function Button({ variant = 'primary', size = 'md', icon, block, className, children, type = 'button', ...rest }: ButtonProps) {
  return (
    <button type={type} className={cx('btn', `btn--${variant}`, `btn--${size}`, block && 'btn--block', className)} {...rest}>
      {icon && <Icon name={icon} size={size === 'sm' ? 18 : 20} />}
      <span>{children}</span>
    </button>
  );
}

interface IconButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  icon: IconName;
  /** Required: icon-only buttons need an accessible name. */
  label: string;
  variant?: 'surface' | 'ghost' | 'accent';
  size?: 'md' | 'lg';
}

export function IconButton({ icon, label, variant = 'ghost', size = 'md', className, type = 'button', ...rest }: IconButtonProps) {
  return (
    <button type={type} aria-label={label} title={label} className={cx('icon-btn', `icon-btn--${variant}`, `icon-btn--${size}`, className)} {...rest}>
      <Icon name={icon} size={size === 'lg' ? 26 : 22} />
    </button>
  );
}
