import { createSeed } from '../../data/mock';
import type { Match, Message, Preferences, Profile, User } from '../../domain/types';
import { storage } from '../../storage/storage';
import { STORAGE_KEYS } from '../../storage/keys';
import { sleep } from '../../utils/sleep';

/**
 * Bump when the seed or stored shapes change. Old data is discarded and
 * re-seeded instead of crashing the app.
 */
export const DB_SCHEMA_VERSION = 1;

interface DbMeta {
  schemaVersion: number;
  seededAt: string;
}

const isArray = (v: unknown): v is unknown[] => Array.isArray(v);
const isObject = (v: unknown): v is object => typeof v === 'object' && v !== null;

export const localDb = {
  ensureSeeded(): void {
    const meta = storage.get<DbMeta | null>(STORAGE_KEYS.dbMeta.key, null);
    if (meta?.schemaVersion === DB_SCHEMA_VERSION) return;
    this.reset();
  },

  reset(): void {
    const seed = createSeed();
    storage.set(STORAGE_KEYS.dbUser.key, seed.user, STORAGE_KEYS.dbUser.version);
    storage.set(STORAGE_KEYS.dbPreferences.key, seed.preferences, STORAGE_KEYS.dbPreferences.version);
    storage.set(STORAGE_KEYS.dbProfiles.key, seed.profiles, STORAGE_KEYS.dbProfiles.version);
    storage.set(STORAGE_KEYS.dbMatches.key, seed.matches, STORAGE_KEYS.dbMatches.version);
    storage.set(STORAGE_KEYS.dbMessages.key, seed.messages, STORAGE_KEYS.dbMessages.version);
    storage.set<DbMeta>(STORAGE_KEYS.dbMeta.key, { schemaVersion: DB_SCHEMA_VERSION, seededAt: new Date().toISOString() });
  },

  meta(): DbMeta | null {
    return storage.get<DbMeta | null>(STORAGE_KEYS.dbMeta.key, null);
  },

  user(): User | null {
    return storage.get<User | null>(STORAGE_KEYS.dbUser.key, null, { validate: (v): v is User => isObject(v) });
  },
  preferences(): Preferences | null {
    return storage.get<Preferences | null>(STORAGE_KEYS.dbPreferences.key, null, { validate: (v): v is Preferences => isObject(v) });
  },
  profiles(): Profile[] {
    return storage.get<Profile[]>(STORAGE_KEYS.dbProfiles.key, [], { validate: (v): v is Profile[] => isArray(v) });
  },
  matches(): Match[] {
    return storage.get<Match[]>(STORAGE_KEYS.dbMatches.key, [], { validate: (v): v is Match[] => isArray(v) });
  },
  messages(): Message[] {
    return storage.get<Message[]>(STORAGE_KEYS.dbMessages.key, [], { validate: (v): v is Message[] => isArray(v) });
  },
};

/** Simulated network latency so loading states are exercised during development. */
export const SIMULATED_LATENCY_MS = 180;

export async function withLatency<T>(fn: () => T): Promise<T> {
  await sleep(SIMULATED_LATENCY_MS);
  return fn();
}
