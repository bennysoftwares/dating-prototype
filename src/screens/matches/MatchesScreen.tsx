import { useState } from 'react';
import { Link } from 'react-router';
import { ROUTES } from '../../app/navigation';
import { ConversationRow } from '../../components/connections/ConversationRow';
import { Screen, Section } from '../../components/layout';
import { Avatar, EmptyState, ErrorState, Icon, IconButton, LoadingRegion, Skeleton } from '../../components/ui';
import { useConnections } from '../../connections/ConnectionsProvider';
import { useDrafts } from '../../connections/useDrafts';
import { INACTIVE_AFTER_DAYS } from '../../domain/matching';
import './MatchesScreen.css';

/** Chats: new matches, conversations by recent activity, inactive chats, and a way to archived ones. */
export function MatchesScreen() {
  const { status, error, viewer, conversations, refresh } = useConnections();
  const { drafts } = useDrafts();
  const [searching, setSearching] = useState(false);
  const [query, setQuery] = useState('');

  const q = query.trim().toLowerCase();
  const visible = q ? conversations.filter((c) => c.other.firstName.toLowerCase().includes(q)) : conversations;
  const fresh = visible.filter((c) => c.state === 'new');
  const ongoing = visible.filter((c) => c.state === 'active' || c.state === 'nudge');
  const inactive = visible.filter((c) => c.state === 'inactive');
  const archived = conversations.filter((c) => c.state === 'archived');
  const nothing = conversations.filter((c) => c.state !== 'archived').length === 0;
  const noResults = !nothing && q && fresh.length + ongoing.length + inactive.length === 0;

  const toggleSearch = () => {
    setSearching((s) => !s);
    setQuery('');
  };

  return (
    <Screen
      title="Chats"
      actions={<IconButton icon={searching ? 'close' : 'search'} variant="surface" label={searching ? 'Close search' : 'Search chats'} onClick={toggleSearch} />}
    >
      {searching && (
        <label className="matches__search">
          <Icon name="search" size={20} />
          <span className="visually-hidden">Search chats by name</span>
          <input type="search" value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search by name" autoFocus enterKeyHint="search" />
        </label>
      )}
      {status === 'loading' && (
        <LoadingRegion label="Loading matches">
          <div className="matches__loading">{[0, 1, 2].map((i) => <Skeleton key={i} height={72} />)}</div>
        </LoadingRegion>
      )}
      {status === 'error' && <ErrorState message={error?.message} onRetry={() => void refresh()} />}

      {status === 'ready' && viewer && (
        <>
          {nothing && (
            <EmptyState icon="chat" title="No chats yet">
              When you and someone both like each other, your conversation starts here.
            </EmptyState>
          )}
          {noResults && <p className="matches__inactive-note" role="status">No chats with a name matching “{query.trim()}”.</p>}

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
            <Section title="Messages">
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
