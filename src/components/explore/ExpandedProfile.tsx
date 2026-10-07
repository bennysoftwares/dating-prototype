import { useEffect, useRef, useState, type ReactNode } from 'react';
import { createPortal } from 'react-dom';
import type { LikeTarget } from '../../domain/types';
import type { RankedCandidate } from '../../recommendation';
import { intentLabel, profileAge } from '../../utils/profileFormat';
import { CompatibilitySection } from '../discovery/CompatibilitySection';
import { isVisible, lifestyleFacts, type Fact } from '../profile/profileFacts';
import { getInterest } from '../../domain/interest';
import { Icon, type IconName } from '../ui/Icon';
import { PhotoFrame } from '../ui/PhotoFrame';
import { ActionButtons } from './ActionButtons';
import './ExpandedProfile.css';

interface ExpandedProfileProps {
  candidate: RankedCandidate;
  /** Start on the photo that was showing on the card. */
  initialPhoto?: number;
  /** Collapse back to the card (or leave the page). */
  onCollapse: () => void;
  /** ✕ and ♥: the same decisions as swiping. Absent once a decision has been made. */
  onPass?: () => void;
  onLike?: () => void;
  /** "Reply" on a photo, answer or section: a like with an optional message. */
  onReply?: (target: LikeTarget) => void;
  onSafety: (step: 'block' | 'report-category') => void;
  /** Shown instead of the actions when this person was already decided on. */
  decided?: ReactNode;
  collapseLabel?: string;
}

/**
 * The card, opened up: a scrollable profile in the same place, with the photo on top and
 * every part of the profile in its own section. ✕ and ♥ float at the bottom; the arrow
 * at the top folds it back into the card.
 */
