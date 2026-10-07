import { Screen, Section } from '../../components/layout';
import { ProfileHeroCard } from '../../components/profile/ProfileHeroCard';
import { PromptCard } from '../../components/profile/PromptCard';
import { Avatar, EmptyState, ErrorState, LoadingRegion, Skeleton } from '../../components/ui';
import { useAsync } from '../../hooks/useAsync';
import { useRepositories } from '../../repositories/RepositoryContext';
import { approxDistanceKm } from '../../utils/profileFormat';
import './DiscoverScreen.css';

/**
 * Placeholder for Today's Picks. Shows the visual direction (large lead photo,
 * intention up front, a prompt) using mock data. Ranking and interactions come in Part 3.
 */
export function DiscoverScreen() {
  const { users, profiles } = useRepositories();
  const state = useAsync(async () => {
    const user = await users.getCurrentUser();
    const [me, candidates] = await Promise.all([profiles.getProfile(user.profileId), profiles.listCandidates()]);
    return { me, candidates };
  }, [users, profiles]);

  const today = new Date().toLocaleDateString(undefined, { weekday: 'long', day: 'numeric', month: 'long' });

  return (
    <Screen title="Today's picks" eyebrow={today}>
      {state.status === 'loading' && (
        <LoadingRegion label="Loading today's picks">
          <div className="discover__loading">
            <Skeleton ratio="4 / 5" className="discover__hero-skeleton" />
            <Skeleton height={120} />
          </div>
        </LoadingRegion>
      )}

      {state.status === 'error' && <ErrorState onRetry={state.retry} />}

      {state.status === 'success' && state.data.candidates.length === 0 && (
        <EmptyState icon="sparkle" title="That's everyone for today">
          We'll have new people for you soon.
        </EmptyState>
      )}

      {state.status === 'success' && state.data.candidates.length > 0 && (() => {
        const { me, candidates } = state.data;
        const [first, ...rest] = candidates;
        if (!first) return null;
        const distance = me ? `${approxDistanceKm(me.location, first.location)} km away` : undefined;
        return (
          <>
            <p className="discover__intro">
              {candidates.length} people selected around what you're looking for. Take your time with each one.
            </p>
            <div className="discover__lead">
              <ProfileHeroCard profile={first} distanceLabel={distance} />
              {first.prompts[0] && <PromptCard prompt={first.prompts[0]} />}
            </div>
            {rest.length > 0 && (
              <Section title="Also in today's picks">
                <ul className="discover__strip" role="list">
                  {rest.map((p) => (
                    <li key={p.id} className="discover__strip-item">
                      <Avatar photo={p.photos[0]} name={p.firstName} size={64} />
                      <span>{p.firstName}</span>
                    </li>
                  ))}
                </ul>
              </Section>
            )}
          </>
        );
      })()}
    </Screen>
  );
}
