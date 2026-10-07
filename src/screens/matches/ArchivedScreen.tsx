import { useNavigate } from 'react-router';
import { ROUTES } from '../../app/navigation';
import { ConversationRow } from '../../components/connections/ConversationRow';
import { Screen } from '../../components/layout';
import { Button, EmptyState, IconButton, useToast } from '../../components/ui';
import { useConnections } from '../../connections/ConnectionsProvider';
import './MatchesScreen.css';

/** Archived conversations stay here, recoverable, until the user moves them back. */
export function ArchivedScreen() {
  const navigate = useNavigate();
  const toast = useToast();
  const { viewer, conversations, setArchived } = useConnections();
  const archived = conversations.filter((c) => c.state === 'archived');

  return (
    <Screen title="Archived" leading={<IconButton icon="chevronLeft" label="Back to matches" onClick={() => navigate(ROUTES.chats)} />}>
      <p className="matches__inactive-note">Archived conversations are hidden from your matches, not deleted. Sending a message moves one back.</p>
      {archived.length === 0 ? (
        <EmptyState icon="archive" title="Nothing archived" />
      ) : (
        <ul className="matches__list" role="list" aria-label="Archived conversations">
          {archived.map((c) => (
            <li key={c.match.id} className="archived__item">
              <ConversationRow convo={c} viewerId={viewer?.userId ?? ''} />
              <div className="archived__actions">
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={() => void setArchived(c.match.id, false).then(() => toast({ message: `${c.other.firstName} is back in your matches` }))}
                >
                  Unarchive
                </Button>
              </div>
            </li>
          ))}
        </ul>
      )}
    </Screen>
  );
}
