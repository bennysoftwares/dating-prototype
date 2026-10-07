import { useNavigate } from 'react-router';
import { Screen } from '../../components/layout';
import { Avatar, Button, EmptyState, ErrorState, IconButton, ListGroup, ListRow, LoadingRegion, Skeleton, useToast } from '../../components/ui';
import { useConnections } from '../../connections/ConnectionsProvider';
import { useAsync } from '../../hooks/useAsync';
import { useRepositories } from '../../repositories/RepositoryContext';
import './Settings.css';

/** People you've blocked. Unblocking doesn't restore a removed match. */
export function BlockedScreen() {
  const navigate = useNavigate();
  const toast = useToast();
  const { safety, profiles } = useRepositories();
  const { refresh } = useConnections();
  const state = useAsync(async () => {
    const blocks = await safety.listBlocks();
    return Promise.all(blocks.map(async (b) => ({ block: b, profile: await profiles.getProfileByUserId(b.blockedUserId) })));
  }, [safety, profiles]);

  const unblock = async (userId: string, name: string) => {
    await safety.unblock(userId);
    await refresh();
    state.retry();
    toast({ message: `${name} is unblocked` });
  };

  return (
    <Screen title="Blocked" leading={<IconButton icon="chevronLeft" label="Back" onClick={() => navigate(-1)} />}>
      <p className="settings__intro">Blocked people can't see you or message you, and you won't see them. They're never told.</p>
      {state.status === 'loading' && <LoadingRegion label="Loading"><Skeleton height={120} /></LoadingRegion>}
      {state.status === 'error' && <ErrorState onRetry={state.retry} />}
      {state.status === 'success' && state.data.length === 0 && <EmptyState icon="shield" title="You haven't blocked anyone" />}
      {state.status === 'success' && state.data.length > 0 && (
        <ListGroup label="Blocked users">
          {state.data.map(({ block, profile }) => (
            <ListRow
              key={block.id}
              leading={<Avatar photo={profile?.photos[0]} name={profile?.firstName ?? '?'} size={44} />}
              title={profile?.firstName ?? 'Unknown'}
              subtitle={`Blocked on ${new Date(block.createdAt).toLocaleDateString(undefined, { day: 'numeric', month: 'short' })}`}
              trailing={
                <Button variant="secondary" size="sm" onClick={() => void unblock(block.blockedUserId, profile?.firstName ?? 'They')}>
                  Unblock
                </Button>
              }
            />
          ))}
        </ListGroup>
      )}
    </Screen>
  );
}
