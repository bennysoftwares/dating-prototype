import { createContext, useContext, useEffect, useMemo, useSyncExternalStore, type ReactNode } from 'react';
import { brand } from '../config/brand';
import { STORAGE_KEYS } from '../storage/keys';
import { useStoredState } from '../storage/useStoredState';

export type ThemePreference = 'system' | 'light' | 'dark';
export type ResolvedTheme = 'light' | 'dark';

interface ThemeContextValue {
  preference: ThemePreference;
  resolved: ResolvedTheme;
  setPreference: (p: ThemePreference) => void;
}

const ThemeContext = createContext<ThemeContextValue | null>(null);
const QUERY = '(prefers-color-scheme: dark)';

const isThemePreference = (v: unknown): v is ThemePreference => v === 'system' || v === 'light' || v === 'dark';

function useSystemTheme(): ResolvedTheme {
  return useSyncExternalStore(
    (cb) => {
      const mql = window.matchMedia(QUERY);
      mql.addEventListener('change', cb);
      return () => mql.removeEventListener('change', cb);
    },
    () => (window.matchMedia(QUERY).matches ? 'dark' : 'light'),
    () => 'light',
  );
}

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [preference, setPreference] = useStoredState<ThemePreference>(STORAGE_KEYS.theme.key, 'system', {
    version: STORAGE_KEYS.theme.version,
    validate: isThemePreference,
  });
  const system = useSystemTheme();
  const resolved: ResolvedTheme = preference === 'system' ? system : preference;

  useEffect(() => {
    document.documentElement.dataset.theme = resolved;
    document.querySelector('meta[name="theme-color"]')?.setAttribute('content', brand.themeColor[resolved]);
  }, [resolved]);

  const value = useMemo(() => ({ preference, resolved, setPreference }), [preference, resolved, setPreference]);
  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function useTheme(): ThemeContextValue {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error('useTheme must be used inside <ThemeProvider>.');
  return ctx;
}
