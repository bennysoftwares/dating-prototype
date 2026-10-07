import { useState } from 'react';
import { Link, useNavigate } from 'react-router';
import { ROUTES } from '../../app/navigation';
import { Screen } from '../../components/layout';
import { EmptyState, ErrorState, Icon, LoadingRegion, PhotoFrame, Skeleton, useToast } from '../../components/ui';
import { LikedSnapshot } from '../../components/connections/LikedSnapshot';
import { useConnections, type IncomingLike } from '../../connections/ConnectionsProvider';
import { describeSnapshot } from '../../domain/matching';
import { formatRelativeShort } from '../../utils/time';
import { profileAge } from '../../utils/profileFormat';
import './LikesScreen.css';

/** People who liked you: never blurred, never paywalled. */
export function LikesScreen() {
  const { status, error, incoming, refresh } = useConnections();
  return (
    <Screen title="Likes" className="screen--wide">
      {status === 'loading' && (
        <LoadingRegion label="Loading likes">
          <div className="likes__list">{[0, 1, 2, 3].map((i) => <Skeleton key={i} ratio="3 / 4" className="likes__skeleton" />)}</div>
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
            {incoming.length === 1 ? '1 person likes you.' : `${incoming.length} people like you.`} Match to start talking, or pass. They're only told if you match.
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

  const verified = from.verification?.photo === 'verified';
  return (
    <article className="like-card" aria-label={`${from.firstName} liked ${what}`}>
      <Link to={ROUTES.likeProfile(like.id)} className="like-card__person">
        <PhotoFrame photo={from.photos[0]} ratio="3 / 4" rounded="none" monogram={from.firstName.charAt(0)} decorative>
          <div className="like-card__shade" />
          <span className="like-card__who">
            <span className="like-card__name">
              {from.firstName} <span className="like-card__age">{profileAge(from)}</span>
              {verified && <Icon name="verified" size={20} filled className="like-card__verified" label="Photo verified" />}
            </span>
            <span className="like-card__place">{from.location.city}</span>
          </span>
        </PhotoFrame>
        <span className="visually-hidden">View profile</span>
      </Link>

      <div className="like-card__body">
        <p className="like-card__what">
          <Icon name="heart" size={14} filled />
          <span>Liked {what} · <time dateTime={like.createdAt}>{formatRelativeShort(like.createdAt)}</time></span>
        </p>
        {snapshot.kind === 'prompt' && <p className="like-card__quote">“{snapshot.answer}”</p>}
        {snapshot.kind === 'photo' && (
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
          <button type="button" className="like-card__btn like-card__btn--pass" onClick={() => void onPass()} disabled={busy}>
            <Icon name="close" size={22} strokeWidth={2.3} />
            <span className="visually-hidden">Pass on {from.firstName}</span>
          </button>
          <button type="button" className="like-card__btn like-card__btn--match" onClick={() => void onMatch()} disabled={busy}>
            <Icon name="heart" size={22} filled />
            <span>Match</span>
            <span className="visually-hidden"> with {from.firstName}</span>
          </button>
        </div>
      </div>
    </article>
  );
}
