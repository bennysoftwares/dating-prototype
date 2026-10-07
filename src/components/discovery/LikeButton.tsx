import { cx } from '../../utils/cx';
import { Icon } from '../ui/Icon';
import './LikeButton.css';

interface LikeButtonProps {
  /** Accessible, specific label, e.g. "Like Ida's photo". */
  label: string;
  onClick: () => void;
  liked?: boolean;
  /** "overlay" sits on a photo; "inline" sits on a prompt card. */
  variant?: 'overlay' | 'inline';
  disabled?: boolean;
}

/** Contextual like for one photo or one prompt answer. */
export function LikeButton({ label, onClick, liked, variant = 'overlay', disabled }: LikeButtonProps) {
  return (
    <button
      type="button"
      className={cx('like-btn', `like-btn--${variant}`, liked && 'like-btn--liked')}
      aria-label={label}
      aria-pressed={liked || undefined}
      onClick={onClick}
      disabled={disabled}
    >
      <Icon name="heart" size={22} filled={liked} />
    </button>
  );
}
