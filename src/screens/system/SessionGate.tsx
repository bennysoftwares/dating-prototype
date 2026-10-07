import type { ReactNode } from 'react';
import { Navigate, Outlet } from 'react-router';
import { ONBOARDING_ROUTES, ROUTES } from '../../app/navigation';
import { LogoMark } from '../../components/brand/Logo';
import { ErrorState } from '../../components/ui';
import { useSession } from '../../session/SessionProvider';
import './SessionGate.css';

/**
 * `member` routes require a finished profile; `guest` routes (welcome, onboarding)
 * are only for people who haven't finished yet.
 */
export function SessionGate({ mode, children }: { mode: 'member' | 'guest'; children?: ReactNode }) {
  const { state, refresh } = useSession();

  if (state.status === 'loading') {
    return (
      <div className="splash" role="status" aria-label="Loading">
        <LogoMark size={48} />
      </div>
    );
  }
  if (state.status === 'error') return <ErrorState message={state.error.message} onRetry={() => void refresh()} />;

  const onboarded = state.user.onboardingComplete;
  if (mode === 'member' && !onboarded) return <Navigate to={ONBOARDING_ROUTES.welcome} replace />;
  if (mode === 'guest' && onboarded) return <Navigate to={ROUTES.discover} replace />;
  return children ?? <Outlet />;
}
