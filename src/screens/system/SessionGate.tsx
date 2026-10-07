import type { ReactNode } from 'react';
import { Navigate, Outlet } from 'react-router';
import { LogoMark, Wordmark } from '../../components/brand/Logo';
import { ErrorState } from '../../components/ui';
import { useSession } from '../../session/SessionProvider';
import { homeFor, stageOf, type GateStage } from '../../session/homeFor';
import './SessionGate.css';

/**
 * Each group of routes belongs to one getting-started stage: signed out (welcome, create
 * account, sign in), verify email, set up profile, or the app itself. Anyone on the wrong
 * stage is sent to where they belong.
 */
export function SessionGate({ mode, children }: { mode: GateStage; children?: ReactNode }) {
  const { state, refresh } = useSession();

  if (state.status === 'loading') return <Splash />;
  if (state.status === 'error') return <ErrorState message={state.error.message} onRetry={() => void refresh()} />;

  if (stageOf(state.user, state.auth) !== mode) return <Navigate to={homeFor(state.user, state.auth)} replace />;
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
