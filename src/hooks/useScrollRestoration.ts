import { useLayoutEffect, useRef } from 'react';

const positions = new Map<string, number>();

/**
 * Remembers the window scroll position for `key` when the screen unmounts and
 * restores it when the screen returns and its content is `ready`. Used so opening
 * a profile from Discover and coming back never throws you to the top.
 */
export function useScrollRestoration(key: string, ready: boolean) {
  const restored = useRef(false);

  useLayoutEffect(() => {
    if (!ready || restored.current) return;
    restored.current = true;
    const y = positions.get(key);
    if (y !== undefined) window.scrollTo({ top: y, behavior: 'instant' as ScrollBehavior });
  }, [key, ready]);

  // Layout effect so the listener detaches synchronously on unmount, before the next
  // screen's DOM can trigger a scroll event that would overwrite the saved position.
  useLayoutEffect(() => {
    const save = () => positions.set(key, window.scrollY);
    window.addEventListener('scroll', save, { passive: true });
    return () => {
      window.removeEventListener('scroll', save);
    };
  }, [key]);
}
