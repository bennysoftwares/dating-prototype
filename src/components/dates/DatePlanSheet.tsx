import { useEffect, useState } from 'react';
import { dateStart } from '../../domain/dates';
import type { DatePlan } from '../../domain/types';
import type { DateInput } from '../../repositories/types';
import { TextArea, TextField } from '../form';
import { BottomSheet, Button } from '../ui';
import './Dates.css';

interface DatePlanSheetProps {
  open: boolean;
  onClose: () => void;
  name: string;
  /** Prefill when suggesting a change. */
  initial?: DatePlan;
  onSubmit: (input: DateInput) => Promise<void>;
}

const todayIso = () => {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
};

/** Date, time, optional place and note. Kept short on purpose. */
export function DatePlanSheet({ open, onClose, name, initial, onSubmit }: DatePlanSheetProps) {
  const [date, setDate] = useState('');
  const [time, setTime] = useState('19:00');
  const [venue, setVenue] = useState('');
  const [note, setNote] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!open) return;
    setDate(initial?.date ?? '');
    setTime(initial?.time ?? '19:00');
    setVenue(initial?.venue ?? '');
    setNote('');
    setError(null);
    setBusy(false);
  }, [open, initial]);

  const submit = async () => {
    if (!date || !time) return setError('Choose a day and a time.');
    if (dateStart({ date, time }) < Date.now()) return setError('That time has already passed.');
    setBusy(true);
    try {
      await onSubmit({ date, time, venue, note });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'That didn’t send. Try again.');
      setBusy(false);
    }
  };

  return (
    <BottomSheet
      open={open}
      onClose={onClose}
      title={initial ? 'Suggest a change' : `Plan a date with ${name}`}
      description="Somewhere public is a good idea for a first date."
      footer={
        <Button size="lg" block onClick={() => void submit()} disabled={busy}>
          {busy ? 'Sending…' : initial ? 'Send new suggestion' : `Suggest to ${name}`}
        </Button>
      }
    >
      <div className="date-form">
        <div className="date-form__row">
          <TextField id="dateDay" label="Day" type="date" value={date} onChange={setDate} min={todayIso()} />
          <TextField id="dateTime" label="Time" type="time" value={time} onChange={setTime} />
        </div>
        <TextField id="dateVenue" label="Where (optional)" placeholder="e.g. Coffee at Kajplats 9" value={venue} onChange={setVenue} maxLength={80} />
        <TextArea id="dateNote" label="Note (optional)" value={note} onChange={setNote} maxLength={200} rows={2} />
        {error && <p className="field__error" role="alert">{error}</p>}
      </div>
    </BottomSheet>
  );
}
