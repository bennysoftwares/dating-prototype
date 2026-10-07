import { useRef } from 'react';
import { useNavigate } from 'react-router';
import { ROUTES } from '../../app/navigation';
import { Screen, Section } from '../../components/layout';
import { ProfileHeroCard } from '../../components/profile/ProfileHeroCard';
import { PromptCard } from '../../components/profile/PromptCard';
import { Chip, ChipList, ErrorState, ListGroup, ListRow, LoadingRegion, SegmentedControl, Skeleton } from '../../components/ui';
import { brand } from '../../config/brand';
import { getInterest } from '../../domain/interest';
import { useAsync } from '../../hooks/useAsync';
import { useRepositories } from '../../repositories/RepositoryContext';
import { useTheme, type ThemePreference } from '../../theme/ThemeProvider';
import { formatHeight } from '../../utils/profileFormat';
import './ProfileScreen.css';

const THEME_OPTIONS: { value: ThemePreference; label: string; icon: 'device' | 'sun' | 'moon' }[] = [
  { value: 'system', label: 'System', icon: 'device' },
  { value: 'light', label: 'Light', icon: 'sun' },
  { value: 'dark', label: 'Dark', icon: 'moon' },
];

/** Tap the version line this many times to open the hidden developer panel. */
const DEBUG_TAPS = 5;

export function ProfileScreen() {
  const { users, profiles } = useRepositories();
  const { preference, setPreference } = useTheme();
  const navigate = useNavigate();
  const taps = useRef({ count: 0, last: 0 });

  const state = useAsync(async () => {
    const user = await users.getCurrentUser();
    return profiles.getProfile(user.profileId);
  }, [users, profiles]);

  const onVersionTap = () => {
    const now = Date.now();
    taps.current.count = now - taps.current.last < 600 ? taps.current.count + 1 : 1;
    taps.current.last = now;
    if (taps.current.count >= DEBUG_TAPS) {
      taps.current.count = 0;
      navigate(ROUTES.debug);
    }
  };

  return (
    <Screen title="Profile">
      {state.status === 'loading' && (
        <LoadingRegion label="Loading your profile">
          <Skeleton ratio="4 / 5" className="profile__hero-skeleton" />
        </LoadingRegion>
      )}
      {state.status === 'error' && <ErrorState onRetry={state.retry} />}
      {state.status === 'success' && !state.data && <ErrorState message="We couldn't find your profile." onRetry={state.retry} />}

      {state.status === 'success' && state.data && (() => {
        const p = state.data;
        return (
          <>
            <ProfileHeroCard profile={p} as="div" />

            <Section title="About">
              <ListGroup label="About you">
                {p.job && <ListRow icon="briefcase" title={p.job} subtitle="Work" />}
                {p.education && <ListRow icon="sparkle" title={p.education} subtitle="Education" />}
                {p.heightCm && <ListRow icon="ruler" title={formatHeight(p.heightCm)} subtitle="Height" />}
                <ListRow icon="globe" title={p.languages.join(', ')} subtitle="Languages" />
              </ListGroup>
            </Section>

            <Section title="Interests">
              <ChipList label="Interests">
                {p.interests.map((id) => (
                  <li key={id}><Chip>{getInterest(id).label}</Chip></li>
                ))}
              </ChipList>
            </Section>

            <Section title="Prompts">
              {p.prompts.map((q) => <PromptCard key={q.id} prompt={q} />)}
            </Section>
          </>
        );
      })()}

      <Section title="Appearance">
        <SegmentedControl legend="Theme" value={preference} options={THEME_OPTIONS} onChange={setPreference} />
      </Section>

      <footer className="profile__footer">
        <button type="button" className="profile__version" onClick={onVersionTap}>
          {brand.name} · v{brand.version}
        </button>
      </footer>
    </Screen>
  );
}
