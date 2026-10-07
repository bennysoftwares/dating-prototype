import type { PromptAnswer } from '../../domain/types';
import './PromptCard.css';

export function PromptCard({ prompt }: { prompt: PromptAnswer }) {
  return (
    <figure className="prompt-card">
      <figcaption className="prompt-card__prompt">{prompt.prompt}</figcaption>
      <blockquote className="prompt-card__answer">{prompt.answer}</blockquote>
    </figure>
  );
}
