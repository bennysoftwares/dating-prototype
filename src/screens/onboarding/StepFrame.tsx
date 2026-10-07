import { useEffect, useRef, type FormEvent, type ReactNode } from 'react';
import { Button, IconButton } from '../../components/ui';
import { cx } from '../../utils/cx';
import './StepFrame.css';

interface StepFrameProps {
  /** Changes when the step changes; drives the entrance animation and focus. */
  stepKey: string;
  direction?: 'forward' | 'back';
  title: string;
  subtitle?: string;
  eyebrow?: string;
  /** 0–1. Omit to hide the progress bar (edit mode). */
  progress?: number;
  progressLabel?: string;
  onBack: () => void;
  backLabel?: string;
  onSkip?: () => void;
  primaryLabel: string;
  onPrimary: () => void;
  primaryBusy?: boolean;
  /** Message shown above the primary button (e.g. a save error). */
  footerNote?: ReactNode;
  children: ReactNode;
}

/**
 * Full-screen frame for one onboarding or edit step. The primary action sits at the
 * bottom inside thumb reach; it's a real <form>, so the keyboard's Go/Enter key continues.
 */
export function StepFrame({
  stepKey,
  direction = 'forward',
  title,
  subtitle,
  eyebrow,
  progress,
  progressLabel,
  onBack,
  backLabel = 'Back',
  onSkip,
  primaryLabel,
  onPrimary,
  primaryBusy,
  footerNote,
  children,
}: StepFrameProps) {
  const headingRef = useRef<HTMLHeadingElement>(null);

  // Move focus to the new heading so screen readers announce each step,
  // unless a field already grabbed focus via autoFocus.
  useEffect(() => {
    const active = document.activeElement;
    if (!active || active === document.body || !headingRef.current?.closest('.step-frame')?.contains(active)) {
      headingRef.current?.focus({ preventScroll: true });
    }
    window.scrollTo({ top: 0 });
  }, [stepKey]);

  const submit = (e: FormEvent) => {
    e.preventDefault();
    if (!primaryBusy) onPrimary();
  };

  return (
    <form className="step-frame" onSubmit={submit} noValidate>
      <header className="step-frame__top">
        <div className="step-frame__bar">
          <IconButton icon="chevronLeft" label={backLabel} onClick={onBack} />
          {progress !== undefined ? (
            <div
              className="step-frame__progress"
              role="progressbar"
              aria-label={progressLabel ?? 'Progress'}
              aria-valuemin={0}
              aria-valuemax={100}
              aria-valuenow={Math.round(progress * 100)}
            >
              <span style={{ transform: `scaleX(${Math.max(0.03, progress)})` }} />
            </div>
          ) : (
            <span className="step-frame__spacer" />
          )}
          {onSkip ? (
            <button type="button" className="step-frame__skip" onClick={onSkip}>
              Skip
            </button>
          ) : (
            <span className="step-frame__skip-placeholder" aria-hidden="true" />
          )}
        </div>
      </header>

      <div key={stepKey} className={cx('step-frame__content', `step-frame__content--${direction}`)}>
        {eyebrow && <p className="step-frame__eyebrow">{eyebrow}</p>}
        <h1 ref={headingRef} tabIndex={-1} className="step-frame__title">{title}</h1>
        {subtitle && <p className="step-frame__subtitle">{subtitle}</p>}
        <div className="step-frame__body">{children}</div>
      </div>

      <footer className="step-frame__footer">
        {footerNote && <div className="step-frame__note" role="alert">{footerNote}</div>}
        <Button type="submit" size="lg" block disabled={primaryBusy} aria-busy={primaryBusy || undefined}>
          {primaryBusy ? 'Saving…' : primaryLabel}
        </Button>
      </footer>
    </form>
  );
}
