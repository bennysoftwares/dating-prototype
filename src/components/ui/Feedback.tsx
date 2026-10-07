import type { ReactNode } from 'react';
import { cx } from '../../utils/cx';
import { Button } from './Button';
import { EmptyState } from './EmptyState';
import './Feedback.css';

/** Shimmering placeholder block for loading states. */
export function Skeleton({ className, ratio, height }: { className?: string; ratio?: string; height?: number | string }) {
  return <div className={cx('skeleton', className)} style={{ aspectRatio: ratio, height }} aria-hidden="true" />;
}

/** Wraps skeleton content and announces loading to assistive tech. */
export function LoadingRegion({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div role="status" aria-live="polite" aria-busy="true">
      <span className="visually-hidden">{label}</span>
      {children}
    </div>
  );
}

export function ErrorState({ message, onRetry }: { message?: string; onRetry?: () => void }) {
  return (
    <div role="alert">
      <EmptyState
        icon="refresh"
        title="Something didn't load"
        action={onRetry && <Button variant="secondary" onClick={onRetry}>Try again</Button>}
      >
        {message ?? 'This is on our side. Give it another try in a moment.'}
      </EmptyState>
    </div>
  );
}
