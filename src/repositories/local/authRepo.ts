import type { AuthAccount } from '../../domain/types';
import { storage } from '../../storage/storage';
import { STORAGE_KEYS as K } from '../../storage/keys';
import { createId } from '../../utils/id';
import type { AuthRepository, AuthState, Consent } from '../types';
import { isAuthAccount } from './guards';
import { localDb, withLatency } from './localDb';

/** `withLatency` for work that is itself async (password hashing). */
const withLatencyAsync = <T,>(fn: () => Promise<T>): Promise<T> => withLatency(() => undefined).then(fn);

/**
 * Prototype accounts: one account per device, kept in localStorage.
 * Nothing leaves the device. Emails are never sent; the verification code is shown on
 * screen instead. A real provider (Supabase Auth, Firebase Auth…) replaces this file.
 */

interface Session {
  accountId: string;
  signedInAt: string;
}
interface Pending {
  code: string;
  email: string;
  sentAt: string;
}

/** How long a verification code stays valid. */
const CODE_TTL_MS = 15 * 60 * 1000;
export const PASSWORD_MIN = 8;

export const normalizeEmail = (email: string) => email.trim().toLowerCase();
export const isValidEmail = (email: string) => /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email.trim());

export function readAccount(): AuthAccount | null {
  return storage.get<AuthAccount | null>(K.authAccount.key, null, { validate: (v): v is AuthAccount => v === null || isAuthAccount(v) });
}
function readSession(): Session | null {
  return storage.get<Session | null>(K.authSession.key, null, {
    validate: (v): v is Session | null => v === null || (typeof v === 'object' && typeof (v as Session).accountId === 'string'),
  });
}
const writeAccount = (a: AuthAccount | null) => storage.set(K.authAccount.key, a, K.authAccount.version);
const writeSession = (s: Session | null) => storage.set(K.authSession.key, s, K.authSession.version);
const signIn = (a: AuthAccount) => writeSession({ accountId: a.id, signedInAt: new Date().toISOString() });

/** Create the account for this device's user and sign it in. */
export function createLocalAccount(fields: Omit<AuthAccount, 'id' | 'userId' | 'createdAt'>): AuthAccount {
  const user = localDb.user();
  if (!user) throw new Error('Something went wrong setting up this device. Try again.');
  const account: AuthAccount = { id: createId('acct'), userId: user.id, createdAt: new Date().toISOString(), ...fields };
  writeAccount(account);
  signIn(account);
  return account;
}

/** Developer panel: make sure this device is signed in (creating a device account if needed). */
export function ensureDeviceSession(): AuthAccount {
  const existing = readAccount();
  if (existing) {
    if (existing.method === 'email' && !existing.emailVerified) writeAccount({ ...existing, emailVerified: true });
    signIn(existing);
    return existing;
  }
  return createLocalAccount({ method: 'device', emailVerified: true, termsAcceptedAt: new Date().toISOString() });
}

export function signOutLocal(): void {
  writeSession(null);
}

/** Remove sign-in data (used by reset / delete account). */
export function clearAuth(): void {
  storage.remove(K.authAccount.key);
  storage.remove(K.authSession.key);
  storage.remove(K.authPending.key);
}

/** Salted SHA-256. Falls back to a simple hash where WebCrypto isn't available (plain http on a LAN). */
async function hashPassword(password: string, salt: string): Promise<string> {
  const input = `${salt}:${password}`;
  if (globalThis.crypto?.subtle) {
    const digest = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(input));
    return [...new Uint8Array(digest)].map((b) => b.toString(16).padStart(2, '0')).join('');
  }
  let h = 0x811c9dc5;
  for (let round = 0; round < 1000; round += 1) for (let i = 0; i < input.length; i += 1) h = Math.imul(h ^ input.charCodeAt(i) ^ round, 0x01000193);
  return `fnv-${(h >>> 0).toString(16)}`;
}

