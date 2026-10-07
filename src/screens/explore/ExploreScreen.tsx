import { useCallback, useEffect, useState } from 'react';
import { useNavigate } from 'react-router';
import { ROUTES } from '../../app/navigation';
import { Logo, LogoMark } from '../../components/brand/Logo';
import { SwipeDeck } from '../../components/explore/SwipeDeck';
import { Button, EmptyState, Icon, IconButton, useToast, type IconName } from '../../components/ui';
import { useDiscovery, type SwipeDirection } from '../../discovery/DiscoveryProvider';
import { PROFILE_LIMITS as L } from '../../domain/profileOptions';
import type { RankedCandidate } from '../../recommendation';
import { useRepositories } from '../../repositories/RepositoryContext';
import type { FeedSort } from '../../repositories/types';
import { useAccount } from '../../session/useAccount';
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

  const onOpen = useCallback((c: RankedCandidate) => navigate(ROUTES.exploreProfile(c.profile.id)), [navigate]);

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
            <SwipeDeck items={feed.items} onDecide={onDecide} onOpen={onOpen} returning={returning} label={`Profiles. Showing ${top.profile.firstName}.`} />
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
    </div>
  );
}
