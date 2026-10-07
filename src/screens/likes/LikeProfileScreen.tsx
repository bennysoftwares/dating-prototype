import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router';
import { ROUTES } from '../../app/navigation';
import { LikedSnapshot } from '../../components/connections/LikedSnapshot';
import { ProfileView } from '../../components/profile/ProfileView';
import { SafetySheet } from '../../components/safety/SafetySheet';
import { Button, EmptyState, IconButton, LoadingRegion, Skeleton, useToast } from '../../components/ui';
import { useConnections } from '../../connections/ConnectionsProvider';
import { describeSnapshot } from '../../domain/matching';
import { buildCompatibility } from '../../recommendation/compatibility';
import { approxDistanceKm, distanceLabel } from '../../utils/profileFormat';
import { useSticky } from '../../hooks/useSticky';
import { useBack } from '../onboarding/useStepNavigation';
import '../explore/ExploreProfileScreen.css';
import './LikesScreen.css';

/** The full profile of someone who liked you, with what they liked on top and Match / Pass below. */
export function LikeProfileScreen() {
  const { likeId = '' } = useParams();
  const navigate = useNavigate();
  const back = useBack();
  const toast = useToast();
  const { status, viewer, getIncoming, acceptLike, passLike } = useConnections();
  const [busy, setBusy] = useState(false);
  const [safetyOpen, setSafetyOpen] = useState(false);
  const item = useSticky(getIncoming(likeId), safetyOpen);

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'instant' as ScrollBehavior });
    document.documentElement.style.setProperty('--toast-bottom', 'calc(var(--action-bar-height) + var(--safe-bottom) + var(--space-3))');
    return () => {
      document.documentElement.style.removeProperty('--toast-bottom');
    };
  }, []);

  if (status === 'loading') {
    return (
      <LoadingRegion label="Loading profile">
        <div className="dprofile__loading"><Skeleton ratio="4 / 5" className="dprofile__skeleton" /></div>
      </LoadingRegion>
    );
  }
  if (!item || !viewer) {
    return (
      <div className="dprofile__missing">
        <EmptyState icon="heart" title="This like isn't here anymore" action={<Button onClick={() => navigate(ROUTES.likes, { replace: true })}>Back to likes</Button>}>
          You may have already matched or passed.
        </EmptyState>
      </div>
    );
  }

  const { like, from } = item;
  const snapshot = like.snapshot ?? { kind: 'profile' as const };

  const onMatch = async () => {
    setBusy(true);
    try {
      const match = await acceptLike(like.id);
      if (match) navigate(`${ROUTES.matchCelebration(match.id)}?from=likes`, { replace: true });
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
      navigate(ROUTES.likes, { replace: true });
    } catch {
      toast({ message: 'That didn’t work. Try again.' });
      setBusy(false);
    }
  };

  return (
    <div className="dprofile">
      <header className="dprofile__top">
        <IconButton icon="chevronLeft" label="Back to likes" onClick={() => back(ROUTES.likes)} />
        <div className="dprofile__heading">
          <h1>{from.firstName}</h1>
          <p>Liked you</p>
        </div>
        <IconButton icon="more" label={`More options for ${from.firstName}`} onClick={() => setSafetyOpen(true)} />
      </header>
      <main className="dprofile__body dprofile__body--stack">
        <section className="like-card like-card--banner" aria-label="What they liked">
          <p className="like-card__what">
            {from.firstName} liked {describeSnapshot(snapshot, true, from.firstName)}
          </p>
          {snapshot.kind !== 'profile' && <LikedSnapshot snapshot={snapshot} owner={viewer} compact />}
          {like.comment && <p className="like-card__comment">{like.comment}</p>}
        </section>
        <ProfileView
          profile={from}
          distanceLabel={distanceLabel(from, approxDistanceKm(viewer.location, from.location))}
          compatibility={buildCompatibility(viewer, from)}
        />
      </main>
      <SafetySheet person={from} open={safetyOpen} onClose={() => setSafetyOpen(false)} onDone={() => navigate(ROUTES.likes, { replace: true })} />
      <footer className="dprofile__actions">
        <Button variant="secondary" size="lg" icon="close" onClick={() => void onPass()} disabled={busy} className="dprofile__pass">
          Pass
        </Button>
        <Button size="lg" icon="heart" onClick={() => void onMatch()} disabled={busy} className="dprofile__like">
          Match
        </Button>
      </footer>
    </div>
  );
}
