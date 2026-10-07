import type { ReactNode } from 'react';
import type { Profile } from '../../domain/types';
import { intentLabel, profileAge } from '../../utils/profileFormat';
import { Icon } from '../ui/Icon';
import { PhotoFrame } from '../ui/PhotoFrame';
import './ProfileHeroCard.css';

interface ProfileHeroCardProps {
  profile: Profile;
  /** Approximate distance label, e.g. "8 km away". */
  distanceLabel?: string;
  as?: 'div' | 'article';
  ratio?: string;
  /** e.g. a contextual like button for the lead photo. */
  action?: ReactNode;
}

/** Large lead photo with name, age and intention. Used on your own Profile tab. */
export function ProfileHeroCard({ profile, distanceLabel, as: Tag = 'article', ratio = '4 / 5', action }: ProfileHeroCardProps) {
  const age = profileAge(profile);
  return (
    <Tag className={action ? 'hero-card hero-card--has-action' : 'hero-card'} aria-label={`${profile.firstName}, ${age}`}>
      <PhotoFrame photo={profile.photos[0]} ratio={ratio} rounded="xl" monogram={profile.firstName.charAt(0)}>
        <div className="hero-card__scrim" />
        <div className="hero-card__info">
          <h2 className="hero-card__name">
            {profile.firstName}
            <span className="hero-card__age">{age}</span>
            {profile.verification?.photo === 'verified' && (
              <span className="hero-card__verified" title="Photo verified">
                <Icon name="verified" size={22} label="Photo verified" />
              </span>
            )}
          </h2>
          <p className="hero-card__meta">
            <Icon name="pin" size={16} />
            {profile.location.city}
            {distanceLabel && <span aria-hidden="true">·</span>}
            {distanceLabel}
          </p>
          <p className="hero-card__intent">
            <Icon name="sparkle" size={16} />
            {intentLabel(profile)}
          </p>
        </div>
        {action}
      </PhotoFrame>
    </Tag>
  );
}
