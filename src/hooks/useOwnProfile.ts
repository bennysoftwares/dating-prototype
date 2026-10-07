import { useRepositories } from '../repositories/RepositoryContext';
import { useAsync } from './useAsync';

/** The signed-in user's profile and preferences. */
export function useOwnProfile() {
  const { users, profiles } = useRepositories();
  return useAsync(async () => {
    const [profile, preferences] = await Promise.all([profiles.getCurrentProfile(), users.getPreferences()]);
    return { profile, preferences };
  }, [users, profiles]);
}
