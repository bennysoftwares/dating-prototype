import { useEffect, useRef, useState } from 'react';
import { ListGroup, ListRow } from '../../components/ui';

interface Metrics {
  width: number;
  height: number;
  dpr: number;
  top: string;
  bottom: string;
  left: string;
  right: string;
}

/** Reads the live env(safe-area-inset-*) values via a hidden probe element. */
export function SafeAreaReadout() {
  const probe = useRef<HTMLDivElement>(null);
  const [m, setM] = useState<Metrics | null>(null);

  useEffect(() => {
    const read = () => {
      const el = probe.current;
      if (!el) return;
      const cs = getComputedStyle(el);
      setM({
        width: window.innerWidth,
        height: window.innerHeight,
        dpr: window.devicePixelRatio,
        top: cs.paddingTop,
        bottom: cs.paddingBottom,
        left: cs.paddingLeft,
        right: cs.paddingRight,
      });
    };
    read();
    window.addEventListener('resize', read);
    return () => window.removeEventListener('resize', read);
  }, []);

  return (
    <>
      <div
        ref={probe}
        aria-hidden="true"
        style={{
          position: 'fixed',
          visibility: 'hidden',
          pointerEvents: 'none',
          paddingTop: 'var(--safe-top)',
          paddingBottom: 'var(--safe-bottom)',
          paddingLeft: 'var(--safe-left)',
          paddingRight: 'var(--safe-right)',
        }}
      />
      {m && (
        <ListGroup label="Viewport metrics">
          <ListRow title="Viewport" trailing={`${m.width} × ${m.height} @${m.dpr}x`} />
          <ListRow title="Safe area top / bottom" trailing={`${m.top} / ${m.bottom}`} />
          <ListRow title="Safe area left / right" trailing={`${m.left} / ${m.right}`} />
        </ListGroup>
      )}
    </>
  );
}
