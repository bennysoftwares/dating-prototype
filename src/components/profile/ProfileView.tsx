import type { Profile } from '../../domain/types';
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
}

/**
 * The full vertical profile: photos interleaved with prompts and details,
 * closer to a considered Hinge profile than a single swipe card.
 * Used by the onboarding preview, Profile → Preview, and (Part 3) Discover.
 */
export function ProfileView({ profile: p, distanceLabel }: ProfileViewProps) {
  const [, photo2, photo3, ...morePhotos] = p.photos;
  const [prompt1, prompt2, prompt3] = p.prompts;
  const basics = basicFacts(p);
  const lifestyle = lifestyleFacts(p);
  const interests = interestLabels(p);
  const monogram = p.firstName.charAt(0);

  return (
    <article className="profile-view" aria-label={`${p.firstName}'s profile`}>
      <ProfileHeroCard profile={p} distanceLabel={distanceLabel} as="div" />

      {(basics.length > 0 || p.bio) && (
        <section className="profile-view__card" aria-label="About">
          {p.bio && <p className="profile-view__bio">{p.bio}</p>}
          {basics.length > 0 && <FactList facts={basics} />}
        </section>
      )}

      {prompt1 && <PromptCard prompt={prompt1} />}
      {photo2 && <PhotoFrame photo={photo2} ratio="4 / 5" rounded="xl" monogram={monogram} />}

      {interests.length > 0 && (
        <section className="profile-view__card" aria-label="Interests">
          <h3 className="profile-view__heading">Interests</h3>
          <ChipList label="Interests">
            {interests.map((label) => (
              <li key={label}><Chip>{label}</Chip></li>
            ))}
          </ChipList>
        </section>
      )}

      {prompt2 && <PromptCard prompt={prompt2} />}

      {lifestyle.length > 0 && (
        <section className="profile-view__card" aria-label="Lifestyle">
          <h3 className="profile-view__heading">Lifestyle</h3>
          <FactList facts={lifestyle} />
        </section>
      )}

      {photo3 && <PhotoFrame photo={photo3} ratio="4 / 5" rounded="xl" monogram={monogram} />}
      {prompt3 && <PromptCard prompt={prompt3} />}
      {morePhotos.map((photo) => (
        <PhotoFrame key={photo.id} photo={photo} ratio="4 / 5" rounded="xl" monogram={monogram} />
      ))}
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
