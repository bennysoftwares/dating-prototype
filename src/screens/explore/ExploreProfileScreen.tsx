import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router';
import { ROUTES } from '../../app/navigation';
import { LikeSheet } from '../../components/discovery/LikeSheet';
import { ExpandedProfile } from '../../components/explore/ExpandedProfile';
import { SafetySheet, type SafetyStep } from '../../components/safety/SafetySheet';
import { Button, EmptyState, ErrorState, Icon, LoadingRegion, Skeleton, useToast } from '../../components/ui';
import { useDiscovery } from '../../discovery/DiscoveryProvider';
import type { LikeTarget } from '../../domain/types';
import { useSticky } from '../../hooks/useSticky';
import { useBack } from '../onboarding/useStepNavigation';
import './ExploreProfileScreen.css';

/**
 * A full profile, opened from an Explore card or Standouts. Structured like a considered
 * profile (photos, prompts, details) with three choices in thumb reach: pass, like with a
 * message, or like. Pass and like are the same decisions as swiping left and right.
 */
export function ExploreProfileScreen() {
  const { profileId = '' } = useParams();
  const navigate = useNavigate();
  const back = useBack();
  const toast = useToast();
  const discovery = useDiscovery();
  const { status, getCandidate, decisionFor } = discovery;
  const [likeTarget, setLikeTarget] = useState<LikeTarget | null>(null);
  const [busy, setBusy] = useState(false);

  const [safetyStep, setSafetyStep] = useState<SafetyStep | null>(null);
  const candidate = useSticky(getCandidate(profileId), Boolean(safetyStep) || busy);
  const decision = decisionFor(profileId);

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'instant' as ScrollBehavior });
    setLikeTarget(null);
  }, [profileId]);
  useEffect(() => {
    document.documentElement.style.setProperty('--toast-bottom', 'calc(128px + var(--safe-bottom))');
    return () => {
      document.documentElement.style.removeProperty('--toast-bottom');
    };
  }, []);

  /** Back to wherever this profile was opened from (Explore or Standouts). */
  const done = () => back(ROUTES.explore);

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
        <EmptyState icon="cards" title="This profile isn't available" action={<Button onClick={() => navigate(ROUTES.explore, { replace: true })}>Back to Explore</Button>}>
          It may no longer fit your discovery settings.
        </EmptyState>
      </div>
    );
  }

  const name = candidate.profile.firstName;
  const rewindAction = discovery.canRewind
    ? { label: 'Undo', onSelect: () => void discovery.rewind() }
    : undefined;

  const onPass = async () => {
    setBusy(true);
    try {
      await discovery.pass(candidate);
      toast({ message: `You passed on ${name}`, action: rewindAction });
      done();
    } catch {
      toast({ message: 'That didn’t save. Try again.' });
      setBusy(false);
    }
  };

  const sendLike = async (target: LikeTarget, comment = '') => {
    setBusy(true);
    try {
      const match = await discovery.like(candidate, target, comment);
      setLikeTarget(null);
      if (match) {
        navigate(`${ROUTES.matchCelebration(match.id)}?from=explore`, { replace: true });
        return;
      }
      toast({ message: comment.trim() ? `Like and message sent to ${name}` : `You liked ${name}`, action: rewindAction });
      done();
    } catch {
      toast({ message: 'That didn’t save. Try again.' });
      setBusy(false);
    }
  };

  return (
    <div className="dprofile">
      <ExpandedProfile
        candidate={candidate}
        onCollapse={done}
        collapseLabel="Back"
        onPass={decision || busy ? undefined : () => void onPass()}
        onLike={decision || busy ? undefined : () => void sendLike({ kind: 'profile' })}
        onReply={decision ? undefined : setLikeTarget}
        onSafety={(step) => setSafetyStep(step)}
        decided={
          decision ? (
            <div className="dprofile__decided">
              <Icon name={decision.kind === 'like' ? 'heart' : 'close'} size={20} filled={decision.kind === 'like'} />
              <span>{decision.kind === 'like' ? `You liked ${name}` : `You passed on ${name}`}</span>
              <Button variant="secondary" size="sm" onClick={done}>Back</Button>
            </div>
          ) : undefined
        }
      />

      <LikeSheet profile={candidate.profile} target={likeTarget} onClose={() => setLikeTarget(null)} onSend={sendLike} />
      {safetyStep && (
        <SafetySheet
          person={candidate.profile}
          open
          initialStep={safetyStep}
          onClose={() => setSafetyStep(null)}
          onDone={() => {
            // After a report or block, leave rather than keep showing this person.
            done();
            void discovery.refresh();
          }}
        />
      )}
    </div>
  );
}
