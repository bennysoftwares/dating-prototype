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
/** Read-through cache of raw strings so large values aren't re-read every render. */
const rawCache = new Map<string, string | null>();

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
    if (e.key === null) {
      rawCache.clear();
      emit('*');
    } else if (e.key.startsWith(PREFIX)) {
      rawCache.delete(e.key);
      emit(e.key.slice(PREFIX.length));
    }
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
      const raw = this.raw(key);
      if (raw === null) return fallback;
      const parsed = JSON.parse(raw) as Partial<Envelope<unknown>>;
      if (!parsed || typeof parsed !== 'object' || parsed.v !== version || !('data' in parsed)) return fallback;
      if (validate && !validate(parsed.data)) return fallback;
      return parsed.data as T;
    } catch {
      return fallback;
    }
  },

  /** Returns false when the write failed (usually because storage is full). */
  set<T>(key: string, data: T, version = 1): boolean {
    let ok = true;
    try {
      const envelope: Envelope<T> = { v: version, data };
      const raw = JSON.stringify(envelope);
      store.setItem(PREFIX + key, raw);
      rawCache.set(PREFIX + key, raw);
    } catch (err) {
      ok = false;
      rawCache.delete(PREFIX + key);
      console.warn(`[storage] Could not save "${key}"`, err);
    }
    emit(key);
    return ok;
  },

  remove(key: string): void {
    rawCache.delete(PREFIX + key);
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
    const full = PREFIX + key;
    if (rawCache.has(full)) return rawCache.get(full) ?? null;
    try {
      const raw = store.getItem(full);
      rawCache.set(full, raw);
      return raw;
    } catch {
      return null;
    }
  },

  /** Remove every key owned by this app. */
  clearAll(): void {
    rawCache.clear();
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
