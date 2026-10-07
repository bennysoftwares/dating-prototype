import { datePassed, formatDatePlan } from '../../domain/dates';
import type { DateFeedback, DatePlan } from '../../domain/types';
import { DATE_OUTCOME_LABELS } from '../../domain/profileOptions';
import { cx } from '../../utils/cx';
import { Button, Icon } from '../ui';
import './Dates.css';

interface DateCardProps {
  plan: DatePlan;
  viewerId: string;
  name: string;
  feedback?: DateFeedback;
  /** Another plan replaced this one. */
  superseded: boolean;
  onAccept: () => void;
  onSuggestChange: () => void;
  onCancel: () => void;
  onShare: () => void;
  onFeedback: () => void;
}

/** A shared date card inside the conversation. */
export function DateCard({ plan, viewerId, name, feedback, superseded, onAccept, onSuggestChange, onCancel, onShare, onFeedback }: DateCardProps) {
  const mine = plan.proposedBy === viewerId;
  const { dayShort, day, time } = formatDatePlan(plan);
  const passed = datePassed(plan);
  const status =
    plan.status === 'accepted'
      ? passed
        ? 'Date day has passed'
        : "You're both in"
      : plan.status === 'changed' || superseded
        ? 'A new time was suggested'
        : plan.status === 'cancelled'
          ? 'Cancelled'
          : mine
            ? `Waiting for ${name}`
            : `${name} suggested a date`;

  return (
    <article className={cx('date-card', (plan.status === 'changed' || plan.status === 'cancelled' || superseded) && 'date-card--muted')} aria-label={`Date plan: ${day} at ${time}`}>
      <p className="date-card__status">
        <Icon name={plan.status === 'accepted' ? 'check' : 'calendar'} size={16} />
        {status}
      </p>
      <p className="date-card__when">
        <span className="date-card__day">{dayShort}</span>
        <span className="date-card__time">{time}</span>
      </p>
      <p className="date-card__date">{day}</p>
      {plan.venue && <p className="date-card__venue"><Icon name="pin" size={16} /> {plan.venue}</p>}
      {plan.note && <p className="date-card__note">“{plan.note}”</p>}

      {plan.status === 'proposed' && !superseded && (
        <div className="date-card__actions">
          {!mine && <Button size="sm" icon="check" onClick={onAccept}>Accept</Button>}
          <Button size="sm" variant="secondary" onClick={onSuggestChange}>Suggest change</Button>
          {mine && <Button size="sm" variant="quiet" onClick={onCancel}>Cancel</Button>}
        </div>
      )}

      {plan.status === 'accepted' && (
        <div className="date-card__actions">
          {!passed && <Button size="sm" variant="secondary" icon="shield" onClick={onShare}>Share date</Button>}
          {!passed && <Button size="sm" variant="quiet" onClick={onSuggestChange}>Suggest change</Button>}
          {passed && !feedback && <Button size="sm" onClick={onFeedback}>How did it go?</Button>}
          {feedback && (
            <p className="date-card__feedback">
              <Icon name="eyeOff" size={16} /> You said: {DATE_OUTCOME_LABELS[feedback.outcome]}. Only you can see this.
            </p>
          )}
        </div>
      )}

      {plan.status === 'proposed' && !superseded && (
        <button type="button" className="date-card__share" onClick={onShare}>
          <Icon name="shield" size={16} /> Share date with someone you trust
        </button>
      )}
    </article>
  );
}
