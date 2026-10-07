import type { RankedCandidate } from '../../recommendation';
import { getInterest } from '../../domain/interest';
import { isVisible } from '../profile/profileFacts';
import { profileAge } from '../../utils/profileFormat';
import { Icon, type IconName } from '../ui/Icon';
import { PhotoFrame } from '../ui/PhotoFrame';
import './ProfileCard.css';

interface InfoChip {
  key: string;
  icon: IconName;
  label: string;
}

/** A short line for the card: a short bio, else the first prompt answer. Never a wall of text. */
export function cardLine(c: RankedCandidate): string | undefined {
  const { bio, prompts } = c.profile;
  if (bio && bio.length <= 90) return bio;
  return prompts[0]?.answer ?? bio;
}

/** City, work or study, and a few interests. Only what the person chose to show. */
export function cardChips(c: RankedCandidate): InfoChip[] {
  const p = c.profile;
  const chips: InfoChip[] = [];
  chips.push({ key: 'place', icon: 'pin', label: p.hideDistance ? p.location.city : `${p.location.city} · ${c.distanceKm} km` });
  if (p.job && isVisible(p, 'job')) chips.push({ key: 'job', icon: p.job === 'Student' ? 'graduation' : 'briefcase', label: p.job });
  else if (p.education && isVisible(p, 'education')) chips.push({ key: 'edu', icon: 'graduation', label: p.education });
  const shared = new Set(c.compatibility.shared);
  const interests = [...p.interests.map((id) => getInterest(id).label)].sort((a, b) => Number(shared.has(b)) - Number(shared.has(a))).slice(0, 3);
  if (interests.length) chips.push({ key: 'interests', icon: 'heart', label: interests.join(', ') });
  return chips;
}

interface ProfileCardProps {
  candidate: RankedCandidate;
  photoIndex?: number;
  /** Opens the full profile. Absent on the card underneath and on cards flying away. */
  onOpen?: () => void;
  /** Previous / next photo for keyboard and screen-reader users (taps on the photo do the same). */
  onPhoto?: (step: -1 | 1) => void;
}

/**
 * The Explore card: the photo is the hero, with just enough to decide whether to look closer.
 * Gestures (swipe, tap to change photo) are handled by the deck around it.
 */
export function ProfileCard({ candidate, photoIndex = 0, onOpen, onPhoto }: ProfileCardProps) {
  const p = candidate.profile;
  const age = profileAge(p);
  const photos = p.photos;
  const index = Math.min(photoIndex, Math.max(0, photos.length - 1));
  const line = cardLine(candidate);
  const verified = p.verification?.photo === 'verified';

  return (
    <div className="pcard">
      <PhotoFrame photo={photos[index]} ratio="auto" rounded="none" monogram={p.firstName.charAt(0)} className="pcard__photo" decorative />
      <div className="pcard__shade" aria-hidden="true" />
      <div className="pcard__feedback pcard__feedback--pass" aria-hidden="true"><Icon name="close" size={30} /></div>
      <div className="pcard__feedback pcard__feedback--like" aria-hidden="true"><Icon name="heart" size={30} filled /></div>

      {photos.length > 1 && (
        <div className="pcard__bars" aria-hidden="true">
          {photos.map((ph, i) => <span key={ph.id} className={i === index ? 'is-active' : undefined} />)}
        </div>
      )}
      {onPhoto && photos.length > 1 && (
        <div className="pcard__photo-nav">
          <button type="button" className="pcard__photo-btn" onClick={() => onPhoto(-1)} disabled={index === 0}>
            Previous photo
          </button>
          <span className="visually-hidden" aria-live="polite">Photo {index + 1} of {photos.length}</span>
          <button type="button" className="pcard__photo-btn" onClick={() => onPhoto(1)} disabled={index === photos.length - 1}>
            Next photo
          </button>
        </div>
      )}

      <div className="pcard__info">
        <div className="pcard__title-row">
          <h2 className="pcard__name">
            {p.firstName}
            <span className="pcard__age">{age}</span>
            {verified && <Icon name="verified" size={26} filled className="pcard__verified" label="Photo verified" />}
          </h2>
          {onOpen && (
            <button type="button" className="pcard__open" onClick={onOpen}>
              <Icon name="chevronUp" size={22} />
              <span className="visually-hidden">Open {p.firstName}'s full profile</span>
            </button>
          )}
        </div>
        {line && (
          <p className="pcard__line">
            <Icon name="quote" size={18} filled className="pcard__quote" />
            <span>{line}</span>
          </p>
        )}
        <ul className="pcard__chips" role="list">
          {cardChips(candidate).map((chip) => (
            <li key={chip.key}>
              <Icon name={chip.icon} size={16} />
              <span>{chip.label}</span>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
