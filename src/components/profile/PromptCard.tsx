import type { ReactNode } from 'react';
import type { PromptAnswer } from '../../domain/types';
import { Icon, type IconName } from '../ui/Icon';
import './PromptCard.css';

/** A small, friendly icon that fits the question. Purely decorative. */
export function promptIcon(prompt: string): IconName {
  const p = prompt.toLowerCase();
  if (/heart|win me|fall for|together/.test(p)) return 'heart';
  if (/flag|looking for|get along|should know/.test(p)) return 'sprout';
  if (/sunday|date|friday|weekend/.test(p)) return 'coffee';
  if (/laugh|fact|fear|hill|passionate|shut up/.test(p)) return 'smile';
  return 'sparkle';
}

export function PromptCard({ prompt, action }: { prompt: PromptAnswer; action?: ReactNode }) {
  return (
    <figure className="prompt-card">
      <div className="prompt-card__top">
        <span className="prompt-card__icon" aria-hidden="true">
          <Icon name={promptIcon(prompt.prompt)} size={20} filled={promptIcon(prompt.prompt) === 'heart'} />
        </span>
        {action && <div className="prompt-card__action">{action}</div>}
      </div>
      <figcaption className="prompt-card__prompt">{prompt.prompt}</figcaption>
      <blockquote className="prompt-card__answer">{prompt.answer}</blockquote>
    </figure>
  );
}
