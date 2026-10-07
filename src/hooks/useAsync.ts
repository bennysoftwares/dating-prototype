import { useCallback, useEffect, useState, type DependencyList } from 'react';

export type AsyncState<T> =
  | { status: 'loading'; data?: undefined; error?: undefined }
  | { status: 'success'; data: T; error?: undefined }
  | { status: 'error'; data?: undefined; error: Error };

/** Run an async loader and expose loading / success / error state plus a retry. */
export function useAsync<T>(loader: () => Promise<T>, deps: DependencyList): AsyncState<T> & { retry: () => void } {
  const [state, setState] = useState<AsyncState<T>>({ status: 'loading' });
  const [attempt, setAttempt] = useState(0);

  useEffect(() => {
    let cancelled = false;
    setState({ status: 'loading' });
    loader().then(
      (data) => !cancelled && setState({ status: 'success', data }),
      (err: unknown) => !cancelled && setState({ status: 'error', error: err instanceof Error ? err : new Error(String(err)) }),
    );
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [...deps, attempt]);

  const retry = useCallback(() => setAttempt((n) => n + 1), []);
  return { ...state, retry };
}
