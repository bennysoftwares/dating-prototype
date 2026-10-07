import { useEffect, useRef, useState, type KeyboardEvent, type RefObject } from 'react';
import { ActionList, BottomSheet, Button, IconButton } from '../ui';
import { Icon } from '../ui/Icon';
import { formatDuration } from '../../utils/day';
import './Composer.css';

export const MESSAGE_MAX = 1000;
const EMOJI = ['😊', '😂', '🥰', '😍', '😅', '🙈', '😉', '🤔', '😮', '🥲', '👀', '🙌', '👏', '👍', '❤️', '🔥', '✨', '🎉', '☕', '🍕', '🍜', '🎬', '🎮', '📚', '🌿', '🌧️', '☀️', '🏔️', '🐶', '🐱', '✈️', '🍷'];

interface ComposerProps {
  value: string;
  onChange: (value: string) => void;
  onSendText: (text: string) => void;
  onSendPhoto: () => void;
  onSendVoice: (durationSec: number) => void;
  name: string;
  /** Lets the parent focus the box (e.g. "Send a message" on the Still interested? prompt). */
  inputRef: RefObject<HTMLTextAreaElement | null>;
  /** Shown once both people have written; opens date planning. */
  onPlanDate?: () => void;
}

/**
 * Message box pinned above the keyboard. Drafts are saved by the parent on every change.
 * Enter sends on devices with a keyboard; on phones Return adds a line, and you tap Send.
 */
export function Composer({ value, onChange, onSendText, onSendPhoto, onSendVoice, name, inputRef, onPlanDate }: ComposerProps) {
  const [emojiOpen, setEmojiOpen] = useState(false);
  const [attachOpen, setAttachOpen] = useState(false);
  const [recording, setRecording] = useState(false);
  const [seconds, setSeconds] = useState(0);
  const wrapRef = useRef<HTMLDivElement>(null);

  // Auto-grow the textarea up to a few lines.
  useEffect(() => {
    const el = inputRef.current;
    if (!el) return;
    el.style.height = 'auto';
    el.style.height = `${Math.min(el.scrollHeight, 132)}px`;
  }, [value, inputRef]);

  // Report composer height so the message list never hides behind it.
  useEffect(() => {
    const el = wrapRef.current;
    if (!el) return;
    const ro = new ResizeObserver(() => document.documentElement.style.setProperty('--composer-h', `${el.offsetHeight}px`));
    // border-box: safe-area padding changes must update the height too.
    ro.observe(el, { box: 'border-box' });
    return () => {
      ro.disconnect();
      document.documentElement.style.removeProperty('--composer-h');
    };
  }, []);

  useEffect(() => {
    if (!recording) return;
    setSeconds(0);
    const id = window.setInterval(() => setSeconds((s) => s + 1), 1000);
    return () => window.clearInterval(id);
  }, [recording]);

  const send = () => {
    const text = value.trim();
    if (!text) return;
    onSendText(text);
    setEmojiOpen(false);
    inputRef.current?.focus();
  };

  const onKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    const hasKeyboard = window.matchMedia('(pointer: fine)').matches;
    if (e.key === 'Enter' && !e.shiftKey && hasKeyboard && !e.nativeEvent.isComposing) {
      e.preventDefault();
      send();
    }
  };

  const insertEmoji = (emoji: string) => {
    const el = inputRef.current;
    const start = el?.selectionStart ?? value.length;
    const end = el?.selectionEnd ?? value.length;
    const next = (value.slice(0, start) + emoji + value.slice(end)).slice(0, MESSAGE_MAX);
    onChange(next);
    requestAnimationFrame(() => {
      el?.focus();
      el?.setSelectionRange(start + emoji.length, start + emoji.length);
    });
  };

  return (
    <div ref={wrapRef} className="composer">
      {emojiOpen && (
        <div className="composer__emoji" role="group" aria-label="Emoji">
          {EMOJI.map((e) => (
            <button key={e} type="button" className="composer__emoji-btn" onClick={() => insertEmoji(e)} aria-label={`Insert ${e}`}>
              {e}
            </button>
          ))}
        </div>
      )}
      <div className="composer__row">
        <IconButton icon="plus" label="Add a photo, voice note or date" onClick={() => setAttachOpen(true)} />
        <div className="composer__field">
          <label htmlFor="composer-input" className="visually-hidden">Message {name}</label>
          <textarea
            id="composer-input"
            ref={inputRef}
            rows={1}
            value={value}
            maxLength={MESSAGE_MAX}
            placeholder={`Message ${name}`}
            enterKeyHint="send"
            onChange={(e) => onChange(e.target.value)}
            onKeyDown={onKeyDown}
          />
          <button
            type="button"
            className="composer__emoji-toggle"
            aria-label={emojiOpen ? 'Hide emoji' : 'Show emoji'}
            aria-expanded={emojiOpen}
            onClick={() => setEmojiOpen((o) => !o)}
          >
            <Icon name="smile" size={22} />
          </button>
        </div>
        <button type="button" className="composer__send" onClick={send} disabled={!value.trim()} aria-label="Send message">
          <Icon name="send" size={20} />
        </button>
      </div>

      <BottomSheet open={attachOpen} onClose={() => setAttachOpen(false)} title="Add to message" description="Prototype: photos and voice notes are placeholders, nothing is uploaded.">
        <ActionList
          actions={[
            { label: 'Photo', icon: 'image', onSelect: () => { setAttachOpen(false); onSendPhoto(); } },
            { label: 'Voice note', icon: 'mic', onSelect: () => { setAttachOpen(false); setRecording(true); } },
            ...(onPlanDate ? [{ label: 'Plan a date', icon: 'calendar' as const, onSelect: () => { setAttachOpen(false); onPlanDate(); } }] : []),
          ]}
        />
      </BottomSheet>

      <BottomSheet
        open={recording}
        onClose={() => setRecording(false)}
        title="Voice note"
        description="Prototype: no audio is recorded yet."
        footer={
          <>
            <Button size="lg" icon="send" block onClick={() => { setRecording(false); onSendVoice(Math.max(1, seconds)); }}>
              Send voice note
            </Button>
            <Button variant="quiet" block onClick={() => setRecording(false)}>Cancel</Button>
          </>
        }
      >
        <div className="composer__recording" aria-live="off">
          <span className="composer__rec-dot" aria-hidden="true" />
          <Icon name="mic" size={32} />
          <span className="composer__rec-time">{formatDuration(seconds)}</span>
        </div>
      </BottomSheet>
    </div>
  );
}
