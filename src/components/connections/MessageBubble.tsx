import type { Message, Profile } from '../../domain/types';
import { describeSnapshot } from '../../domain/matching';
import { cx } from '../../utils/cx';
import { formatDuration, formatTime } from '../../utils/day';
import { Icon } from '../ui/Icon';
import { PhotoFrame } from '../ui/PhotoFrame';
import { LikedSnapshot } from './LikedSnapshot';
import './MessageBubble.css';

interface MessageBubbleProps {
  message: Message;
  mine: boolean;
  viewer: Profile;
  other: Profile;
  /** Show the time under the last bubble of a group. */
  showTime: boolean;
  onPlayVoice: () => void;
}

const WAVE = [6, 12, 18, 10, 22, 14, 8, 16, 20, 12, 7, 15, 19, 11, 6, 13, 17, 9];

export function MessageBubble({ message: m, mine, viewer, other, showTime, onPlayVoice }: MessageBubbleProps) {
  const pending = m.id.startsWith('pending-');
  const author = mine ? 'You' : other.firstName;
  return (
    <div className={cx('msg', mine ? 'msg--mine' : 'msg--theirs', pending && 'msg--pending')}>
      {m.likeContext && (
        <div className="msg__context">
          <span className="msg__context-label">
            <Icon name="heart" size={14} filled />
            {mine ? 'You' : other.firstName} liked {describeSnapshot(m.likeContext.snapshot, m.likeContext.aboutUserId === viewer.userId, other.firstName)}
          </span>
          {m.likeContext.snapshot.kind !== 'profile' && (
            <LikedSnapshot snapshot={m.likeContext.snapshot} owner={m.likeContext.aboutUserId === viewer.userId ? viewer : other} compact />
          )}
        </div>
      )}

      {m.kind === 'text' && (
        <p className="msg__bubble">
          <span className="visually-hidden">{author}: </span>
          {m.body}
        </p>
      )}

      {m.kind === 'photo' && (
        <figure className="msg__photo">
          <PhotoFrame photo={{ id: m.id, tone: m.photo?.tone ?? ['#d8cfc5', '#8b8178'], alt: `Photo from ${author}` }} ratio="4 / 5" rounded="lg">
            <span className="msg__photo-icon" aria-hidden="true"><Icon name="image" size={28} /></span>
          </PhotoFrame>
          <figcaption>Photo · prototype placeholder</figcaption>
        </figure>
      )}

      {m.kind === 'voice' && (
        <div className="msg__bubble msg__voice">
          <button type="button" className="msg__play" onClick={onPlayVoice} aria-label={`Play voice note from ${author}, ${formatDuration(m.voice?.durationSec ?? 0)}`}>
            <Icon name="play" size={18} filled />
          </button>
          <span className="msg__wave" aria-hidden="true">
            {WAVE.map((h, i) => <span key={i} style={{ height: h }} />)}
          </span>
          <span className="msg__duration">{formatDuration(m.voice?.durationSec ?? 0)}</span>
        </div>
      )}

      {showTime && (
        <time className="msg__time" dateTime={m.sentAt}>
          {pending ? 'Sending…' : formatTime(m.sentAt)}
        </time>
      )}
    </div>
  );
}
