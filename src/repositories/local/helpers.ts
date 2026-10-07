import type { User } from '../../domain/types';
import { StorageFullError } from '../types';
import { localDb } from './localDb';

export function currentUser(): User {
  const user = localDb.user();
  if (!user) throw new Error('No current user found in local data.');
  return user;
}

export function ensure(ok: boolean): void {
  if (!ok) throw new StorageFullError();
}
