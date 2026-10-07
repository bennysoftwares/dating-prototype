import { Icon } from '../ui/Icon';
import './ActionButtons.css';

interface ActionButtonsProps {
  name: string;
  /** Same as swiping left. */
  onPass: () => void;
  /** Same as swiping right. */
  onLike: () => void;
}

/** Exactly two decisions on the Explore card: pass and like. Nothing else lives in this row. */
export function ActionButtons({ name, onPass, onLike }: ActionButtonsProps) {
  return (
    <div className="actions">
      <button type="button" className="actions__btn actions__btn--pass" onClick={onPass}>
        <Icon name="close" size={30} strokeWidth={2.4} />
        <span className="visually-hidden">Pass on {name}</span>
      </button>
      <button type="button" className="actions__btn actions__btn--like" onClick={onLike}>
        <Icon name="heart" size={32} filled />
        <span className="visually-hidden">Like {name}</span>
      </button>
    </div>
  );
}
