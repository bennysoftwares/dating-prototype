import { useEffect, type ReactNode } from 'react';
import { Logo } from '../../components/brand/Logo';
import { IconButton } from '../../components/ui';
import './Account.css';

interface AuthLayoutProps {
  title: string;
  subtitle?: ReactNode;
  onBack?: () => void;
  children: ReactNode;
  /** Pinned under the content, e.g. "Already have an account? Sign in". */
  footer?: ReactNode;
}

/** Shared frame for the getting-started account screens. One column, thumb-friendly. */
export function AuthLayout({ title, subtitle, onBack, children, footer }: AuthLayoutProps) {
  // Each screen starts at the top, whatever the previous one was scrolled to.
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'instant' as ScrollBehavior });
  }, [title]);

  return (
    <main className="auth">
      <div className="auth__top">
        {onBack ? <IconButton icon="chevronLeft" label="Back" onClick={onBack} /> : <span className="auth__spacer" />}
        <Logo size={24} />
        <span className="auth__spacer" />
      </div>
      <div className="auth__body">
        <h1 className="auth__title">{title}</h1>
        {subtitle && <p className="auth__subtitle">{subtitle}</p>}
        {children}
      </div>
      {footer && <div className="auth__footer">{footer}</div>}
    </main>
  );
}

/** "Demo" notes: honest about what the prototype simulates. */
export function DemoNote({ children }: { children: ReactNode }) {
  return (
    <p className="auth__demo">
      <span className="auth__demo-tag">Demo</span>
      <span>{children}</span>
    </p>
  );
}

export function FormError({ message }: { message: string | null }) {
  return message ? <p className="auth__error" role="alert">{message}</p> : null;
}
