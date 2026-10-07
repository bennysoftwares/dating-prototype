import type { Photo } from '../../domain/types';
import { PhotoFrame } from './PhotoFrame';

/** Small round photo. Decorative by default: avatars always sit next to the person's name. */
export function Avatar({ photo, name, size = 48, decorative = true }: { photo: Photo | undefined; name: string; size?: number; decorative?: boolean }) {
  return (
    <div style={{ width: size, height: size, flex: 'none' }}>
      <PhotoFrame photo={photo} ratio="1 / 1" rounded="full" monogram={name.charAt(0)} decorative={decorative} />
    </div>
  );
}
