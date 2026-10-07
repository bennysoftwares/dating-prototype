import type { ReactNode } from 'react';
import { Navigate, Outlet } from 'react-router';
import { ONBOARDING_ROUTES, ROUTES } from '../../app/navigation';
import { LogoMark, Wordmark } from '../../components/brand/Logo';
import { ErrorState } from '../../components/ui';
import { useSession } from '../../session/SessionProvider';
import './SessionGate.css';

/**
 * `member` routes require a finished profile; `guest` routes (welcome, onboarding)
 * are only for people who haven't finished yet.
 */
export function SessionGate({ mode, children }: { mode: 'member' | 'guest'; children?: ReactNode }) {
  const { state, refresh } = useSession();

  if (state.status === 'loading') return <Splash />;
  if (state.status === 'error') return <ErrorState message={state.error.message} onRetry={() => void refresh()} />;

  const onboarded = state.user.onboardingComplete;
  if (mode === 'member' && !onboarded) return <Navigate to={ONBOARDING_ROUTES.welcome} replace />;
  if (mode === 'guest' && onboarded) return <Navigate to={ROUTES.explore} replace />;
  return children ?? <Outlet />;
}

/** Matches the first-paint splash in index.html exactly, so handing over is seamless. */
export function Splash() {
  return (
    <div className="splash" role="status" aria-label="Loading TurtleDoves">
      <div className="splash__inner">
        <LogoMark className="splash__mark" />
        <Wordmark className="splash__word" />
      </div>
    </div>
  );
}
