import { useNavigate } from 'react-router';
import { ROUTES } from '../../app/navigation';
import { Screen } from '../../components/layout';
import { Button, EmptyState } from '../../components/ui';

export function NotFoundScreen() {
  const navigate = useNavigate();
  return (
    <Screen title="Not found" hideTitle>
      <EmptyState
        icon="discover"
        title="This page doesn't exist"
        action={<Button onClick={() => navigate(ROUTES.discover)}>Back to Discover</Button>}
      >
        The link may be old or mistyped.
      </EmptyState>
    </Screen>
  );
}
