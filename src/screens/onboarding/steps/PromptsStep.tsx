import { useState } from 'react';
import { TextArea } from '../../../components/form';
import { BottomSheet, Button, Icon } from '../../../components/ui';
import { PROFILE_LIMITS as L, PROFILE_PROMPTS } from '../../../domain/profileOptions';
import { createId } from '../../../utils/image';
import type { StepProps } from './types';
import './steps.css';

type SheetState =
  | { stage: 'closed' }
  | { stage: 'pick'; editingId: string | null; answer: string }
  | { stage: 'answer'; editingId: string | null; prompt: string; answer: string };

/** 2–3 prompts. Pick a prompt from the list, then write an answer. */
export function PromptsStep({ draft, update, errors }: StepProps) {
  const prompts = draft.prompts;
  const [sheet, setSheet] = useState<SheetState>({ stage: 'closed' });
  const used = new Set(prompts.map((p) => p.prompt));

  const close = () => setSheet({ stage: 'closed' });

  const saveAnswer = () => {
    if (sheet.stage !== 'answer' || !sheet.answer.trim()) return;
    const next = sheet.editingId
      ? prompts.map((p) => (p.id === sheet.editingId ? { ...p, prompt: sheet.prompt, answer: sheet.answer } : p))
      : [...prompts, { id: createId('prompt'), prompt: sheet.prompt, answer: sheet.answer }];
    update({ prompts: next });
    close();
  };

  const remove = (id: string) => {
    update({ prompts: prompts.filter((p) => p.id !== id) });
    close();
  };

  const editingPrompt = sheet.stage !== 'closed' && sheet.editingId ? prompts.find((p) => p.id === sheet.editingId) : undefined;

  return (
    <div className="step-stack">
      <ul className="prompt-list" role="list">
        {prompts.map((p) => (
          <li key={p.id}>
            <button
              type="button"
              className="prompt-tile"
              onClick={() => setSheet({ stage: 'answer', editingId: p.id, prompt: p.prompt, answer: p.answer })}
            >
              <span className="prompt-tile__prompt">{p.prompt}</span>
              <span className="prompt-tile__answer">{p.answer}</span>
              <span className="prompt-tile__edit"><Icon name="edit" size={18} /> Edit</span>
            </button>
          </li>
        ))}
        {prompts.length < L.promptsMax && (
          <li>
            <button type="button" className="prompt-add" onClick={() => setSheet({ stage: 'pick', editingId: null, answer: '' })}>
              <Icon name="plus" size={22} />
              {prompts.length === 0 ? 'Choose a prompt' : 'Add another prompt'}
            </button>
          </li>
        )}
      </ul>
      <p className="step-counter" aria-live="polite">
        {prompts.length} of {L.promptsMax} · at least {L.promptsMin} required
      </p>
      <p className="field__error" role={errors.prompts ? 'alert' : undefined}>{errors.prompts ?? ''}</p>

      <BottomSheet
        open={sheet.stage === 'pick'}
        onClose={close}
        title="Choose a prompt"
        description="Pick one that makes it easy for someone to reply."
      >
        <ul className="prompt-picker" role="list">
          {PROFILE_PROMPTS.map((prompt) => {
            const taken = used.has(prompt) && editingPrompt?.prompt !== prompt;
            return (
              <li key={prompt}>
                <button
                  type="button"
                  className="prompt-picker__item"
                  disabled={taken}
                  onClick={() =>
                    sheet.stage === 'pick' &&
                    setSheet({ stage: 'answer', editingId: sheet.editingId, prompt, answer: sheet.answer })
                  }
                >
                  <span>{prompt}</span>
                  {taken ? <span className="prompt-picker__taken">Used</span> : <Icon name="chevronRight" size={18} />}
                </button>
              </li>
            );
          })}
        </ul>
      </BottomSheet>

      <BottomSheet
        open={sheet.stage === 'answer'}
        onClose={close}
        title={sheet.stage === 'answer' ? sheet.prompt : ''}
        footer={
          sheet.stage === 'answer' && (
            <>
              <Button size="lg" block onClick={saveAnswer} disabled={!sheet.answer.trim()}>
                Save answer
              </Button>
              {sheet.editingId && (
                <Button variant="quiet" block onClick={() => remove(sheet.editingId!)}>
                  Remove prompt
                </Button>
              )}
            </>
          )
        }
      >
        {sheet.stage === 'answer' && (
          <div className="step-stack">
            <TextArea
              id="promptAnswer"
              label="Your answer"
              hideLabel
              placeholder="Write something someone could reply to…"
              value={sheet.answer}
              onChange={(answer) => setSheet({ ...sheet, answer })}
              maxLength={L.promptAnswerMax}
              rows={4}
              autoFocus
            />
            <Button
              variant="quiet"
              size="sm"
              icon="swap"
              onClick={() => setSheet({ stage: 'pick', editingId: sheet.editingId, answer: sheet.answer })}
            >
              Change prompt
            </Button>
          </div>
        )}
      </BottomSheet>
    </div>
  );
}
