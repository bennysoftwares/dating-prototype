import { useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router';
import { ROUTES } from '../../app/navigation';
import { Logo, LogoMark } from '../../components/brand/Logo';
import { LikeSheet } from '../../components/discovery/LikeSheet';
import { ExpandedProfile } from '../../components/explore/ExpandedProfile';
import { SwipeDeck, type SwipeDeckHandle } from '../../components/explore/SwipeDeck';
import { SafetySheet, type SafetyStep } from '../../components/safety/SafetySheet';
import { Button, EmptyState, Icon, IconButton, useToast, type IconName } from '../../components/ui';
import { useDiscovery, type SwipeDirection } from '../../discovery/DiscoveryProvider';
import { PROFILE_LIMITS as L } from '../../domain/profileOptions';
import type { LikeTarget } from '../../domain/types';
import type { RankedCandidate } from '../../recommendation';
import { useRepositories } from '../../repositories/RepositoryContext';
import type { FeedSort } from '../../repositories/types';
import { useAccount } from '../../session/useAccount';
import { useSticky } from '../../hooks/useSticky';
import { profileAge } from '../../utils/profileFormat';
import './ExploreScreen.css';

const SORTS: ReadonlyArray<{ id: FeedSort; label: string; icon: IconName }> = [
  { id: 'for_you', label: 'For You', icon: 'heart' },
  { id: 'nearby', label: 'Nearby', icon: 'pin' },
  { id: 'standouts', label: 'Standouts', icon: 'star' },
];

/**
 * Explore: one person at a time, swipe right to like and left to pass, for as long as there
 * are eligible people within your distance and filters. The queue refills itself in pages.
 */
export function ExploreScreen() {
  const navigate = useNavigate();
  const toast = useToast();
  const { users } = useRepositories();
  const discovery = useDiscovery();
  const { feed, view, data, canRewind } = discovery;
  const { paused, incognito, setPaused } = useAccount();
  const [announcement, setAnnouncement] = useState('');
  const [returning, setReturning] = useState<{ profileId: string; from: SwipeDirection } | null>(null);
  const [widening, setWidening] = useState(false);

  // Pick up preference changes made elsewhere (e.g. Discovery settings) as soon as Explore is shown.
  const { refresh } = discovery;
  useEffect(() => {
    void refresh();
  }, [refresh]);

  const top = feed.items[0];
  const onDecide = useCallback(
    (candidate: RankedCandidate, direction: SwipeDirection) => {
      const name = candidate.profile.firstName;
      setReturning(null);
      setAnnouncement(direction === 'right' ? `You liked ${name}.` : `You passed on ${name}.`);
      discovery
        .swipe(candidate, direction)
        .then((match) => {
          if (match) navigate(`${ROUTES.matchCelebration(match.id)}?from=explore`);
        })
        .catch(() => toast({ message: `That didn’t save, so ${name} is back. Try again.` }));
    },
    [discovery, navigate, toast],
  );

  /* ----------------- The card opens in place into the full profile ----------------- */

  const deckRef = useRef<SwipeDeckHandle>(null);
  const [params, setParams] = useSearchParams();
  const expandedId = params.get('profile');
  const [photoStart, setPhotoStart] = useState(0);
  /** Opening pushes a history entry, so the back gesture folds the profile up again. */
  const openedHere = useRef(false);
  const [replyTarget, setReplyTarget] = useState<LikeTarget | null>(null);
  const [safetyStep, setSafetyStep] = useState<SafetyStep | null>(null);
  const live = expandedId ? (feed.items.find((c) => c.profile.id === expandedId) ?? discovery.getCandidate(expandedId)) : undefined;
  // Keep showing them while a sheet is open (a block removes them from discovery mid-flow).
  const expanded = useSticky(live, Boolean(safetyStep || replyTarget));
  /** ✕ / ♥ pressed in the open profile: fold it up, then fly the card away like a swipe. */
  const pendingSwipe = useRef<SwipeDirection | null>(null);

  // Card ↔ profile morph. The new view is captured once React has rendered the change.
  const settle = useRef<(() => void) | null>(null);
  const morph = useCallback((change: () => void) => {
    const doc = document as Document & { startViewTransition?: (cb: () => Promise<void>) => { finished: Promise<void> } };
    if (!doc.startViewTransition || window.matchMedia('(prefers-reduced-motion: reduce)').matches) return change();
    const root = document.documentElement;
    root.classList.add('td-vt');
    const t = doc.startViewTransition(() => new Promise<void>((resolve) => {
      settle.current = resolve;
      change();
      window.setTimeout(resolve, 600);
    }));
    void t.finished.catch(() => undefined).finally(() => root.classList.remove('td-vt'));
  }, []);
  useLayoutEffect(() => {
    settle.current?.();
    settle.current = null;
  }, [expandedId]);

  const onOpen = useCallback(
    (c: RankedCandidate, photoIndex: number) => {
      setPhotoStart(photoIndex);
      openedHere.current = true;
      morph(() => setParams({ profile: c.profile.id }));
    },
    [morph, setParams],
  );

  const collapse = useCallback(
    (animate = true) => {
      const go = () => {
        if (openedHere.current) navigate(-1);
        else setParams({}, { replace: true });
        openedHere.current = false;
      };
      if (animate) morph(go);
      else go();
    },
    [morph, navigate, setParams],
  );

  // A profile link that's no longer valid (decided, blocked) just shows the deck.
  useEffect(() => {
    if (expandedId && !expanded && feed.status === 'ready') setParams({}, { replace: true });
  }, [expandedId, expanded, feed.status, setParams]);

  // After folding up for ✕ / ♥, decide through the deck so the card animates away.
  useEffect(() => {
    const dir = pendingSwipe.current;
    if (expandedId || !dir) return;
    pendingSwipe.current = null;
    requestAnimationFrame(() => deckRef.current?.swipe(dir));
  }, [expandedId]);

  const decideOpen = (direction: SwipeDirection) => {
    if (!expanded) return;
    if (deckRef.current?.topId() === expanded.profile.id) {
      pendingSwipe.current = direction;
      collapse(false);
    } else {
      collapse(false);
      onDecide(expanded, direction);
    }
  };

  const sendReply = async (target: LikeTarget, comment: string) => {
    if (!expanded) return;
    const match = await discovery.like(expanded, target, comment);
    setReplyTarget(null);
    collapse(false);
    if (match) navigate(`${ROUTES.matchCelebration(match.id)}?from=explore`);
    else toast({ message: comment.trim() ? `Like and message sent to ${expanded.profile.firstName}` : `You liked ${expanded.profile.firstName}` });
  };

  const onRewind = async () => {
    const action = view?.rewindable?.action;
    try {
      const restored = await discovery.rewind();
      if (!restored || !action) return;
      setReturning({ profileId: restored.profile.id, from: action.kind === 'pass' ? 'left' : 'right' });
      setAnnouncement(`${restored.profile.firstName} is back.`);
    } catch (err) {
      toast({ message: err instanceof Error ? err.message : 'That couldn’t be undone.' });
    }
  };

  /** One-tap ways out of an empty feed. They change real preferences, so Explore refills. */
  const widen = async (kind: 'distance' | 'age') => {
    const prefs = data?.preferences;
    if (!prefs) return;
    setWidening(true);
    try {
      const next =
        kind === 'distance'
          ? { ...prefs, distance: { ...prefs.distance, maxKm: Math.min(L.distanceMaxKm, prefs.distance.maxKm + 25) } }
          : { ...prefs, age: { ...prefs.age, min: Math.max(L.minAge, prefs.age.min - 3), max: Math.min(80, prefs.age.max + 3) } };
      await users.savePreferences(next);
      await discovery.refresh();
      toast({ message: kind === 'distance' ? `Showing people up to ${next.distance.maxKm} km away` : `Age range is now ${next.age.min}–${next.age.max >= 80 ? '80+' : next.age.max}` });
    } catch {
      toast({ message: 'That didn’t save. Try again.' });
    } finally {
      setWidening(false);
    }
  };

  const rewindable = view?.rewindable;
  const header = (
    <header className="explore__header">
      <Logo size={30} />
      <h1 className="visually-hidden">Explore</h1>
      <div className="explore__tools">
        {canRewind && (
          <IconButton
            icon="rewind"
            variant="surface"
            label={rewindable ? `Undo: bring back ${rewindable.candidate?.profile.firstName ?? 'your last decision'}` : 'Undo (nothing to undo yet)'}
            disabled={!rewindable}
            onClick={() => void onRewind()}
            className="explore__tool"
          />
        )}
        <IconButton icon="sliders" variant="surface" label="Discovery settings" onClick={() => navigate(ROUTES.filters)} className="explore__tool" />
      </div>
    </header>
  );

  if (paused) {
    return (
      <div className="explore">
        {header}
        <div className="explore__state">
          <EmptyState icon="pause" title="Your profile is paused" action={<Button onClick={() => void setPaused(false)}>Unpause profile</Button>}>
            You're not shown to new people, and Explore is resting too. Your matches and conversations are all still here.
          </EmptyState>
        </div>
      </div>
    );
  }

  const prefs = data?.preferences;
  const exhausted = feed.status === 'ready' && feed.items.length === 0 && !feed.hasMore && !feed.loadingMore;
  const noOneFits = exhausted && view?.eligibleTotal === 0;

  return (
    <div className="explore">
      {header}

      <div className="explore__pills" role="group" aria-label="Who to show">
        {SORTS.map((s) => (
          <button
            key={s.id}
            type="button"
            className="pill"
            aria-pressed={feed.sort === s.id}
            onClick={() => discovery.setFeedSort(s.id)}
          >
            <Icon name={s.icon} size={18} filled={feed.sort === s.id} />
            {s.label}
          </button>
        ))}
      </div>

      {incognito && (
        <p className="explore__note">
          <Icon name="incognito" size={16} /> Incognito: only people you like can see you.
        </p>
      )}

      <p className="visually-hidden" aria-live="polite" aria-atomic="true">
        {announcement}
        {top && announcement ? ` Now showing ${top.profile.firstName}, ${profileAge(top.profile)}.` : ''}
      </p>

      <section className="explore__stage" aria-label="People">
        {top ? (
          <>
            {feed.error && (
              <button type="button" className="explore__inline-error" onClick={discovery.retryFeed}>
                Couldn't load more people. <span>Retry</span>
              </button>
            )}
            <SwipeDeck
              ref={deckRef}
              items={feed.items}
              onDecide={onDecide}
              onOpen={onOpen}
              returning={returning}
              morphSource={!expanded}
              label={`Profiles. Showing ${top.profile.firstName}.`}
            />
          </>
        ) : feed.status === 'error' ? (
          <div className="explore__state" role="alert">
            <EmptyState icon="refresh" title="We couldn't load people right now" action={<Button variant="secondary" onClick={discovery.retryFeed}>Try again</Button>}>
              Check your connection and try again. Nothing you've done has been lost.
            </EmptyState>
          </div>
        ) : exhausted && feed.sort === 'standouts' ? (
          <div className="explore__state">
            <EmptyState icon="star" title="You've seen today's Standouts" action={<Button variant="secondary" onClick={() => discovery.setFeedSort('for_you')}>Back to For You</Button>}>
              A fresh set is picked for you each day. For You and Nearby still have people to meet.
            </EmptyState>
          </div>
        ) : noOneFits ? (
          <div className="explore__state">
            <EmptyState icon="sliders" title="No one matches your settings yet" action={<Button onClick={() => navigate(ROUTES.filters)}>Adjust discovery settings</Button>}>
              Your distance, age range or dealbreakers leave no one to show. Loosening one of them will bring people in.
            </EmptyState>
          </div>
        ) : exhausted && prefs ? (
          <div className="explore__state">
            <EmptyState
              icon="pin"
              title="You've seen everyone nearby."
              action={
                <div className="explore__widen">
                  {prefs.distance.maxKm < L.distanceMaxKm && (
                    <Button onClick={() => void widen('distance')} disabled={widening} icon="target">
                      Increase distance to {Math.min(L.distanceMaxKm, prefs.distance.maxKm + 25)} km
                    </Button>
                  )}
                  {(prefs.age.min > L.minAge || prefs.age.max < 80) && prefs.age.mode === 'dealbreaker' && (
                    <Button variant="secondary" onClick={() => void widen('age')} disabled={widening} icon="cake">
                      Widen age range
                    </Button>
                  )}
                  <Button variant="quiet" onClick={() => navigate(ROUTES.filters)} icon="sliders">
                    Adjust discovery preferences
                  </Button>
                </div>
              }
            >
              That's everyone within {prefs.distance.maxKm} km who fits your filters. New people join all the time.
            </EmptyState>
          </div>
        ) : (
          <div className="explore__loading" role="status" aria-label="Finding people for you">
            <div className="explore__loading-card">
              <LogoMark size={44} className="explore__loading-mark" />
            </div>
          </div>
        )}
      </section>

      {expanded && (
        <ExpandedProfile
          candidate={expanded}
          initialPhoto={photoStart}
          onCollapse={() => collapse()}
          collapseLabel={`Back to ${expanded.profile.firstName}'s card`}
          onPass={() => decideOpen('left')}
          onLike={() => decideOpen('right')}
          onReply={setReplyTarget}
          onSafety={setSafetyStep}
        />
      )}
      {expanded && <LikeSheet profile={expanded.profile} target={replyTarget} onClose={() => setReplyTarget(null)} onSend={sendReply} />}
      {expanded && safetyStep && (
        <SafetySheet
          person={expanded.profile}
          open
          initialStep={safetyStep}
          onClose={() => setSafetyStep(null)}
          onDone={() => {
            setSafetyStep(null);
            collapse(false);
            void discovery.refresh();
          }}
        />
      )}
    </div>
  );
}
