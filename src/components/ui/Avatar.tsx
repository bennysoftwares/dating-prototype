import type { Photo } from '../../domain/types';
import { PhotoFrame } from './PhotoFrame';

export function Avatar({ photo, name, size = 48 }: { photo: Photo | undefined; name: string; size?: number }) {
  return (
    <div style={{ width: size, height: size, flex: 'none' }}>
      <PhotoFrame photo={photo} ratio="1 / 1" rounded="full" monogram={name.charAt(0)} />
    </div>
  );
}
