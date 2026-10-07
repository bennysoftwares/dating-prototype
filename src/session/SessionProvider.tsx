import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import type { User } from '../domain/types';
import { useRepositories } from '../repositories/RepositoryContext';
import type { AuthState } from '../repositories/types';

type SessionState =
  | { status: 'loading'; user: null; auth: null; error: null }
  | { status: 'ready'; user: User; auth: AuthState; error: null }
  | { status: 'error'; user: null; auth: null; error: Error };

interface SessionContextValue {
  state: SessionState;
  /** Re-read the current user, e.g. after onboarding completes. */
  refresh: () => Promise<void>;
}

const SessionContext = createContext<SessionContextValue | null>(null);

/**
 * Holds the person using the app and whether they're signed in. Both come from
 * repositories, so real authentication (Supabase Auth etc.) slots in without screen changes.
 */
export function SessionProvider({ children }: { children: ReactNode }) {
  const repos = useRepositories();
  const { users, auth } = repos;
  const [state, setState] = useState<SessionState>({ status: 'loading', user: null, auth: null, error: null });

  const refresh = useCallback(async () => {
    try {
      const [user, authState] = await Promise.all([users.getCurrentUser(), auth.getState()]);
      setState({ status: 'ready', user, auth: authState, error: null });
    } catch (err) {
      setState({ status: 'error', user: null, auth: null, error: err instanceof Error ? err : new Error(String(err)) });
    }
  }, [users, auth]);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  // Account changes from elsewhere (another tab, the debug panel) apply without a reload.
  useEffect(() => repos.matches.subscribe(() => void refresh()), [repos, refresh]);

  const value = useMemo(() => ({ state, refresh }), [state, refresh]);
  return <SessionContext.Provider value={value}>{children}</SessionContext.Provider>;
}

export function useSession(): SessionContextValue {
  const ctx = useContext(SessionContext);
  if (!ctx) throw new Error('useSession must be used inside <SessionProvider>.');
  return ctx;
}
