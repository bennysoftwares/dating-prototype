import { useCallback } from 'react';
import type { ID } from '../domain/types';
import { STORAGE_KEYS } from '../storage/keys';
import { useStoredState } from '../storage/useStoredState';

type Drafts = Record<ID, string>;
const isDrafts = (v: unknown): v is Drafts => typeof v === 'object' && v !== null && !Array.isArray(v);

/** Unsent messages, per conversation. Saved on every keystroke; survive navigation and reloads. */
export function useDrafts() {
  const [drafts, setDrafts] = useStoredState<Drafts>(STORAGE_KEYS.drafts.key, {}, { version: STORAGE_KEYS.drafts.version, validate: isDrafts });
  const setDraft = useCallback(
    (matchId: ID, text: string) =>
      setDrafts((prev) => {
        const next = { ...prev };
        if (text) next[matchId] = text;
        else delete next[matchId];
        return next;
      }),
    [setDrafts],
  );
  return { drafts, setDraft };
}
