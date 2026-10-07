import { useCallback, useMemo } from 'react';
import type { Photo } from '../domain/types';
import { storage } from '../storage/storage';
import { STORAGE_KEYS } from '../storage/keys';
import { useStoredState } from '../storage/useStoredState';
import { normalizeDraft, type DraftPatch, type ProfileDraft } from './draft';

type StoredDraft = Omit<ProfileDraft, 'photos'> & { lastStepId?: string };

const K = STORAGE_KEYS;
const isObject = (v: unknown): v is StoredDraft => typeof v === 'object' && v !== null;
const isPhotoArray = (v: unknown): v is Photo[] => Array.isArray(v);

/**
 * The in-progress onboarding draft, persisted on every change so a refresh or
 * closed tab never loses answers. Photos live under their own key so typing
 * never re-serialises image data.
 */
export function useOnboardingDraft() {
  const [stored, setStored] = useStoredState<StoredDraft | null>(K.onboardingDraft.key, null, {
    version: K.onboardingDraft.version,
    validate: isObject,
  });
  const [photos, setPhotos] = useStoredState<Photo[]>(K.onboardingPhotos.key, [], {
    version: K.onboardingPhotos.version,
    validate: isPhotoArray,
  });

  const draft = useMemo(() => normalizeDraft({ ...stored, photos }), [stored, photos]);

  const update = useCallback(
    (patch: DraftPatch): boolean => {
      const { photos: nextPhotos, ...rest } = patch;
      let ok = true;
      if (nextPhotos) ok = setPhotos(nextPhotos) && ok;
      if (Object.keys(rest).length) {
        ok = setStored((prev) => {
          const { photos: _ignored, ...base } = normalizeDraft(prev);
          return { ...base, lastStepId: prev?.lastStepId, ...rest };
        }) && ok;
      }
      return ok;
    },
    [setPhotos, setStored],
  );

  const setLastStep = useCallback(
    (lastStepId: string) => {
      setStored((prev) => {
        const { photos: _ignored, ...base } = normalizeDraft(prev);
        return { ...base, lastStepId };
      });
    },
    [setStored],
  );

  return { draft, update, hasDraft: stored !== null, lastStepId: stored?.lastStepId, setLastStep };
}

/** Remove the draft once onboarding is complete. */
export function clearOnboardingDraft() {
  storage.remove(K.onboardingDraft.key);
  storage.remove(K.onboardingPhotos.key);
}
