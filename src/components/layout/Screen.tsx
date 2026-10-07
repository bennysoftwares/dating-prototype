import type { ReactNode } from 'react';
import { cx } from '../../utils/cx';
import './Screen.css';

interface ScreenProps {
  title: string;
  /** Small line above the title, e.g. a date. */
  eyebrow?: ReactNode;
  subtitle?: ReactNode;
  actions?: ReactNode;
  /** Visually hide the large title (it remains the page heading for screen readers). */
  hideTitle?: boolean;
  children: ReactNode;
  className?: string;
}

/** Standard screen: sticky safe-area header with a large title, then content. */
export function Screen({ title, eyebrow, subtitle, actions, hideTitle, children, className }: ScreenProps) {
  return (
    <div className={cx('screen', className)}>
      <header className="screen__header">
        <div className="screen__header-inner">
          <div className="screen__titles">
            {eyebrow && <p className="screen__eyebrow">{eyebrow}</p>}
            <h1 className={cx('screen__title', hideTitle && 'visually-hidden')}>{title}</h1>
          </div>
          {actions && <div className="screen__actions">{actions}</div>}
        </div>
      </header>
      <div className="screen__body">
        {subtitle && <p className="screen__subtitle">{subtitle}</p>}
        {children}
      </div>
    </div>
  );
}

interface SectionProps {
  title?: string;
  description?: ReactNode;
  action?: ReactNode;
  children: ReactNode;
  className?: string;
}

export function Section({ title, description, action, children, className }: SectionProps) {
  return (
    <section className={cx('section', className)}>
      {(title || action) && (
        <div className="section__head">
          {title && <h2 className="section__title">{title}</h2>}
          {action}
        </div>
      )}
      {description && <p className="section__description">{description}</p>}
      {children}
    </section>
  );
}
