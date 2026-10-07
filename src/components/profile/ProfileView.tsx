import type { LikeTarget, Photo, Profile, PromptAnswer } from '../../domain/types';
import type { Compatibility } from '../../recommendation';
import { CompatibilitySection } from '../discovery/CompatibilitySection';
import { LikeButton } from '../discovery/LikeButton';
import { Chip, ChipList } from '../ui/Chip';
import { Icon } from '../ui/Icon';
import { PhotoFrame } from '../ui/PhotoFrame';
import { ProfileHeroCard } from './ProfileHeroCard';
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
 * Used by the onboarding preview, Profile → Preview, and (Part 3) Discover.
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
  const [prompt1, prompt2, prompt3] = p.prompts;
  const basics = basicFacts(p);
  const lifestyle = lifestyleFacts(p);
  const interests = interestLabels(p);

  return (
    <article className="profile-view" aria-label={`${p.firstName}'s profile`}>
      <ProfileHeroCard profile={p} distanceLabel={distanceLabel} as="div" action={photoLike(photo1)} />

      {(basics.length > 0 || p.bio) && (
        <section className="profile-view__card" aria-label="About">
          {p.bio && <p className="profile-view__bio">{p.bio}</p>}
          {basics.length > 0 && <FactList facts={basics} />}
        </section>
      )}

      {prompt1 && <PromptCard prompt={prompt1} action={promptLike(prompt1)} />}
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

      {prompt2 && <PromptCard prompt={prompt2} action={promptLike(prompt2)} />}

      {lifestyle.length > 0 && (
        <section className="profile-view__card" aria-label="Lifestyle">
          <h3 className="profile-view__heading">Lifestyle</h3>
          <FactList facts={lifestyle} />
        </section>
      )}

      {photo3 && photoBlock(photo3)}
      {compatibility && <CompatibilitySection compatibility={compatibility} name={p.firstName} />}
      {prompt3 && <PromptCard prompt={prompt3} action={promptLike(prompt3)} />}
      {morePhotos.map(photoBlock)}
    </article>
  );
}

function FactList({ facts }: { facts: Fact[] }) {
  return (
    <ul className="profile-view__facts" role="list">
      {facts.map((f) => (
        <li key={f.key}>
          <Icon name={f.icon} size={18} />
          <span>{f.label}</span>
        </li>
      ))}
    </ul>
  );
}
