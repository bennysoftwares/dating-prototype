import { useState } from 'react';
import { Link, useNavigate } from 'react-router';
import { ROUTES } from '../../app/navigation';
import { LikedSnapshot } from '../../components/connections/LikedSnapshot';
import { Screen } from '../../components/layout';
import { Avatar, Button, EmptyState, ErrorState, Icon, LoadingRegion, Skeleton, useToast } from '../../components/ui';
import { useConnections, type IncomingLike } from '../../connections/ConnectionsProvider';
import { describeSnapshot } from '../../domain/matching';
import { formatRelativeShort } from '../../utils/time';
import { profileAge } from '../../utils/profileFormat';
import './LikesScreen.css';

/** People who liked you: never blurred, never paywalled. */
export function LikesScreen() {
  const { status, error, incoming, refresh } = useConnections();
  return (
    <Screen title="Likes">
      {status === 'loading' && (
        <LoadingRegion label="Loading likes">
          <div className="likes__loading">{[0, 1].map((i) => <Skeleton key={i} height={180} />)}</div>
        </LoadingRegion>
      )}
      {status === 'error' && <ErrorState message={error?.message} onRetry={() => void refresh()} />}
      {status === 'ready' && incoming.length === 0 && (
        <EmptyState icon="heart" title="No new likes right now">
          When someone likes your profile, you'll see exactly who they are and what caught their eye.
        </EmptyState>
      )}
      {status === 'ready' && incoming.length > 0 && (
        <>
          <p className="likes__intro">
            {incoming.length === 1 ? '1 person likes you.' : `${incoming.length} people like you.`} Match to start talking, or pass. They won't be told either way until you match.
          </p>
          <ul className="likes__list" role="list">
            {incoming.map((item) => (
              <li key={item.like.id}>
                <IncomingLikeCard item={item} />
              </li>
            ))}
          </ul>
        </>
      )}
    </Screen>
  );
}

function IncomingLikeCard({ item }: { item: IncomingLike }) {
  const { like, from } = item;
  const { viewer, acceptLike, passLike } = useConnections();
  const navigate = useNavigate();
  const toast = useToast();
  const [busy, setBusy] = useState(false);
  const snapshot = like.snapshot ?? { kind: 'profile' as const };
  const what = describeSnapshot(snapshot, true, from.firstName);

  const onMatch = async () => {
    setBusy(true);
    try {
      const match = await acceptLike(like.id);
      if (match) navigate(`${ROUTES.matchCelebration(match.id)}?from=likes`);
    } catch {
      toast({ message: 'That didn’t work. Try again.' });
      setBusy(false);
    }
  };

  const onPass = async () => {
    setBusy(true);
    try {
      await passLike(like.id);
      toast({ message: `You passed on ${from.firstName}` });
    } catch {
      toast({ message: 'That didn’t work. Try again.' });
      setBusy(false);
    }
  };

  return (
    <article className="like-card" aria-label={`${from.firstName} liked ${what}`}>
      <Link to={ROUTES.likeProfile(like.id)} className="like-card__person" aria-label={`View ${from.firstName}'s profile`}>
        <Avatar photo={from.photos[0]} name={from.firstName} size={64} />
        <span className="like-card__who">
          <span className="like-card__name">
            {from.firstName}, {profileAge(from)}
          </span>
          <span className="like-card__what">
            Liked {what} · <time dateTime={like.createdAt}>{formatRelativeShort(like.createdAt)}</time>
          </span>
        </span>
        <span className="like-card__view" aria-hidden="true">
          Profile <Icon name="chevronRight" size={16} />
        </span>
      </Link>

      {snapshot.kind !== 'profile' && (
        <div className="like-card__snapshot">
          <LikedSnapshot snapshot={snapshot} owner={viewer} compact />
        </div>
      )}

      {like.comment && (
        <p className="like-card__comment">
          <span className="visually-hidden">{from.firstName} wrote: </span>
          {like.comment}
        </p>
      )}

      <div className="like-card__actions">
        <Button variant="secondary" icon="close" onClick={() => void onPass()} disabled={busy} aria-label={`Pass on ${from.firstName}`}>
          Pass
        </Button>
        <Button icon="heart" onClick={() => void onMatch()} disabled={busy} aria-label={`Match with ${from.firstName}`}>
          Match
        </Button>
      </div>
    </article>
  );
}
