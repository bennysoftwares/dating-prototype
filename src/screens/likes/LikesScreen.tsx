import { Screen } from '../../components/layout';
import { Card, EmptyState, Icon } from '../../components/ui';
import './LikesScreen.css';

/** Placeholder. Incoming likes (never blurred, never paywalled) arrive in Part 4. */
export function LikesScreen() {
  return (
    <Screen title="Likes">
      <EmptyState icon="heart" title="No likes yet">
        When someone likes your profile, you'll see exactly who they are and what caught their eye.
      </EmptyState>
      <Card className="likes__tip">
        <span className="likes__tip-icon" aria-hidden="true">
          <Icon name="sparkle" size={20} />
        </span>
        <div>
          <h2 className="likes__tip-title">No blur, no guessing</h2>
          <p className="likes__tip-body">Every like shows the person, the photo or answer they liked, and any message they added.</p>
        </div>
      </Card>
    </Screen>
  );
}
