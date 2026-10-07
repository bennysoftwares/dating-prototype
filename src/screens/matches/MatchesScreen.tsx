import { Screen } from '../../components/layout';
import { Avatar, EmptyState, ErrorState, ListGroup, ListRow, LoadingRegion, Skeleton } from '../../components/ui';
import type { Match, Message, Profile } from '../../domain/types';
import { useAsync } from '../../hooks/useAsync';
import { useRepositories } from '../../repositories/RepositoryContext';
import { formatRelativeShort } from '../../utils/time';
import './MatchesScreen.css';

interface ConversationSummary {
  match: Match;
  profile: Profile;
  lastMessage: Message | undefined;
}

/** Placeholder conversation list built from mock data. Chat itself comes in Part 4. */
export function MatchesScreen() {
  const { users, profiles, matches } = useRepositories();
  const state = useAsync(async () => {
    const user = await users.getCurrentUser();
    const list = await matches.listMatches();
    const rows = await Promise.all(
      list.map(async (match): Promise<ConversationSummary | null> => {
        const otherId = match.userIds.find((id) => id !== user.id);
        const [profile, messages] = await Promise.all([
          otherId ? profiles.getProfileByUserId(otherId) : Promise.resolve(null),
          matches.listMessages(match.id),
        ]);
        return profile ? { match, profile, lastMessage: messages.at(-1) } : null;
      }),
    );
    return { userId: user.id, rows: rows.filter((r): r is ConversationSummary => r !== null) };
  }, [users, profiles, matches]);

  return (
    <Screen title="Matches">
      {state.status === 'loading' && (
        <LoadingRegion label="Loading matches">
          <div className="matches__loading">
            {[0, 1, 2].map((i) => <Skeleton key={i} height={72} />)}
          </div>
        </LoadingRegion>
      )}
      {state.status === 'error' && <ErrorState onRetry={state.retry} />}
      {state.status === 'success' && state.data.rows.length === 0 && (
        <EmptyState icon="chat" title="No matches yet">
          When you and someone both like each other, your conversation starts here.
        </EmptyState>
      )}
      {state.status === 'success' && state.data.rows.length > 0 && (
        <ListGroup label="Conversations">
          {state.data.rows.map(({ match, profile, lastMessage }) => {
            const theirTurn = lastMessage?.senderId !== state.data.userId;
            const preview = lastMessage
              ? `${lastMessage.senderId === state.data.userId ? 'You: ' : ''}${lastMessage.body}`
              : match.context ?? 'Say hello';
            return (
              <ListRow
                key={match.id}
                leading={<Avatar photo={profile.photos[0]} name={profile.firstName} size={52} />}
                title={profile.firstName}
                subtitle={preview}
                trailing={
                  <span className="matches__meta">
                    <time dateTime={match.lastActivityAt}>{formatRelativeShort(match.lastActivityAt)}</time>
                    {theirTurn && lastMessage && <span className="matches__dot" aria-label="Your turn" />}
                  </span>
                }
                className="matches__row"
              />
            );
          })}
        </ListGroup>
      )}
    </Screen>
  );
}
