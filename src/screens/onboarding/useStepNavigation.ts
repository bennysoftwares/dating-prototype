import { useCallback, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router';

/**
 * Back that behaves like the browser's back button when there is in-app history,
 * and falls back to an explicit route (e.g. after a refresh on step 7).
 */
export function useBack() {
  const navigate = useNavigate();
  return useCallback(
    (fallback: string) => {
      const idx = (window.history.state as { idx?: number } | null)?.idx ?? 0;
      if (idx > 0) navigate(-1);
      else navigate(fallback, { replace: true });
    },
    [navigate],
  );
}

/** Remembers the previous index so step transitions animate in the right direction. */
export function useDirection(index: number): 'forward' | 'back' {
  const prev = useRef(index);
  // Update after commit so StrictMode's double render sees the same previous value.
  useEffect(() => {
    prev.current = index;
  }, [index]);
  return index >= prev.current ? 'forward' : 'back';
}
