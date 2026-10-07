import { useCallback, useEffect, useRef, useState, type CSSProperties, type KeyboardEvent, type PointerEvent } from 'react';
import type { SwipeDirection } from '../../discovery/DiscoveryProvider';
import type { RankedCandidate } from '../../recommendation';
import { ActionButtons } from './ActionButtons';
import { ProfileCard } from './ProfileCard';
import './SwipeDeck.css';

interface SwipeDeckProps {
  /** The queue, in order. Only the first two are rendered; the rest are preloaded. */
  items: RankedCandidate[];
  /**
   * Called the moment a decision is made (swipe past the threshold, a flick, X, heart or
   * arrow keys). The deck animates the card away on its own, so the next one is usable at once.
   */
  onDecide: (candidate: RankedCandidate, direction: SwipeDirection) => void;
  onOpen: (candidate: RankedCandidate) => void;
  /** A person just brought back by rewind: they slide back in from the side they left. */
  returning?: { profileId: string; from: SwipeDirection } | null;
  label: string;
}

interface Flying {
  key: number;
  candidate: RankedCandidate;
  direction: SwipeDirection;
  photoIndex: number;
  from: { x: number; y: number; r: number };
}

interface Drag {
  pointerId: number;
  startX: number;
  startY: number;
  startT: number;
  dx: number;
  dy: number;
  /** Last two samples, for release velocity. */
  lastX: number;
  lastT: number;
  vx: number;
  dragging: boolean;
}

/** Below this much movement a press is a tap (change photo), not a drag. */
const TAP_SLOP = 8;
/** px/ms. A quick flick decides even before the distance threshold. */
const FLICK_VELOCITY = 0.55;
const ROTATION_PER_PX = 0.055;

const reducedMotion = () => typeof window !== 'undefined' && window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;

/**
 * Explore's swipe deck. Drag right to like, left to pass; the X and heart buttons and the
 * arrow keys go through exactly the same `commit` path, so every input records the same decision.
 */
