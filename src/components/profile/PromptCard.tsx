import type { ReactNode } from 'react';
import type { PromptAnswer } from '../../domain/types';
import './PromptCard.css';

export function PromptCard({ prompt, action }: { prompt: PromptAnswer; action?: ReactNode }) {
  return (
    <figure className="prompt-card">
      <figcaption className="prompt-card__prompt">{prompt.prompt}</figcaption>
      <blockquote className="prompt-card__answer">{prompt.answer}</blockquote>
      {action && <div className="prompt-card__action">{action}</div>}
    </figure>
  );
}
