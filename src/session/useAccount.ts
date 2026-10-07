import { useCallback } from 'react';
import type { VerificationState } from '../domain/types';
import { useRepositories } from '../repositories/RepositoryContext';
import { useSession } from './SessionProvider';

/** Account-state actions (pause, incognito, verification). Refreshes the session afterwards. */
export function useAccount() {
  const { account } = useRepositories();
  const { state, refresh } = useSession();
  const user = state.status === 'ready' ? state.user : null;

  const setPaused = useCallback(async (paused: boolean) => {
    await account.setPaused(paused);
    await refresh();
  }, [account, refresh]);

  const setIncognito = useCallback(async (on: boolean) => {
    await account.setIncognito(on);
    await refresh();
  }, [account, refresh]);

  const setVerification = useCallback((kind: 'photo' | 'id', s: VerificationState) => account.setVerification(kind, s), [account]);

  return { user, paused: user?.status === 'paused', incognito: Boolean(user?.incognito), setPaused, setIncognito, setVerification };
}
