import { useEffect, useState } from 'react';
import { REPORT_CATEGORY_LABELS } from '../../domain/profileOptions';
import { REPORT_CATEGORIES, type Profile, type ReportCategory } from '../../domain/types';
import { useConnections } from '../../connections/ConnectionsProvider';
import { ChoiceList, Switch, TextArea } from '../form';
import { ActionList, BottomSheet, Button, Icon, type Action } from '../ui';
import './SafetySheet.css';

type Step = 'menu' | 'report-category' | 'report-details' | 'report-done' | 'block' | 'unmatch' | 'done';
export type SafetyOutcome = 'blocked' | 'reported' | 'unmatched';

interface SafetySheetProps {
  person: Profile;
  open: boolean;
  onClose: () => void;
  /** Unmatch is offered only for an existing match. */
  matchId?: string;
  /** Non-safety actions shown first (e.g. View profile, Plan a date, Archive). */
  extraActions?: Action[];
  /** Called after a safety action completes, e.g. to leave a screen that no longer applies. */
  onDone?: (outcome: SafetyOutcome) => void;
  /** Jump straight to a step (e.g. Report from a dedicated button). */
  initialStep?: Step;
}

/**
 * Report, block and unmatch. Calm, private, and available to everyone.
 * Nobody is ever told who reported or blocked them.
 */
export function SafetySheet({ person, open, onClose, matchId, extraActions = [], onDone, initialStep = 'menu' }: SafetySheetProps) {
  const { block, report, unmatch } = useConnections();
  const [step, setStep] = useState<Step>(initialStep);
  const [category, setCategory] = useState<ReportCategory | null>(null);
  const [details, setDetails] = useState('');
  const [alsoBlock, setAlsoBlock] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [outcome, setOutcome] = useState<SafetyOutcome | null>(null);
  const name = person.firstName;

  useEffect(() => {
    if (open) {
      setStep(initialStep);
      setCategory(null);
      setDetails('');
      setAlsoBlock(true);
      setError(null);
      setBusy(false);
      setOutcome(null);
    }
  }, [open, initialStep]);

  const run = async (fn: () => Promise<void>, next: Step, result: SafetyOutcome) => {
    setBusy(true);
    setError(null);
    try {
      await fn();
      setOutcome(result);
      setStep(next);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'That didn’t work. Try again.');
    } finally {
      setBusy(false);
    }
  };

  // Leaving a finished flow tells the parent what happened.
  const close = () => {
    onClose();
    if (outcome) onDone?.(outcome);
  };

  const safetyActions: Action[] = [
    { label: `Report ${name}`, icon: 'flag', onSelect: () => setStep('report-category') },
    { label: `Block ${name}`, icon: 'shield', onSelect: () => setStep('block') },
    ...(matchId ? [{ label: 'Unmatch', icon: 'close' as const, danger: true, onSelect: () => setStep('unmatch') }] : []),
  ];

  const titles: Record<Step, string> = {
    menu: name,
    'report-category': `Report ${name}`,
    'report-details': `Report ${name}`,
    'report-done': 'Thanks for telling us',
    block: `Block ${name}?`,
    unmatch: `Unmatch ${name}?`,
    done: outcome === 'unmatched' ? 'Unmatched' : 'Blocked',
  };

  const footer = (() => {
    switch (step) {
      case 'report-category':
        return (
          <Button size="lg" block disabled={!category} onClick={() => setStep('report-details')}>
            Continue
          </Button>
        );
      case 'report-details':
        return (
          <Button
            size="lg"
            block
            disabled={busy}
            onClick={() => void run(() => report({ userId: person.userId, category: category!, details, alsoBlock }), 'report-done', 'reported')}
          >
            {busy ? 'Sending…' : 'Send report'}
          </Button>
        );
      case 'block':
        return (
          <>
            <Button size="lg" block disabled={busy} onClick={() => void run(() => block(person.userId), 'done', 'blocked')}>
              {busy ? 'Blocking…' : `Block ${name}`}
            </Button>
            <Button variant="quiet" block onClick={() => (initialStep === 'block' ? close() : setStep('menu'))}>Cancel</Button>
          </>
        );
      case 'unmatch':
        return (
          <>
            <Button size="lg" block disabled={busy} onClick={() => void run(() => unmatch(matchId!), 'done', 'unmatched')}>
              {busy ? 'Unmatching…' : 'Unmatch'}
            </Button>
            <Button variant="quiet" block onClick={() => setStep('menu')}>Cancel</Button>
          </>
        );
      case 'report-done':
      case 'done':
        return (
          <Button size="lg" block onClick={close}>
            Done
          </Button>
        );
      default:
        return undefined;
    }
  })();

  return (
    <BottomSheet open={open} onClose={close} title={titles[step]} footer={footer}>
      <div className="safety">
        {error && <p className="safety__error" role="alert">{error}</p>}

        {step === 'menu' && (
          <>
            {extraActions.length > 0 && <ActionList actions={extraActions} />}
            <p className="safety__group">Safety</p>
            <ActionList actions={safetyActions} />
            <p className="safety__note">
              <Icon name="shield" size={16} /> Safety tools are free for everyone. {name} is never told who reported or blocked them.
            </p>
          </>
        )}

        {step === 'report-category' && (
          <ChoiceList
            legend={`What's going on with ${name}?`}
            options={REPORT_CATEGORIES.map((c) => ({ value: c, label: REPORT_CATEGORY_LABELS[c] }))}
            value={category}
            onChange={setCategory}
          />
        )}

        {step === 'report-details' && (
          <>
            <p className="safety__summary">{category && REPORT_CATEGORY_LABELS[category]}</p>
            <TextArea
              id="reportDetails"
              label="Anything else we should know? (optional)"
              value={details}
              onChange={setDetails}
              maxLength={500}
              rows={4}
              hint="Specific details help our team review this. Your report is private."
            />
            <div className="safety__switch">
              <Switch label={`Also block ${name}`} description="They won't be able to see you or message you." checked={alsoBlock} onChange={setAlsoBlock} compact />
            </div>
            {category === 'underage' && (
              <p className="safety__note">If someone is in immediate danger, contact local emergency services.</p>
            )}
          </>
        )}

        {step === 'report-done' && (
          <div className="safety__done">
            <span className="safety__done-icon" aria-hidden="true"><Icon name="check" size={28} /></span>
            <p>We review every report. {name} won't know who reported them.</p>
            {alsoBlock && <p>You've also blocked {name}. You won't see each other again.</p>}
            <p className="safety__note">Prototype: reports are stored on this device only.</p>
          </div>
        )}

        {step === 'block' && (
          <div className="safety__copy">
            <p>{name} won't be able to see your profile or message you, and you won't see them anywhere in the app.</p>
            <p>They won't be told. You can unblock them later in Settings → Blocked users.</p>
          </div>
        )}

        {step === 'unmatch' && (
          <div className="safety__copy">
            <p>This removes your match and conversation with {name}. It can't be undone, and they won't appear in Discover again.</p>
            <p>If something felt wrong, you can report them instead. Reporting is private.</p>
            <Button variant="secondary" size="sm" icon="flag" onClick={() => setStep('report-category')}>Report {name} instead</Button>
          </div>
        )}

        {step === 'done' && (
          <div className="safety__done">
            <span className="safety__done-icon" aria-hidden="true"><Icon name="check" size={28} /></span>
            <p>{outcome === 'unmatched' ? `You've unmatched with ${name}.` : `You've blocked ${name}. They won't be told.`}</p>
          </div>
        )}
      </div>
    </BottomSheet>
  );
}
