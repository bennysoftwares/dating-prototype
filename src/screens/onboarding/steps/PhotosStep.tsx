import { useRef, useState } from 'react';
import { ActionList, BottomSheet, Icon, PhotoFrame, type Action } from '../../../components/ui';
import { TONES } from '../../../data/mock/tones';
import { PROFILE_LIMITS as L } from '../../../domain/profileOptions';
import type { Photo } from '../../../domain/types';
import { createId } from '../../../utils/id';
import { resizeImageFile } from '../../../utils/image';
import type { StepProps } from './types';
import './steps.css';

const TONE_LIST = Object.values(TONES);

/**
 * 3–6 photos. Tap a photo for actions (make main, move, replace, delete).
 * Explicit actions instead of drag-only reordering keep it usable one-handed
 * and with assistive tech. Images are resized locally; nothing is uploaded.
 */
export function PhotosStep({ draft, update, errors }: StepProps) {
  const photos = draft.photos;
  const inputRef = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);
  const [problem, setProblem] = useState<string | null>(null);
  const [activeIndex, setActiveIndex] = useState<number | null>(null);
  /** When set, the next picked file replaces this index instead of appending. */
  const replaceIndex = useRef<number | null>(null);

  const save = (next: Photo[]) => {
    const ok = update({ photos: next });
    setProblem(ok ? null : "There isn't enough space on this device for that photo. Try removing one or using a smaller image.");
    return ok;
  };

  const pick = (replace: number | null) => {
    replaceIndex.current = replace;
    inputRef.current?.click();
  };

  const onFiles = async (files: FileList | null) => {
    if (!files?.length) return;
    setBusy(true);
    setProblem(null);
    try {
      const replace = replaceIndex.current;
      const room = replace !== null ? 1 : L.photosMax - photos.length;
      const chosen = Array.from(files).slice(0, Math.max(0, room));
      const created: Photo[] = [];
      for (const [i, file] of chosen.entries()) {
        const url = await resizeImageFile(file);
        created.push({ id: createId('photo'), url, tone: TONE_LIST[(photos.length + i) % TONE_LIST.length]!, alt: `Photo of ${draft.firstName || 'me'}` });
      }
      if (replace !== null && created[0]) {
        save(photos.map((p, i) => (i === replace ? created[0]! : p)));
      } else {
        save([...photos, ...created]);
      }
      if (files.length > chosen.length) setProblem(`You can add up to ${L.photosMax} photos.`);
    } catch (err) {
      setProblem(err instanceof Error ? err.message : 'Something went wrong with that photo.');
    } finally {
      setBusy(false);
      replaceIndex.current = null;
      if (inputRef.current) inputRef.current.value = '';
    }
  };

  const move = (from: number, to: number) => {
    if (to < 0 || to >= photos.length) return;
    const next = [...photos];
    const [item] = next.splice(from, 1);
    next.splice(to, 0, item!);
    save(next);
    setActiveIndex(null);
  };

  const active = activeIndex !== null ? photos[activeIndex] : undefined;
  const actions: Action[] =
    activeIndex === null
      ? []
      : [
          { label: 'Make main photo', icon: 'star', onSelect: () => move(activeIndex, 0), disabled: activeIndex === 0 },
          { label: 'Move earlier', icon: 'arrowUp', onSelect: () => move(activeIndex, activeIndex - 1), disabled: activeIndex === 0 },
          { label: 'Move later', icon: 'arrowDown', onSelect: () => move(activeIndex, activeIndex + 1), disabled: activeIndex === photos.length - 1 },
          { label: 'Replace photo', icon: 'swap', onSelect: () => { setActiveIndex(null); pick(activeIndex); } },
          { label: 'Delete photo', icon: 'trash', danger: true, onSelect: () => { save(photos.filter((_, i) => i !== activeIndex)); setActiveIndex(null); } },
        ];

  const slots = Array.from({ length: L.photosMax }, (_, i) => photos[i]);
  const firstEmpty = photos.length;
  const message = problem ?? errors.photos ?? '';

  return (
    <div className="step-stack">
      <ol className="photo-grid" aria-label={`Your photos, ${photos.length} of ${L.photosMax}`}>
        {slots.map((photo, i) =>
          photo ? (
            <li key={photo.id} className="photo-grid__slot">
              <button type="button" className="photo-grid__photo" onClick={() => setActiveIndex(i)} aria-label={`Photo ${i + 1}${i === 0 ? ', main photo' : ''}. Edit`}>
                <PhotoFrame photo={photo} ratio="4 / 5" rounded="md" monogram={draft.firstName.charAt(0) || undefined} />
                {i === 0 && <span className="photo-grid__badge">Main</span>}
                <span className="photo-grid__index" aria-hidden="true">{i + 1}</span>
              </button>
            </li>
          ) : (
            <li key={`empty-${i}`} className="photo-grid__slot">
              <button
                type="button"
                className="photo-grid__empty"
                onClick={() => pick(null)}
                disabled={busy || i !== firstEmpty}
                aria-label={i === firstEmpty ? 'Add photo' : `Empty photo slot ${i + 1}`}
                tabIndex={i === firstEmpty ? 0 : -1}
              >
                {i === firstEmpty && (busy ? <span className="spinner" aria-hidden="true" /> : <Icon name="plus" size={26} />)}
                {i < L.photosMin && i !== firstEmpty && <span className="photo-grid__required" aria-hidden="true">Required</span>}
              </button>
            </li>
          ),
        )}
      </ol>
      <p className="step-counter" aria-live="polite">
        {busy ? 'Adding photo…' : `${photos.length} of ${L.photosMax} · at least ${L.photosMin} required`}
      </p>
      <p className="field__error" role={message ? 'alert' : undefined}>{message}</p>
      <ul className="step-tips" role="list">
        <li>Clear, recent photos where your face is easy to see work best.</li>
        <li>Tap a photo to make it your main one, reorder, replace or delete it.</li>
      </ul>

      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        multiple
        hidden
        aria-hidden="true"
        tabIndex={-1}
        data-testid="photo-input"
        onChange={(e) => void onFiles(e.target.files)}
      />

      <BottomSheet open={active !== undefined} onClose={() => setActiveIndex(null)} title={activeIndex === 0 ? 'Main photo' : `Photo ${(activeIndex ?? 0) + 1}`}>
        {active && (
          <div className="photo-sheet">
            <div className="photo-sheet__preview">
              <PhotoFrame photo={active} ratio="4 / 5" rounded="md" />
            </div>
            <ActionList actions={actions} />
          </div>
        )}
      </BottomSheet>
    </div>
  );
}
