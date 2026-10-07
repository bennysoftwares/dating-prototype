import { Link } from 'react-router';
import { ROUTES } from '../../app/navigation';
import { ConversationRow } from '../../components/connections/ConversationRow';
import { Screen, Section } from '../../components/layout';
import { Avatar, EmptyState, ErrorState, Icon, LoadingRegion, Skeleton } from '../../components/ui';
import { useConnections } from '../../connections/ConnectionsProvider';
import { useDrafts } from '../../connections/useDrafts';
import { INACTIVE_AFTER_DAYS } from '../../domain/matching';
import './MatchesScreen.css';

/** New matches, conversations by recent activity, inactive chats, and a way to archived ones. */
export function MatchesScreen() {
  const { status, error, viewer, conversations, refresh } = useConnections();
  const { drafts } = useDrafts();

  const fresh = conversations.filter((c) => c.state === 'new');
  const ongoing = conversations.filter((c) => c.state === 'active' || c.state === 'nudge');
  const inactive = conversations.filter((c) => c.state === 'inactive');
  const archived = conversations.filter((c) => c.state === 'archived');
  const nothing = fresh.length + ongoing.length + inactive.length === 0;

  return (
    <Screen title="Matches">
      {status === 'loading' && (
        <LoadingRegion label="Loading matches">
          <div className="matches__loading">{[0, 1, 2].map((i) => <Skeleton key={i} height={72} />)}</div>
        </LoadingRegion>
      )}
      {status === 'error' && <ErrorState message={error?.message} onRetry={() => void refresh()} />}

      {status === 'ready' && viewer && (
        <>
          {nothing && (
            <EmptyState icon="chat" title="No matches yet">
              When you and someone both like each other, your conversation starts here.
            </EmptyState>
          )}

          {fresh.length > 0 && (
            <Section title="New matches">
              <ul className="matches__new" role="list">
                {fresh.map((c) => (
                  <li key={c.match.id}>
                    <Link to={ROUTES.chat(c.match.id)} className="matches__new-item">
                      <span className="visually-hidden">New match: </span>
                      <span className="matches__new-photo">
                        <Avatar photo={c.other.photos[0]} name={c.other.firstName} size={72} />
                        {c.unread > 0 && <span className="matches__new-dot" aria-hidden="true" />}
                      </span>
                      <span>{c.other.firstName}</span>
                      {c.unread > 0 && <span className="visually-hidden">, {c.unread} unread</span>}
                    </Link>
                  </li>
                ))}
              </ul>
            </Section>
          )}

          {ongoing.length > 0 && (
            <Section title="Conversations">
              <ul className="matches__list" role="list" aria-label="Conversations">
                {ongoing.map((c) => (
                  <li key={c.match.id}>
                    <ConversationRow convo={c} viewerId={viewer.userId} draft={drafts[c.match.id]} />
                  </li>
                ))}
              </ul>
            </Section>
          )}

          {inactive.length > 0 && (
            <details className="matches__inactive">
              <summary>
                <span>Inactive · {inactive.length}</span>
                <Icon name="chevronRight" size={18} />
              </summary>
              <p className="matches__inactive-note">
                Quiet for more than {INACTIVE_AFTER_DAYS} days. Nothing has been removed, and you can pick up any conversation.
              </p>
              <ul className="matches__list" role="list" aria-label="Inactive conversations">
                {inactive.map((c) => (
                  <li key={c.match.id}>
                    <ConversationRow convo={c} viewerId={viewer.userId} draft={drafts[c.match.id]} />
                  </li>
                ))}
              </ul>
            </details>
          )}

          {archived.length > 0 && (
            <Link to={ROUTES.archived} className="matches__archived-link">
              <Icon name="archive" size={20} />
              <span>Archived · {archived.length}</span>
              <Icon name="chevronRight" size={18} />
            </Link>
          )}
        </>
      )}
    </Screen>
  );
}
