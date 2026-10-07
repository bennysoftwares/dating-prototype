import { useRouteError } from 'react-router';
import { Button, EmptyState } from '../../components/ui';

/** Last-resort boundary for render errors inside a route. */
export function RouteError() {
  const error = useRouteError();
  console.error(error);
  return (
    <div role="alert" style={{ paddingTop: 'calc(var(--safe-top) + 48px)' }}>
      <EmptyState
        icon="refresh"
        title="Something went wrong"
        action={<Button onClick={() => window.location.reload()}>Reload</Button>}
      >
        Reloading usually fixes it. Your data is saved on this device.
      </EmptyState>
    </div>
  );
}