export function ExpandedProfile({ candidate, initialPhoto = 0, onCollapse, onPass, onLike, onReply, onSafety, decided, collapseLabel }: ExpandedProfileProps) {
  const p = candidate.profile;
  const name = p.firstName;
  const age = profileAge(p);
  const [photo, setPhoto] = useState(Math.min(initialPhoto, Math.max(0, p.photos.length - 1)));
  const collapseRef = useRef<HTMLButtonElement>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const verified = p.verification?.photo === 'verified';
  const shared = new Set(candidate.compatibility.shared);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: 0 });
    collapseRef.current?.focus({ preventScroll: true });
  }, [p.id]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && !document.querySelector('dialog[open]')) onCollapse();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onCollapse]);

  const reply = (target: LikeTarget, what: string) =>
    onReply && (
      <button type="button" className="xp__reply" onClick={() => onReply(target)}>
        <Icon name="send" size={16} />
        Reply<span className="visually-hidden"> to {name}'s {what}</span>
      </button>
    );

  const basics: Fact[] = [
    { key: 'distance', icon: 'pin', label: p.hideDistance ? p.location.city : `${candidate.distanceKm} km away · ${p.location.city}` },
  ];
  if (p.heightCm && isVisible(p, 'height')) basics.push({ key: 'height', icon: 'ruler', label: `${p.heightCm} cm` });
  if (p.job && isVisible(p, 'job')) basics.push({ key: 'job', icon: 'briefcase', label: p.job });
  if (p.education && isVisible(p, 'education')) basics.push({ key: 'edu', icon: 'graduation', label: p.education });
  if (p.languages.length) basics.push({ key: 'lang', icon: 'globe', label: p.languages.join(', ') });
  const lifestyle = lifestyleFacts(p);
  const profileTarget: LikeTarget = { kind: 'profile' };
  const current = p.photos[photo];

  // Portalled to <body> so it covers the whole screen (tab bar included), whatever the page's transforms.
  return createPortal(
    <div className="xp" role="region" aria-label={`${name}'s profile`}>
      <div className="xp__scroll" ref={scrollRef}>
        <div className="xp__top">
          <h2 className="xp__title">
            {name} <span className="xp__age">{age}</span>
            {verified && <Icon name="verified" size={24} filled className="xp__verified" label="Photo verified" />}
          </h2>
          <button type="button" ref={collapseRef} className="xp__collapse" onClick={onCollapse}>
            <Icon name="chevronDown" size={24} strokeWidth={2.2} />
            <span className="visually-hidden">{collapseLabel ?? `Close ${name}'s profile`}</span>
          </button>
        </div>

        <div className="xp__photo">
          <PhotoFrame photo={current} ratio="4 / 5" rounded="none" monogram={name.charAt(0)} />
          {p.photos.length > 1 && (
            <>
              <div className="xp__bars" aria-hidden="true">
                {p.photos.map((ph, i) => <span key={ph.id} className={i === photo ? 'is-active' : undefined} />)}
              </div>
              <button type="button" className="xp__tap xp__tap--prev" onClick={() => setPhoto((i) => Math.max(0, i - 1))} disabled={photo === 0}>
                <span className="visually-hidden">Previous photo</span>
              </button>
              <button type="button" className="xp__tap xp__tap--next" onClick={() => setPhoto((i) => Math.min(p.photos.length - 1, i + 1))} disabled={photo === p.photos.length - 1}>
                <span className="visually-hidden">Next photo</span>
              </button>
              <span className="visually-hidden" aria-live="polite">Photo {photo + 1} of {p.photos.length}</span>
            </>
          )}
          {current && onReply && <div className="xp__photo-reply">{reply({ kind: 'photo', photoId: current.id }, 'photo')}</div>}
        </div>

        <div className="xp__sections">
          <Section icon="search" label="Looking for" action={reply(profileTarget, 'profile')}>
            <p className="xp__big">{intentLabel(p)}</p>
          </Section>

          {p.bio && (
            <Section icon="quote" label="About me" action={reply(profileTarget, 'bio')}>
              <p className="xp__text">{p.bio}</p>
            </Section>
          )}

          <Section icon="user" label="The basics">
            <FactRows facts={basics} />
          </Section>

          {p.prompts.map((q) => (
            <Section key={q.id} icon="quote" label={q.prompt} action={reply({ kind: 'prompt', promptId: q.id }, 'answer')}>
              <p className="xp__big">{q.answer}</p>
            </Section>
          ))}

          {lifestyle.length > 0 && (
            <Section icon="sprout" label="Lifestyle">
              <FactRows facts={lifestyle} />
            </Section>
          )}

          {p.interests.length > 0 && (
            <Section icon="heart" label={shared.size ? `Interests · ${shared.size} in common` : 'Interests'}>
              <ul className="xp__chips" role="list">
                {[...p.interests.map((id) => getInterest(id).label)]
                  .sort((a, b) => Number(shared.has(b)) - Number(shared.has(a)))
                  .map((label) => (
                    <li key={label} className={shared.has(label) ? 'is-shared' : undefined}>
                      {shared.has(label) && <Icon name="check" size={14} />}
                      {label}
                      {shared.has(label) && <span className="visually-hidden"> (in common)</span>}
                    </li>
                  ))}
              </ul>
            </Section>
          )}

          <div className="xp__compat">
            <CompatibilitySection compatibility={candidate.compatibility} name={name} />
          </div>

          <div className="xp__safety">
            <button type="button" onClick={() => onSafety('block')}>Block {name}</button>
            <button type="button" className="xp__danger" onClick={() => onSafety('report-category')}>Report {name}</button>
          </div>
        </div>
      </div>

      <div className="xp__actions">
        {decided ?? (onPass && onLike && <ActionButtons name={name} onPass={onPass} onLike={onLike} />)}
      </div>
    </div>,
    document.body,
  );
}

function Section({ icon, label, action, children }: { icon: IconName; label: string; action?: ReactNode; children: ReactNode }) {
  return (
    <section className="xp__section">
      <h3 className="xp__label">
        <Icon name={icon} size={16} filled={icon === 'quote'} />
        {label}
      </h3>
      {children}
      {action && <div className="xp__section-action">{action}</div>}
    </section>
  );
}

function FactRows({ facts }: { facts: Fact[] }) {
  return (
    <ul className="xp__facts" role="list">
      {facts.map((f) => (
        <li key={f.key}>
          <Icon name={f.icon} size={18} />
          <span>{f.label}</span>
        </li>
      ))}
    </ul>
  );
}
