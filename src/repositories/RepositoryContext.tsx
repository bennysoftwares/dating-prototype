import { createContext, useContext, useMemo, type ReactNode } from 'react';
import { createLocalRepositories } from './local';
import type { Repositories } from './types';

const RepositoryContext = createContext<Repositories | null>(null);

export function RepositoryProvider({ children, repositories }: { children: ReactNode; repositories?: Repositories }) {
  const value = useMemo(() => repositories ?? createLocalRepositories(), [repositories]);
  return <RepositoryContext.Provider value={value}>{children}</RepositoryContext.Provider>;
}

export function useRepositories(): Repositories {
  const ctx = useContext(RepositoryContext);
  if (!ctx) throw new Error('useRepositories must be used inside <RepositoryProvider>.');
  return ctx;
}
