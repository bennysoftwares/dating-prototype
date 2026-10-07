import { useEffect, useState } from 'react';
import type { LikeTarget, Profile } from '../../domain/types';
import { TextArea } from '../form';
import { BottomSheet, Button, PhotoFrame } from '../ui';
import './LikeSheet.css';

export const LIKE_COMMENT_MAX = 200;

interface LikeSheetProps {
  profile: Profile;
  target: LikeTarget | null;
  onClose: () => void;
  onSend: (target: LikeTarget, comment: string) => Promise<void>;
}

/** "Like this answer → Add a message? → Send like". The message is always optional. */
export function LikeSheet({ profile, target, onClose, onSend }: LikeSheetProps) {
  const [comment, setComment] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (target) {
      setComment('');
      setError(null);
      setBusy(false);
    }
  }, [target]);

  const photo = target?.kind === 'photo' ? profile.photos.find((p) => p.id === target.photoId) : undefined;
  const prompt = target?.kind === 'prompt' ? profile.prompts.find((p) => p.id === target.promptId) : undefined;
  const title =
    target?.kind === 'photo' ? `Like ${profile.firstName}'s photo` : target?.kind === 'prompt' ? `Like ${profile.firstName}'s answer` : `Like ${profile.firstName}`;

  const send = async () => {
    if (!target) return;
    setBusy(true);
    setError(null);
    try {
      await onSend(target, comment);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'That didn’t send. Try again.');
      setBusy(false);
    }
  };

  return (
    <BottomSheet
      open={target !== null}
      onClose={onClose}
      title={title}
      footer={
        <>
          {error && <p className="like-sheet__error" role="alert">{error}</p>}
          <Button size="lg" icon="heart" block onClick={() => void send()} disabled={busy}>
            {busy ? 'Sending…' : 'Send like'}
          </Button>
        </>
      }
    >
      <div className="like-sheet">
        {photo && (
          <div className="like-sheet__photo">
            <PhotoFrame photo={photo} ratio="4 / 5" rounded="md" monogram={profile.firstName.charAt(0)} />
          </div>
        )}
        {prompt && (
          <figure className="like-sheet__prompt">
            <figcaption>{prompt.prompt}</figcaption>
            <blockquote>{prompt.answer}</blockquote>
          </figure>
        )}
        {target?.kind === 'profile' && (
          <p className="like-sheet__tip">
            Tip: liking a specific photo or answer gives {profile.firstName} something easy to reply to.
          </p>
        )}
        <TextArea
          id="likeComment"
          label="Add a message?"
          placeholder={prompt ? 'Say what made you smile…' : `Say something to ${profile.firstName}…`}
          value={comment}
          onChange={setComment}
          maxLength={LIKE_COMMENT_MAX}
          rows={3}
          hint="Optional. A short, specific message goes a long way."
        />
      </div>
    </BottomSheet>
  );
}
