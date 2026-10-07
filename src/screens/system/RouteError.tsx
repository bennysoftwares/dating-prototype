import { useRouteError } from 'react-router';
import { Button, EmptyState } from '../../components/ui';
import { storage } from '../../storage/storage';

/** Route-level error boundary. */
export function RouteError() {
  const error = useRouteError();
  console.error(error);
  return <RecoveryScreen />;
}

/**
 * Shown when something breaks. Reloading fixes most problems; if saved demo data is
 * the cause, resetting it gets the app working again.
 */
export function RecoveryScreen() {
  const reset = () => {
    storage.clearAll();
    window.location.hash = '#/welcome';
    window.location.reload();
  };
  return (
    <div role="alert" style={{ paddingTop: 'calc(var(--safe-top) + 48px)' }}>
      <EmptyState
        icon="refresh"
        title="Something went wrong"
        action={
          <div style={{ display: 'grid', gap: 'var(--space-2)' }}>
            <Button onClick={() => window.location.reload()}>Reload</Button>
            <Button variant="quiet" onClick={reset}>Reset demo data</Button>
          </div>
        }
      >
        Reloading usually fixes it. If it keeps happening, resetting the demo data on this device will.
      </EmptyState>
    </div>
  );
}
