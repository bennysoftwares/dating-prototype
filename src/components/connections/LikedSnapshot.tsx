import type { LikeSnapshot, Profile } from '../../domain/types';
import { PhotoFrame } from '../ui/PhotoFrame';
import './LikedSnapshot.css';

interface LikedSnapshotProps {
  snapshot: LikeSnapshot;
  /** Whose photo/prompt it is, to resolve the current image. */
  owner: Profile | null | undefined;
  compact?: boolean;
}

/** A small quote of what was liked: the photo thumbnail or the prompt answer. */
export function LikedSnapshot({ snapshot, owner, compact }: LikedSnapshotProps) {
  if (snapshot.kind === 'photo') {
    const photo = owner?.photos.find((p) => p.id === snapshot.photoId) ?? { id: snapshot.photoId, tone: snapshot.tone, alt: 'Liked photo' };
    return (
      <div className={compact ? 'liked-snap liked-snap--photo liked-snap--compact' : 'liked-snap liked-snap--photo'}>
        <PhotoFrame photo={photo} ratio="4 / 5" rounded="md" monogram={owner?.firstName.charAt(0)} />
      </div>
    );
  }
  if (snapshot.kind === 'prompt') {
    return (
      <figure className={compact ? 'liked-snap liked-snap--prompt liked-snap--compact' : 'liked-snap liked-snap--prompt'}>
        <figcaption>{snapshot.prompt}</figcaption>
        <blockquote>{snapshot.answer}</blockquote>
      </figure>
    );
  }
  return null;
}
