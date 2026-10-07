import { Link } from 'react-router';
import { ROUTES } from '../../app/navigation';
import type { Conversation } from '../../connections/ConnectionsProvider';
import { messagePreview } from '../../domain/matching';
import { cx } from '../../utils/cx';
import { formatRelativeShort } from '../../utils/time';
import { Avatar } from '../ui/Avatar';
import './ConversationRow.css';

interface ConversationRowProps {
  convo: Conversation;
  viewerId: string;
  draft?: string;
}

/** One conversation in the Matches list. Unread state is yours only; there are no read receipts. */
export function ConversationRow({ convo, viewerId, draft }: ConversationRowProps) {
  const { match, other, last, unread, state } = convo;
  const preview = draft ? null : last ? messagePreview(last, viewerId) : `New match. Say hello to ${other.firstName}`;
  const label = [
    other.firstName,
    unread > 0 ? `${unread} unread` : null,
    draft ? 'draft saved' : null,
    state === 'nudge' ? 'still interested?' : null,
  ]
    .filter(Boolean)
    .join(', ');

  return (
    <Link to={ROUTES.chat(match.id)} className={cx('convo-row', unread > 0 && 'convo-row--unread')}>
      <span className="visually-hidden">{label}. </span>
      <Avatar photo={other.photos[0]} name={other.firstName} size={56} />
      <span className="convo-row__text">
        <span className="convo-row__top">
          <span className="convo-row__name" aria-hidden="true">{other.firstName}</span>
          <time className="convo-row__time" dateTime={match.lastActivityAt}>{formatRelativeShort(match.lastActivityAt)}</time>
        </span>
        <span className="convo-row__bottom">
          {draft ? (
            <span className="convo-row__preview convo-row__preview--draft">
              <strong>Draft:</strong> {draft}
            </span>
          ) : (
            <span className="convo-row__preview">{preview}</span>
          )}
          {unread > 0 && <span className="convo-row__dot" aria-hidden="true" />}
        </span>
        {state === 'nudge' && <span className="convo-row__tag">Still interested?</span>}
      </span>
    </Link>
  );
}
