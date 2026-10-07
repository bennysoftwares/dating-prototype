import { useEffect } from 'react';
import { Link, useNavigate } from 'react-router';
import { ROUTES } from '../../app/navigation';
import { Screen } from '../../components/layout';
import { Button, EmptyState, ErrorState, Icon, IconButton, LoadingRegion, PhotoFrame, Skeleton } from '../../components/ui';
import { useDiscovery } from '../../discovery/DiscoveryProvider';
import type { RankedCandidate } from '../../recommendation';
import { useAccount } from '../../session/useAccount';
import { useScrollRestoration } from '../../hooks/useScrollRestoration';
import { profileAge } from '../../utils/profileFormat';
import './StandoutsScreen.css';

/**
 * Standouts: a small set picked each day from everyone who fits your filters, ranked on
 * compatibility (never on payment or popularity). Fixed for the day so it never reshuffles.
 */
export function StandoutsScreen() {
  const navigate = useNavigate();
  const { status, error, view, refresh } = useDiscovery();
  const { paused } = useAccount();

  useEffect(() => {
    void refresh();
  }, [refresh]);
  useScrollRestoration('standouts', status === 'ready');

  const settings = <IconButton icon="sliders" variant="surface" label="Discovery settings" onClick={() => navigate(ROUTES.filters)} />;

  return (
    <Screen title="Standouts" subtitle="A few people picked for you today, chosen for how well you might fit." actions={settings} className="screen--wide">
      {paused && (
        <EmptyState icon="pause" title="Your profile is paused">Standouts are resting while you're paused.</EmptyState>
      )}
      {!paused && status === 'loading' && (
        <LoadingRegion label="Loading Standouts">
          <div className="standouts__grid">
            <Skeleton ratio="4 / 5" className="standout standout--feature" />
            <Skeleton ratio="3 / 4" className="standout" />
            <Skeleton ratio="3 / 4" className="standout" />
          </div>
        </LoadingRegion>
      )}
      {!paused && status === 'error' && <ErrorState message={error?.message} onRetry={() => void refresh()} />}
      {!paused && status === 'ready' && view && (
        view.picks.length > 0 ? (
          <ul className="standouts__grid" role="list" aria-label="Today's Standouts">
            {view.picks.map((c, i) => (
              <li key={c.profile.id} className={i === 0 ? 'standout standout--feature' : 'standout'}>
                <StandoutCard candidate={c} featured={i === 0} />
              </li>
            ))}
          </ul>
        ) : (
          <EmptyState
            icon="star"
            title={view.dailyTotal > 0 ? "You've seen today's Standouts" : 'No Standouts yet'}
            action={<Button onClick={() => navigate(ROUTES.explore)}>Go to Explore</Button>}
          >
            {view.dailyTotal > 0 ? 'A fresh set is picked for you each day. Explore still has people to meet.' : 'When people fit your discovery settings, the best fits will appear here.'}
          </EmptyState>
        )
      )}
    </Screen>
  );
}

function StandoutCard({ candidate: c, featured }: { candidate: RankedCandidate; featured: boolean }) {
  const p = c.profile;
  const reason = c.reasons.find((r) => !r.endsWith('km away'));
  return (
    <Link to={ROUTES.exploreProfile(p.id)} className="standout__link">
      <PhotoFrame photo={p.photos[0]} ratio={featured ? '4 / 5' : '3 / 4'} rounded="xl" monogram={p.firstName.charAt(0)} decorative>
        <div className="standout__shade" />
        <div className="standout__info">
          <h2 className="standout__name">
            {p.firstName} <span className="standout__age">{profileAge(p)}</span>
            {p.verification?.photo === 'verified' && <Icon name="verified" size={featured ? 24 : 20} filled className="standout__verified" label="Photo verified" />}
          </h2>
          <p className="standout__meta">{p.location.city}{p.hideDistance ? '' : ` · ${c.distanceKm} km`}</p>
          {reason && (
            <p className="standout__reason">
              <Icon name="sparkle" size={14} />
              <span>{reason}</span>
            </p>
          )}
        </div>
      </PhotoFrame>
    </Link>
  );
}
