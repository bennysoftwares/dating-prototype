import { useCallback, useRef, useSyncExternalStore } from 'react';
import { storage, type ReadOptions } from './storage';

/**
 * React state persisted to localStorage. Survives reloads and stays in sync
 * across every component (and browser tab) using the same key.
 * The setter returns false if the value could not be saved (e.g. storage full).
 */
export function useStoredState<T>(
  key: string,
  fallback: T,
  options: ReadOptions<T> = {},
): [T, (next: T | ((prev: T) => T)) => boolean] {
  const { version = 1 } = options;
  // Keep the latest options/fallback without re-subscribing every render.
  const ref = useRef({ fallback, options });
  ref.current = { fallback, options };

  // Cache by raw string so getSnapshot returns a stable reference.
  const cache = useRef<{ raw: string | null; value: T } | null>(null);

  const getSnapshot = useCallback((): T => {
    const raw = storage.raw(key);
    if (cache.current && cache.current.raw === raw) return cache.current.value;
    const value = storage.get(key, ref.current.fallback, ref.current.options);
    cache.current = { raw, value };
    return value;
  }, [key]);

  const subscribe = useCallback(
    (onChange: () => void) => storage.subscribe((changed) => (changed === key || changed === '*') && onChange()),
    [key],
  );

  const value = useSyncExternalStore(subscribe, getSnapshot, getSnapshot);

  const setValue = useCallback(
    (next: T | ((prev: T) => T)) => {
      const prev = getSnapshot();
      const resolved = typeof next === 'function' ? (next as (p: T) => T)(prev) : next;
      return storage.set(key, resolved, version);
    },
    [key, version, getSnapshot],
  );

  return [value, setValue];
}
