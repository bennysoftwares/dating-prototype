import { useEffect, useState } from 'react';
import { DATE_OUTCOME_LABELS } from '../../domain/profileOptions';
import type { DateOutcome } from '../../domain/types';
import { ChoiceList, TextArea } from '../form';
import { BottomSheet, Button, Icon } from '../ui';
import './Dates.css';

interface DateFeedbackSheetProps {
  open: boolean;
  onClose: () => void;
  name: string;
  onSubmit: (input: { outcome: DateOutcome; worked?: string; didnt?: string }) => Promise<void>;
}

/** Private post-date check-in. Never shown to the other person. */
export function DateFeedbackSheet({ open, onClose, name, onSubmit }: DateFeedbackSheetProps) {
  const [outcome, setOutcome] = useState<DateOutcome | null>(null);
  const [worked, setWorked] = useState('');
  const [didnt, setDidnt] = useState('');
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (open) {
      setOutcome(null);
      setWorked('');
      setDidnt('');
      setBusy(false);
    }
  }, [open]);

  const submit = async () => {
    if (!outcome) return;
    setBusy(true);
    try {
      await onSubmit({ outcome, worked, didnt });
    } finally {
      setBusy(false);
    }
  };

  return (
    <BottomSheet
      open={open}
      onClose={onClose}
      title="How did it go?"
      footer={
        <Button size="lg" block disabled={!outcome || busy} onClick={() => void submit()}>
          Save privately
        </Button>
      }
    >
      <div className="date-form">
        <p className="date-feedback__private">
          <Icon name="eyeOff" size={16} /> Only you can see this. {name} will never be told what you say here.
        </p>
        <ChoiceList
          legend={`Your date with ${name}`}
          hideLegend
          options={(Object.keys(DATE_OUTCOME_LABELS) as DateOutcome[]).map((o) => ({ value: o, label: DATE_OUTCOME_LABELS[o] }))}
          value={outcome}
          onChange={setOutcome}
        />
        {outcome && outcome !== 'did_not_go' && (
          <>
            <TextArea id="worked" label="What worked? (optional)" value={worked} onChange={setWorked} maxLength={300} rows={2} />
            <TextArea id="didnt" label="What didn't? (optional)" value={didnt} onChange={setDidnt} maxLength={300} rows={2} />
          </>
        )}
      </div>
    </BottomSheet>
  );
}
