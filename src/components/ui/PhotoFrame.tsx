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
}

/**
 * Displays a profile photo. Real images lazy-load over their tone gradient;
 * placeholder photos render warm generated art so mock data looks considered.
 */
export function PhotoFrame({ photo, ratio = '4 / 5', rounded = 'lg', monogram, className, children }: PhotoFrameProps) {
  const [from, to] = photo?.tone ?? ['#d8cfc5', '#8b8178'];
  const style = { '--photo-from': from, '--photo-to': to, aspectRatio: ratio } as CSSProperties;

  return (
    <div className={cx('photo', `photo--r-${rounded}`, className)} style={style}>
      {photo?.url ? (
        <img src={photo.url} alt={photo.alt} loading="lazy" decoding="async" />
      ) : (
        <div className="photo__art" role="img" aria-label={photo?.alt ?? 'Photo placeholder'}>
          {monogram && <span aria-hidden="true">{monogram}</span>}
        </div>
      )}
      {children}
    </div>
  );
}
