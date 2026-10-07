import { useEffect } from 'react';
import { useNavigate } from 'react-router';
import { ROUTES } from '../../app/navigation';
import { PickCard } from '../../components/discovery/PickCard';
import { Screen, Section } from '../../components/layout';
import { Button, EmptyState, ErrorState, Icon, IconButton, LoadingRegion, Skeleton, useToast } from '../../components/ui';
import { useAccount } from '../../session/useAccount';
import { useDiscovery } from '../../discovery/DiscoveryProvider';
import { useScrollRestoration } from '../../hooks/useScrollRestoration';
import './DiscoverScreen.css';

/**
 * Today's picks: a small curated set with reasons, then an optional, secondary
 * Explore more. Decisions happen inside each full profile, not on the card.
 */
export function DiscoverScreen() {
  const navigate = useNavigate();
  const toast = useToast();
  const { status, error, view, refresh, undoPass, openExplore } = useDiscovery();
  const { paused, incognito, setPaused } = useAccount();

  // Re-rank quietly whenever Discover is shown (e.g. after editing preferences).
  useEffect(() => {
    void refresh();
  }, [refresh]);

  useScrollRestoration('discover', status === 'ready');

  const today = new Date().toLocaleDateString(undefined, { weekday: 'long', day: 'numeric', month: 'long' });
  const profileLink = (id: string) => ROUTES.discoverProfile(id);

  const onUndo = async () => {
    const restored = await undoPass();
    if (restored) toast({ message: `${restored.profile.firstName} is back in your picks` });
  };

  const actions = (
    <>
      {view?.undoablePass && (
        <IconButton icon="undo" label={`Undo last pass${view.undoablePass.candidate ? ` (${view.undoablePass.candidate.profile.firstName})` : ''}`} onClick={() => void onUndo()} />
      )}
      <IconButton icon="filter" label="Filters" onClick={() => navigate(ROUTES.filters)} />
    </>
  );

  if (paused) {
    return (
      <Screen title="Today's picks" eyebrow={today}>
        <EmptyState
          icon="pause"
          title="Your profile is paused"
          action={<Button onClick={() => void setPaused(false)}>Unpause profile</Button>}
        >
          You're not shown to new people, and Discover is resting too. Your matches and conversations are all still here.
        </EmptyState>
      </Screen>
    );
  }

  return (
    <Screen title="Today's picks" eyebrow={today} actions={actions}>
      {incognito && (
        <p className="discover__banner">
          <Icon name="incognito" size={18} /> Incognito is on. Only people you like can see your profile.
        </p>
      )}
      {status === 'loading' && (
        <LoadingRegion label="Loading today's picks">
          <div className="discover__loading">
            <Skeleton height={20} className="discover__line-skeleton" />
            <Skeleton ratio="5 / 6" className="discover__hero-skeleton" />
          </div>
        </LoadingRegion>
      )}

      {status === 'error' && <ErrorState message={error?.message} onRetry={() => void refresh()} />}

      {status === 'ready' && view && view.dailyTotal === 0 && view.explore.length === 0 && (
        <EmptyState
          icon="discover"
          title="No one fits your dealbreakers right now"
          action={<Button variant="secondary" onClick={() => navigate(ROUTES.profileEditStep('dealbreakers'))}>Review your preferences</Button>}
        >
          New people join every day. Loosening a dealbreaker or your distance will show more people.
        </EmptyState>
      )}

      {status === 'ready' && view && view.dailyTotal > 0 && (
        <>
          <div className="discover__intro">
            <p>
              {view.dailyTotal} {view.dailyTotal === 1 ? 'person' : 'people'} selected around your preferences
            </p>
            <div className="discover__progress" aria-label={`${view.dailySeen} of ${view.dailyTotal} seen`} role="img">
              {Array.from({ length: view.dailyTotal }, (_, i) => (
                <span key={i} className={i < view.dailySeen ? 'is-seen' : undefined} />
              ))}
            </div>
          </div>

          {view.picks.length > 0 ? (
            <ul className="discover__list" role="list" aria-label="Today's picks">
              {view.picks.map((c) => (
                <li key={c.profile.id}>
                  <PickCard candidate={c} to={profileLink(c.profile.id)} />
                </li>
              ))}
            </ul>
          ) : (
            <EmptyState
              icon="sparkle"
              title="That's everyone in today's recommendations"
              action={
                !view.exploreOpened && view.explore.length > 0 ? (
                  <Button variant="secondary" onClick={() => void openExplore()}>Explore more</Button>
                ) : undefined
              }
            >
              We'll have more for you soon.
            </EmptyState>
          )}
        </>
      )}

      {status === 'ready' && view && view.dailyTotal === 0 && view.explore.length > 0 && !view.exploreOpened && (
        <EmptyState icon="sparkle" title="That's everyone in today's recommendations" action={<Button variant="secondary" onClick={() => void openExplore()}>Explore more</Button>}>
          We'll have more for you soon.
        </EmptyState>
      )}

      {status === 'ready' && view?.exploreOpened && (
        <Section title="Explore more" description="A few more people who fit your dealbreakers, a little further from your preferences.">
          {view.explore.length > 0 ? (
            <ul className="discover__list" role="list" aria-label="Explore more">
              {view.explore.map((c) => (
                <li key={c.profile.id}>
                  <PickCard candidate={c} to={profileLink(c.profile.id)} />
                </li>
              ))}
            </ul>
          ) : (
            <p className="discover__done">You've seen everyone for now. New people join every day.</p>
          )}
        </Section>
      )}
    </Screen>
  );
}
