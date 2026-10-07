import type { LikeTarget, Photo, Profile, PromptAnswer } from '../../domain/types';
import type { Compatibility } from '../../recommendation';
import { CompatibilitySection } from '../discovery/CompatibilitySection';
import { LikeButton } from '../discovery/LikeButton';
import { Chip, ChipList } from '../ui/Chip';
import { Icon } from '../ui/Icon';
import { PhotoFrame } from '../ui/PhotoFrame';
import { intentLabel, profileAge } from '../../utils/profileFormat';
import { PromptCard } from './PromptCard';
import { basicFacts, interestLabels, lifestyleFacts, type Fact } from './profileFacts';
import './ProfileView.css';

interface ProfileViewProps {
  profile: Profile;
  distanceLabel?: string;
  /** Discovery only: plain-language compatibility with the viewer. */
  compatibility?: Compatibility;
  /** Discovery only: enables contextual likes on photos and prompt answers. */
  onLike?: (target: LikeTarget) => void;
  /** The target already liked, if any (shown as filled). */
  likedTarget?: LikeTarget;
}

const sameTarget = (a: LikeTarget | undefined, b: LikeTarget) =>
  !!a && a.kind === b.kind && (a.kind === 'profile' || (a.kind === 'photo' && b.kind === 'photo' && a.photoId === b.photoId) || (a.kind === 'prompt' && b.kind === 'prompt' && a.promptId === b.promptId));

/**
 * The full vertical profile: photos interleaved with prompts and details,
 * closer to a considered Hinge profile than a single swipe card.
 * Used by the onboarding preview, Profile → Preview, Explore and Standouts.
 */
export function ProfileView({ profile: p, distanceLabel, compatibility, onLike, likedTarget }: ProfileViewProps) {
  const [photo1, photo2, photo3, ...morePhotos] = p.photos;
  const monogram = p.firstName.charAt(0);
  const decided = likedTarget !== undefined;

  // Like buttons appear in discovery (onLike) and stay visible, disabled, once something was liked.
  const showLikes = Boolean(onLike) || decided;
  const photoLike = (photo: Photo | undefined) => {
    if (!showLikes || !photo) return null;
    const target: LikeTarget = { kind: 'photo', photoId: photo.id };
    const liked = sameTarget(likedTarget, target);
    if (decided && !liked) return null;
    return <LikeButton label={liked ? `You liked ${p.firstName}'s photo` : `Like ${p.firstName}'s photo`} liked={liked} disabled={decided} onClick={() => onLike?.(target)} />;
  };
  const promptLike = (prompt: PromptAnswer) => {
    if (!showLikes) return undefined;
    const target: LikeTarget = { kind: 'prompt', promptId: prompt.id };
    const liked = sameTarget(likedTarget, target);
    if (decided && !liked) return undefined;
    return (
      <LikeButton
        variant="inline"
        label={liked ? `You liked ${p.firstName}'s answer` : `Like ${p.firstName}'s answer: ${prompt.prompt}`}
        liked={liked}
        disabled={decided}
        onClick={() => onLike?.(target)}
      />
    );
  };
  const photoBlock = (photo: Photo) => (
    <PhotoFrame key={photo.id} photo={photo} ratio="4 / 5" rounded="xl" monogram={monogram}>
      {photoLike(photo)}
    </PhotoFrame>
  );
  const sharedSet = new Set(compatibility?.shared ?? []);
  const [prompt1, prompt2, prompt3, ...morePrompts] = p.prompts;
  const leadPrompts = [prompt1, prompt2, prompt3].filter((x): x is PromptAnswer => Boolean(x));
  const basics: Fact[] = [
    { key: 'place', icon: 'pin', label: distanceLabel ? `${p.location.city} · ${distanceLabel}` : p.location.city },
    ...basicFacts(p),
  ];
  const lifestyle = lifestyleFacts(p);
  const interests = interestLabels(p);
  const verified = p.verification?.photo === 'verified';
  const age = profileAge(p);

  return (
    <article className="profile-view" aria-label={`${p.firstName}'s profile`}>
      <PhotoFrame photo={photo1} ratio="4 / 5" rounded="xl" monogram={monogram} className="profile-view__hero">
        {p.photos.length > 1 && (
          <div className="profile-view__dots" aria-hidden="true">
            {p.photos.map((ph, i) => <span key={ph.id} className={i === 0 ? 'is-active' : undefined} />)}
          </div>
        )}
        {photoLike(photo1)}
      </PhotoFrame>

      <header className="profile-view__intro">
        <h2 className="profile-view__name">
          {p.firstName} <span className="profile-view__age">{age}</span>
          {verified && <Icon name="verified" size={30} filled className="profile-view__verified" label="Photo verified" />}
        </h2>
        <p className="profile-view__place">
          <Icon name="pin" size={18} />
          {p.location.city}
          {distanceLabel && <span className="profile-view__distance"> · {distanceLabel}</span>}
        </p>
        {p.bio && <p className="profile-view__bio">{p.bio}</p>}
      </header>

      {leadPrompts.length > 0 && (
        <div className="profile-view__prompts">
          {leadPrompts.map((q) => <PromptCard key={q.id} prompt={q} action={promptLike(q)} />)}
        </div>
      )}

      <section className="profile-view__card" aria-label="About">
        <FactList facts={basics} columns />
        <div className="profile-view__looking">
          <Icon name="heart" size={22} />
          <div>
            <span className="profile-view__looking-label">Looking for</span>
            <span>{intentLabel(p)}</span>
          </div>
        </div>
      </section>

      {photo2 && photoBlock(photo2)}

      {interests.length > 0 && (
        <section className="profile-view__card" aria-label="Interests">
          <h3 className="profile-view__heading">{sharedSet.size ? `Interests · ${sharedSet.size} shared` : 'Interests'}</h3>
          <ChipList label="Interests">
            {[...interests].sort((a, b) => Number(sharedSet.has(b)) - Number(sharedSet.has(a))).map((label) => (
              <li key={label}>
                <Chip tone={sharedSet.has(label) ? 'accent' : 'neutral'} icon={sharedSet.has(label) ? 'check' : undefined}>
                  {label}
                  {sharedSet.has(label) && <span className="visually-hidden"> (shared)</span>}
                </Chip>
              </li>
            ))}
          </ChipList>
        </section>
      )}

      {lifestyle.length > 0 && (
        <section className="profile-view__card" aria-label="Lifestyle">
          <h3 className="profile-view__heading">Lifestyle</h3>
          <FactList facts={lifestyle} columns />
        </section>
      )}

      {photo3 && photoBlock(photo3)}
      {compatibility && <CompatibilitySection compatibility={compatibility} name={p.firstName} />}
      {morePrompts.map((q) => <PromptCard key={q.id} prompt={q} action={promptLike(q)} />)}
      {morePhotos.map(photoBlock)}
    </article>
  );
}

function FactList({ facts, columns }: { facts: Fact[]; columns?: boolean }) {
  return (
    <ul className={columns ? 'profile-view__facts profile-view__facts--columns' : 'profile-view__facts'} role="list">
      {facts.map((f) => (
        <li key={f.key}>
          <Icon name={f.icon} size={20} />
          <span>{f.label}</span>
        </li>
      ))}
    </ul>
  );
}
