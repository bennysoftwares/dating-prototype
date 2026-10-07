import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import type { User } from '../domain/types';
import { useRepositories } from '../repositories/RepositoryContext';

type SessionState =
  | { status: 'loading'; user: null; error: null }
  | { status: 'ready'; user: User; error: null }
  | { status: 'error'; user: null; error: Error };

interface SessionContextValue {
  state: SessionState;
  /** Re-read the current user, e.g. after onboarding completes. */
  refresh: () => Promise<void>;
}

const SessionContext = createContext<SessionContextValue | null>(null);

/**
 * Holds the signed-in account. Today it is always the local prototype user;
 * real authentication (Supabase Auth etc.) slots in here later.
 */
export function SessionProvider({ children }: { children: ReactNode }) {
  const repos = useRepositories();
  const { users } = repos;
  const [state, setState] = useState<SessionState>({ status: 'loading', user: null, error: null });

  const refresh = useCallback(async () => {
    try {
      const user = await users.getCurrentUser();
      setState({ status: 'ready', user, error: null });
    } catch (err) {
      setState({ status: 'error', user: null, error: err instanceof Error ? err : new Error(String(err)) });
    }
  }, [users]);

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
