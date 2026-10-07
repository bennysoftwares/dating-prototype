import { brand } from '../config/brand';

/**
 * Small, safe wrapper around localStorage.
 *
 * - Every key is namespaced (`dp:<key>`) so prototype data is easy to find and wipe.
 * - Values are stored in a versioned envelope `{ v, data }`. A version mismatch or
 *   malformed JSON returns the fallback instead of crashing.
 * - Falls back to in-memory storage when localStorage is unavailable
 *   (private mode, blocked storage, SSR).
 * - Notifies subscribers so React state can stay in sync across components and tabs.
 */

interface Envelope<T> {
  v: number;
  data: T;
}

type Listener = (key: string) => void;

const PREFIX = `${brand.storageNamespace}:`;
const listeners = new Set<Listener>();
const memory = new Map<string, string>();

function backend(): Pick<Storage, 'getItem' | 'setItem' | 'removeItem' | 'key' | 'length'> {
  try {
    const probe = `${PREFIX}__probe`;
    window.localStorage.setItem(probe, '1');
    window.localStorage.removeItem(probe);
    return window.localStorage;
  } catch {
    return {
      getItem: (k) => memory.get(k) ?? null,
      setItem: (k, v) => void memory.set(k, v),
      removeItem: (k) => void memory.delete(k),
      key: (i) => Array.from(memory.keys())[i] ?? null,
      get length() {
        return memory.size;
      },
    };
  }
}

const store = backend();

function emit(key: string) {
  listeners.forEach((l) => l(key));
}

if (typeof window !== 'undefined') {
  window.addEventListener('storage', (e) => {
    if (e.key === null) emit('*');
    else if (e.key.startsWith(PREFIX)) emit(e.key.slice(PREFIX.length));
  });
}

export interface ReadOptions<T> {
  /** Schema version for this key. Stored data with another version is ignored. */
  version?: number;
  /** Optional runtime check; return false to discard stored data. */
  validate?: (value: unknown) => value is T;
}

export const storage = {
  get<T>(key: string, fallback: T, options: ReadOptions<T> = {}): T {
    const { version = 1, validate } = options;
    try {
      const raw = store.getItem(PREFIX + key);
      if (raw === null) return fallback;
      const parsed = JSON.parse(raw) as Partial<Envelope<unknown>>;
      if (!parsed || typeof parsed !== 'object' || parsed.v !== version || !('data' in parsed)) return fallback;
      if (validate && !validate(parsed.data)) return fallback;
      return parsed.data as T;
    } catch {
      return fallback;
    }
  },

  set<T>(key: string, data: T, version = 1): void {
    try {
      const envelope: Envelope<T> = { v: version, data };
      store.setItem(PREFIX + key, JSON.stringify(envelope));
    } catch (err) {
      console.warn(`[storage] Could not save "${key}"`, err);
    }
    emit(key);
  },

  remove(key: string): void {
    try {
      store.removeItem(PREFIX + key);
    } catch {
      /* ignore */
    }
    emit(key);
  },

  /** Keys owned by this app, without the namespace prefix. */
  keys(): string[] {
    const out: string[] = [];
    try {
      for (let i = 0; i < store.length; i += 1) {
        const k = store.key(i);
        if (k?.startsWith(PREFIX)) out.push(k.slice(PREFIX.length));
      }
    } catch {
      /* ignore */
    }
    return out.sort();
  },

  /** Raw stored string, for the debug panel. */
  raw(key: string): string | null {
    try {
      return store.getItem(PREFIX + key);
    } catch {
      return null;
    }
  },

  /** Remove every key owned by this app. */
  clearAll(): void {
    this.keys().forEach((k) => {
      try {
        store.removeItem(PREFIX + k);
      } catch {
        /* ignore */
      }
    });
    emit('*');
  },

  subscribe(listener: Listener): () => void {
    listeners.add(listener);
    return () => listeners.delete(listener);
  },
};
