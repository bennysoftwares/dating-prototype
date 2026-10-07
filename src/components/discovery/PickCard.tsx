import { Link } from 'react-router';
import type { RankedCandidate } from '../../recommendation';
import { distanceLabel } from '../../utils/profileFormat';
import { ProfileHeroCard } from '../profile/ProfileHeroCard';
import { Icon } from '../ui/Icon';
import './PickCard.css';

/** One curated person in the list: lead photo, intention, and why they were picked. */
export function PickCard({ candidate, to }: { candidate: RankedCandidate; to: string }) {
  const { profile, reasons, distanceKm } = candidate;
  const highlights = reasons.filter((r) => !r.endsWith('km away')).slice(0, 2);
  const firstPrompt = profile.prompts[0];
  return (
    <article className="pick-card">
      <Link to={to} className="pick-card__link">
        <ProfileHeroCard profile={profile} distanceLabel={distanceLabel(profile, distanceKm)} as="div" ratio="5 / 6" />
        <div className="pick-card__body">
          {highlights.length > 0 && (
            <ul className="pick-card__reasons" role="list">
              {highlights.map((r) => (
                <li key={r}>
                  <Icon name="sparkle" size={16} />
                  {r}
                </li>
              ))}
            </ul>
          )}
          {firstPrompt && (
            <p className="pick-card__teaser">
              <span>{firstPrompt.prompt}</span> {firstPrompt.answer}
            </p>
          )}
          <span className="pick-card__cta">
            View profile <Icon name="chevronRight" size={18} />
          </span>
        </div>
      </Link>
    </article>
  );
}
