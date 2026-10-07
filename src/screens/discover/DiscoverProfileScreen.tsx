import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router';
import { ROUTES } from '../../app/navigation';
import { LikeSheet } from '../../components/discovery/LikeSheet';
import { ProfileView } from '../../components/profile/ProfileView';
import { Button, EmptyState, ErrorState, Icon, IconButton, LoadingRegion, Skeleton, useToast } from '../../components/ui';
import { useDiscovery } from '../../discovery/DiscoveryProvider';
import type { LikeTarget } from '../../domain/types';
import { useBack } from '../onboarding/useStepNavigation';
import './DiscoverProfileScreen.css';

/**
 * A full profile from Discover. Like a specific photo or answer (encouraged) or the
 * whole profile; Pass is always one tap away. Both actions sit at the bottom, in thumb reach.
 */
export function DiscoverProfileScreen() {
  const { profileId = '' } = useParams();
  const navigate = useNavigate();
  const back = useBack();
  const toast = useToast();
  const discovery = useDiscovery();
  const { status, view, getCandidate, decisionFor, nextAfter } = discovery;
  const [likeTarget, setLikeTarget] = useState<LikeTarget | null>(null);
  const [busy, setBusy] = useState(false);

  const candidate = getCandidate(profileId);
  const decision = decisionFor(profileId);

  // Each profile starts at the top; keep toasts above the action bar.
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'instant' as ScrollBehavior });
    setLikeTarget(null);
  }, [profileId]);
  useEffect(() => {
    document.documentElement.style.setProperty('--toast-bottom', 'calc(var(--action-bar-height) + var(--safe-bottom) + var(--space-3))');
    return () => {
      document.documentElement.style.removeProperty('--toast-bottom');
    };
  }, []);

  const toList = () => back(ROUTES.discover);
  const goNext = () => {
    const next = nextAfter(profileId);
    if (next) navigate(ROUTES.discoverProfile(next.profile.id), { replace: true });
    else navigate(ROUTES.discover, { replace: true });
  };

  if (status === 'loading') {
    return (
      <LoadingRegion label="Loading profile">
        <div className="dprofile__loading">
          <Skeleton ratio="4 / 5" className="dprofile__skeleton" />
        </div>
      </LoadingRegion>
    );
  }
  if (status === 'error') return <ErrorState onRetry={() => void discovery.refresh()} />;
  if (!candidate) {
    return (
      <div className="dprofile__missing">
        <EmptyState icon="discover" title="This profile isn't available" action={<Button onClick={() => navigate(ROUTES.discover, { replace: true })}>Back to today's picks</Button>}>
          It may no longer fit your preferences.
        </EmptyState>
      </div>
    );
  }

  const name = candidate.profile.firstName;
  const queue = view ? [...view.picks, ...(view.exploreOpened ? view.explore : [])] : [];
  const position = queue.findIndex((c) => c.profile.id === profileId);

  const onPass = async () => {
    setBusy(true);
    try {
      await discovery.pass(candidate);
      toast({
        message: `You passed on ${name}`,
        action: {
          label: 'Undo',
          onSelect: () => {
            void discovery.undoPass().then((restored) => {
              if (restored) navigate(ROUTES.discoverProfile(restored.profile.id), { replace: true });
            });
          },
        },
      });
      goNext();
    } catch {
      toast({ message: 'That didn’t save. Try again.' });
    } finally {
      setBusy(false);
    }
  };

  const onSend = async (target: LikeTarget, comment: string) => {
    await discovery.like(candidate, target, comment);
    setLikeTarget(null);
    toast({ message: comment.trim() ? `Like and message sent to ${name}` : `Like sent to ${name}` });
    goNext();
  };

  return (
    <div className="dprofile">
      <header className="dprofile__top">
        <IconButton icon="chevronLeft" label="Back to today's picks" onClick={toList} />
        <div className="dprofile__heading">
          <h1>{name}</h1>
          {position >= 0 && <p>{queue.length - position - 1 === 0 ? 'Last one for now' : `${queue.length - position - 1} more after this`}</p>}
        </div>
        <span className="dprofile__spacer" />
      </header>

      <main className="dprofile__body">
        <ProfileView
          profile={candidate.profile}
          distanceLabel={`${candidate.distanceKm} km away`}
          compatibility={candidate.compatibility}
          onLike={decision ? undefined : setLikeTarget}
          likedTarget={decision?.kind === 'like' ? decision.like.target : undefined}
        />
      </main>

      <footer className="dprofile__actions">
        {decision ? (
          <div className="dprofile__decided">
            <Icon name={decision.kind === 'like' ? 'heart' : 'close'} size={20} filled={decision.kind === 'like'} />
            <span>{decision.kind === 'like' ? `You liked ${name}` : `You passed on ${name}`}</span>
            <Button variant="secondary" size="sm" onClick={toList}>Back to picks</Button>
          </div>
        ) : (
          <>
            <Button variant="secondary" size="lg" icon="close" onClick={() => void onPass()} disabled={busy} className="dprofile__pass">
              Pass
            </Button>
            <Button size="lg" icon="heart" onClick={() => setLikeTarget({ kind: 'profile' })} disabled={busy} className="dprofile__like">
              Like
            </Button>
          </>
        )}
      </footer>

      <LikeSheet profile={candidate.profile} target={likeTarget} onClose={() => setLikeTarget(null)} onSend={onSend} />
    </div>
  );
}