export function SwipeDeck({ items, onDecide, onOpen, returning, label }: SwipeDeckProps) {
  const [top, next] = items;
  const cardRef = useRef<HTMLDivElement>(null);
  const deckRef = useRef<HTMLDivElement>(null);
  const drag = useRef<Drag | null>(null);
  const [flying, setFlying] = useState<Flying[]>([]);
  const flyKey = useRef(0);
  const [photo, setPhoto] = useState<{ id: string; index: number }>({ id: '', index: 0 });
  const photoIndex = top && photo.id === top.profile.id ? photo.index : 0;

  usePreload(items);

  const setSwipe = (dx: number, dy: number, animate: boolean) => {
    const el = cardRef.current;
    const deck = deckRef.current;
    if (!el) return;
    const width = el.offsetWidth || 1;
    const progress = Math.max(-1, Math.min(1, dx / threshold(width)));
    el.style.transition = animate ? 'transform 300ms cubic-bezier(0.2, 0.9, 0.3, 1.15)' : 'none';
    el.style.transform = dx || dy ? `translate3d(${dx}px, ${dy}px, 0) rotate(${dx * ROTATION_PER_PX}deg)` : '';
    el.style.setProperty('--swipe', String(progress));
    deck?.style.setProperty('--progress', String(Math.abs(progress)));
  };

  const changePhoto = useCallback(
    (step: -1 | 1) => {
      if (!top) return;
      const count = top.profile.photos.length;
      setPhoto({ id: top.profile.id, index: Math.max(0, Math.min(count - 1, photoIndex + step)) });
    },
    [top, photoIndex],
  );

  /** The single decision path for gestures, buttons and keys. */
  const commit = useCallback(
    (direction: SwipeDirection) => {
      if (!top) return;
      const d = drag.current;
      const from = d ? { x: d.dx, y: d.dy, r: d.dx * ROTATION_PER_PX } : { x: 0, y: 0, r: 0 };
      drag.current = null;
      if (!reducedMotion()) setFlying((f) => [...f, { key: ++flyKey.current, candidate: top, direction, photoIndex, from }]);
      // The next card takes the top slot straight away; reset its position.
      setSwipe(0, 0, false);
      onDecide(top, direction);
    },
    [top, photoIndex, onDecide],
  );

  const onPointerDown = (e: PointerEvent<HTMLDivElement>) => {
    if (!top || e.button !== 0) return;
    // Buttons inside the card (open profile, X, heart) keep their own clicks.
    if ((e.target as HTMLElement).closest('button, a')) return;
    drag.current = { pointerId: e.pointerId, startX: e.clientX, startY: e.clientY, startT: e.timeStamp, dx: 0, dy: 0, lastX: e.clientX, lastT: e.timeStamp, vx: 0, dragging: false };
  };

  const onPointerMove = (e: PointerEvent<HTMLDivElement>) => {
    const d = drag.current;
    if (!d || d.pointerId !== e.pointerId) return;
    d.dx = e.clientX - d.startX;
    d.dy = e.clientY - d.startY;
    const dt = e.timeStamp - d.lastT;
    if (dt > 0) d.vx = 0.6 * ((e.clientX - d.lastX) / dt) + 0.4 * d.vx;
    d.lastX = e.clientX;
    d.lastT = e.timeStamp;
    if (!d.dragging && Math.hypot(d.dx, d.dy) > TAP_SLOP) {
      d.dragging = true;
      cardRef.current?.setPointerCapture(e.pointerId);
    }
    if (d.dragging) setSwipe(d.dx, d.dy * 0.35, false);
  };

  const onPointerUp = (e: PointerEvent<HTMLDivElement>) => {
    const d = drag.current;
    if (!d || d.pointerId !== e.pointerId) return;
    const el = cardRef.current;
    if (!d.dragging) {
      drag.current = null;
      // A tap: left half goes back a photo, right half forward. Taps on the info area open the profile.
      if (!el || !top) return;
      const rect = el.getBoundingClientRect();
      const info = el.querySelector('.pcard__info')?.getBoundingClientRect();
      if (info && e.clientY >= info.top) return onOpen(top);
      changePhoto(e.clientX - rect.left < rect.width / 2 ? -1 : 1);
      return;
    }
    const width = el?.offsetWidth ?? 1;
    const flick = Math.abs(d.vx) > FLICK_VELOCITY && Math.abs(d.dx) > 40 && Math.sign(d.vx) === Math.sign(d.dx);
    if (Math.abs(d.dx) > threshold(width) || flick) {
      d.dy *= 0.35;
      commit(d.dx > 0 ? 'right' : 'left');
    } else {
      drag.current = null;
      setSwipe(0, 0, true);
    }
  };

  const onPointerCancel = () => {
    drag.current = null;
    setSwipe(0, 0, true);
  };

  const onKeyDown = (e: KeyboardEvent<HTMLDivElement>) => {
    if (e.target !== e.currentTarget) return;
    if (e.key === 'ArrowLeft') commit('left');
    else if (e.key === 'ArrowRight') commit('right');
    else if (e.key === 'Enter' && top) onOpen(top);
    else return;
    e.preventDefault();
  };

  // Each new top card starts centred, at its first photo.
  useEffect(() => {
    setSwipe(0, 0, false);
  }, [top?.profile.id]);

  const land = (key: number) => setFlying((f) => f.filter((x) => x.key !== key));

  const returningNow = returning && top && returning.profileId === top.profile.id ? returning.from : null;

  return (
    <div
      ref={deckRef}
      className="deck"
      role="group"
      aria-roledescription="swipe deck"
      aria-label={label}
      tabIndex={0}
      onKeyDown={onKeyDown}
    >
      <p className="visually-hidden">Swipe right or press the right arrow key to like. Swipe left or press the left arrow key to pass.</p>
      <div className="deck__stack">
        {next && (
          <div key={next.profile.id} className="deck__card deck__card--next" aria-hidden="true">
            <ProfileCard candidate={next} />
          </div>
        )}
        {top && (
          <div
            key={top.profile.id}
            ref={cardRef}
            className={returningNow ? `deck__card deck__card--top deck__card--return-${returningNow}` : 'deck__card deck__card--top'}
            onPointerDown={onPointerDown}
            onPointerMove={onPointerMove}
            onPointerUp={onPointerUp}
            onPointerCancel={onPointerCancel}
            onLostPointerCapture={() => drag.current?.dragging && onPointerCancel()}
            aria-label={`${top.profile.firstName}`}
            data-profile-id={top.profile.id}
          >
            <ProfileCard candidate={top} photoIndex={photoIndex} onOpen={() => onOpen(top)} onPhoto={changePhoto} />
            <ActionButtons name={top.profile.firstName} onPass={() => commit('left')} onLike={() => commit('right')} />
          </div>
        )}
        {flying.map((f) => (
          <div
            key={`fly-${f.key}`}
            className={`deck__card deck__card--flying deck__card--fly-${f.direction}`}
            style={{ '--from-x': `${f.from.x}px`, '--from-y': `${f.from.y}px`, '--from-r': `${f.from.r}deg` } as CSSProperties}
            onAnimationEnd={() => land(f.key)}
            aria-hidden="true"
          >
            <ProfileCard candidate={f.candidate} photoIndex={f.photoIndex} />
          </div>
        ))}
      </div>
    </div>
  );
}

function threshold(width: number) {
  return Math.min(140, width * 0.3);
}

/** Warm the image cache for the next few people (real photos only; placeholders are CSS). */
function usePreload(items: RankedCandidate[]) {
  const seen = useRef(new Set<string>());
  useEffect(() => {
    for (const c of items.slice(0, 5)) {
      for (const p of c.profile.photos.slice(0, 3)) {
        if (!p.url || seen.current.has(p.url)) continue;
        seen.current.add(p.url);
        const img = new Image();
        img.decoding = 'async';
        img.src = p.url;
      }
    }
  }, [items]);
}