function randomDigits(n: number): string {
  const bytes = new Uint8Array(n);
  if (typeof globalThis.crypto?.getRandomValues === 'function') crypto.getRandomValues(bytes);
  else bytes.forEach((_, i) => (bytes[i] = Math.floor(Math.random() * 256)));
  return [...bytes].map((b) => String(b % 10)).join('');
}

function requireConsent(consent: Consent) {
  if (!consent.accepted) throw new Error('Please confirm you’re 18 or older and accept the Terms and Privacy Policy.');
}

/** A new account on a device that already has one starts from a clean slate. */
function replaceExisting() {
  if (readAccount()) {
    clearAuth();
    localDb.reset();
  }
}

export function createLocalAuthRepository(): AuthRepository {
  const state = (): AuthState => {
    const account = readAccount();
    const session = readSession();
    return { account, signedIn: Boolean(account && session?.accountId === account.id) };
  };

  return {
    getState: () => withLatency(state),

    signUpWithEmail: ({ email, password, consent }) =>
      withLatencyAsync(async () => {
        requireConsent(consent);
        if (!isValidEmail(email)) throw new Error('Enter a valid email address.');
        if (password.length < PASSWORD_MIN) throw new Error(`Use at least ${PASSWORD_MIN} characters for your password.`);
        const normalized = normalizeEmail(email);
        const existing = readAccount();
        if (existing?.method === 'email' && existing.email === normalized) throw new Error('There’s already an account with this email. Sign in instead.');
        replaceExisting();
        const salt = randomDigits(16);
        return createLocalAccount({
          method: 'email',
          email: normalized,
          emailVerified: false,
          termsAcceptedAt: new Date().toISOString(),
          passwordSalt: salt,
          passwordHash: await hashPassword(password, salt),
        });
      }),

    continueWithProvider: (provider, consent) =>
      withLatency(() => {
        const existing = readAccount();
        if (existing?.method === provider) {
          signIn(existing);
          return existing;
        }
        requireConsent(consent);
        replaceExisting();
        return createLocalAccount({ method: provider, emailVerified: true, termsAcceptedAt: new Date().toISOString() });
      }),

    sendVerificationCode: () =>
      withLatency(() => {
        const account = readAccount();
        if (!account?.email) throw new Error('There’s no email to verify.');
        const code = randomDigits(6);
        storage.set<Pending>(K.authPending.key, { code, email: account.email, sentAt: new Date().toISOString() }, K.authPending.version);
        return { sentTo: account.email, demoCode: code };
      }),

    verifyEmail: (code) =>
      withLatency(() => {
        const account = readAccount();
        const pending = storage.get<Pending | null>(K.authPending.key, null);
        if (!account || !pending || pending.email !== account.email) throw new Error('That code has expired. Send a new one.');
        if (Date.now() - new Date(pending.sentAt).getTime() > CODE_TTL_MS) throw new Error('That code has expired. Send a new one.');
        if (code.replace(/\D/g, '') !== pending.code) throw new Error('That code isn’t right. Check it and try again.');
        const verified = { ...account, emailVerified: true };
        writeAccount(verified);
        storage.remove(K.authPending.key);
        return verified;
      }),

    signInWithEmail: (email, password) =>
      withLatencyAsync(async () => {
        const account = readAccount();
        const mismatch = new Error('That email and password don’t match an account on this device.');
        if (!account || account.method !== 'email' || account.email !== normalizeEmail(email) || !account.passwordSalt) throw mismatch;
        if ((await hashPassword(password, account.passwordSalt)) !== account.passwordHash) throw mismatch;
        signIn(account);
        return account;
      }),

    requestPasswordReset: () => withLatency(() => undefined),

    resumeOnDevice: () =>
      withLatency(() => {
        const account = readAccount();
        if (!account || (account.method !== 'demo' && account.method !== 'device')) throw new Error('Sign in with your email or the service you signed up with.');
        signIn(account);
        return account;
      }),

    signOut: () =>
      withLatency(() => {
        writeSession(null);
      }),
  };
}
