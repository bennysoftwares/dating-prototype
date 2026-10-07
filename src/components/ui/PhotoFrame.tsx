import type { CSSProperties, ReactNode } from 'react';
import type { Photo } from '../../domain/types';
import { cx } from '../../utils/cx';
import './PhotoFrame.css';

interface PhotoFrameProps {
  photo: Photo | undefined;
  /** CSS aspect ratio, e.g. "4 / 5". */
  ratio?: string;
  rounded?: 'none' | 'md' | 'lg' | 'xl' | 'full';
  /** Initial shown on generated placeholder art. */
  monogram?: string;
  className?: string;
  children?: ReactNode;
  /** Hide from assistive tech when a nearby label already names the person. */
  decorative?: boolean;
}

/**
 * Displays a profile photo. Real images lazy-load over their tone gradient;
 * placeholder photos render warm generated art so mock data looks considered.
 */
export function PhotoFrame({ photo, ratio = '4 / 5', rounded = 'lg', monogram, className, children, decorative }: PhotoFrameProps) {
  const [from, to] = photo?.tone ?? ['#d8cfc5', '#8b8178'];
  const style = { '--photo-from': from, '--photo-to': to, aspectRatio: ratio } as CSSProperties;

  return (
    <div className={cx('photo', `photo--r-${rounded}`, className)} style={style}>
      {photo?.url ? (
        <img src={photo.url} alt={decorative ? '' : photo.alt} loading="lazy" decoding="async" />
      ) : (
        <div className="photo__art" {...(decorative ? { 'aria-hidden': true } : { role: 'img', 'aria-label': photo?.alt ?? 'Photo placeholder' })}>
          <PlaceholderScene seed={photo?.id ?? ''} />
          {monogram && <span aria-hidden="true">{monogram}</span>}
        </div>
      )}
      {children}
    </div>
  );
}

/**
 * Generated placeholder "photography" for mock people: a soft portrait silhouette or a
 * landscape in the photo's own tones. Large frames show the scene, small ones the initial.
 */
function PlaceholderScene({ seed }: { seed: string }) {
  let h = 0;
  for (let i = 0; i < seed.length; i += 1) h = (h * 31 + seed.charCodeAt(i)) | 0;
  const kind = Math.abs(h) % 3;
  const shift = (Math.abs(h >> 3) % 20) - 10;
  return (
    <svg className="photo__scene" viewBox="0 0 100 125" preserveAspectRatio="xMidYMax slice" aria-hidden="true" focusable="false">
      <circle cx={70 + shift} cy={28} r={kind === 2 ? 20 : 14} fill="#fff8f0" opacity="0.28" />
      {kind === 2 ? (
        <>
          <path d="M0 82 C20 70 34 74 50 80 C66 86 82 72 100 76 V125 H0Z" fill="#2b1d18" opacity="0.14" />
          <path d="M0 96 C24 88 44 92 62 98 C78 103 90 96 100 94 V125 H0Z" fill="#2b1d18" opacity="0.2" />
        </>
      ) : (
        <>
          <path d="M0 100 C25 94 40 96 60 100 C76 103 90 99 100 97 V125 H0Z" fill="#2b1d18" opacity="0.1" />
          <g fill="#2b1d18" opacity={kind === 0 ? 0.2 : 0.16} transform={`translate(${kind === 1 ? shift : shift / 2} 0)`}>
            <ellipse cx="50" cy="58" rx="13.5" ry="16" />
            <path d="M50 76c-17 0-29 11-31 31-.4 6 0 12 0 18h62c0-6 .4-12 0-18-2-20-14-31-31-31Z" />
          </g>
        </>
      )}
    </svg>
  );
}
