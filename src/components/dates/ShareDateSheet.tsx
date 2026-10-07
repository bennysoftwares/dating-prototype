import { useState } from 'react';
import { brand } from '../../config/brand';
import { formatDatePlan, shareDateText } from '../../domain/dates';
import type { DatePlan, Profile } from '../../domain/types';
import { BottomSheet, Button, Icon, PhotoFrame, useToast } from '../ui';
import './Dates.css';

interface ShareDateSheetProps {
  open: boolean;
  onClose: () => void;
  plan: DatePlan | null;
  person: Profile;
}

/**
 * Trusted-contact style sharing: who, where and when, sent through the phone's own
 * share sheet (or copied). Nothing is sent automatically, and there's no emergency integration yet.
 */
export function ShareDateSheet({ open, onClose, plan, person }: ShareDateSheetProps) {
  const toast = useToast();
  const [busy, setBusy] = useState(false);
  if (!plan) return <BottomSheet open={false} onClose={onClose} title="">{null}</BottomSheet>;
  const { day, time } = formatDatePlan(plan);
  const text = shareDateText(plan, person.firstName, brand.name);

  const share = async () => {
    setBusy(true);
    try {
      if (navigator.share) {
        await navigator.share({ title: `Date with ${person.firstName}`, text });
        toast({ message: 'Shared' });
      } else {
        await navigator.clipboard.writeText(text);
        toast({ message: 'Copied. Paste it to someone you trust.' });
      }
      onClose();
    } catch (err) {
      // Dismissing the native share sheet isn't an error worth showing.
      if (!(err instanceof DOMException && err.name === 'AbortError')) toast({ message: 'Couldn’t share. Try copying instead.' });
    } finally {
      setBusy(false);
    }
  };

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(text);
      toast({ message: 'Copied. Paste it to someone you trust.' });
    } catch {
      toast({ message: 'Copying isn’t available here.' });
    }
  };

  return (
    <BottomSheet
      open={open}
      onClose={onClose}
      title="Share your date"
      description="Let a friend know who you're meeting, where and when."
      footer={
        <>
          <Button size="lg" icon="send" block onClick={() => void share()} disabled={busy}>Share with someone you trust</Button>
          <Button variant="quiet" block onClick={() => void copy()}>Copy text</Button>
        </>
      }
    >
      <div className="share-date" data-testid="share-summary">
        <div className="share-date__person">
          <div className="share-date__photo">
            <PhotoFrame photo={person.photos[0]} ratio="1 / 1" rounded="lg" monogram={person.firstName.charAt(0)} />
          </div>
          <div>
            <p className="share-date__name">{person.firstName}</p>
            <p className="share-date__meta">Your match</p>
          </div>
        </div>
        <dl className="share-date__details">
          <div><dt><Icon name="calendar" size={16} /> When</dt><dd>{day}, {time}</dd></div>
          <div><dt><Icon name="pin" size={16} /> Where</dt><dd>{plan.venue ?? 'Not decided yet'}</dd></div>
        </dl>
        <pre className="share-date__text">{text}</pre>
        <p className="share-date__note">
          Prototype: nothing is sent automatically, and there's no emergency-service integration yet. Meet somewhere public and trust your instincts.
        </p>
      </div>
    </BottomSheet>
  );
}
