import type { Compatibility } from '../../recommendation';
import { Icon } from '../ui/Icon';
import './CompatibilitySection.css';

/**
 * Shared / Aligned / Different, in plain language. No scores or percentages.
 * Differences are presented neutrally.
 */
export function CompatibilitySection({ compatibility, name }: { compatibility: Compatibility; name: string }) {
  const { shared, aligned, different } = compatibility;
  if (!shared.length && !aligned.length && !different.length) return null;
  return (
    <section className="compat" aria-label={`You and ${name}`}>
      <h3 className="compat__title">You and {name}</h3>

      {shared.length > 0 && (
        <div className="compat__group">
          <h4 className="compat__label">Shared</h4>
          <ul className="compat__chips" role="list">
            {shared.map((s) => <li key={s} className="compat__chip compat__chip--shared">{s}</li>)}
          </ul>
        </div>
      )}

      {aligned.length > 0 && (
        <div className="compat__group">
          <h4 className="compat__label">Aligned</h4>
          <ul className="compat__list" role="list">
            {aligned.map((a) => (
              <li key={a}>
                <Icon name="check" size={18} />
                {a}
              </li>
            ))}
          </ul>
        </div>
      )}

      {different.length > 0 && (
        <div className="compat__group">
          <h4 className="compat__label">Different</h4>
          <ul className="compat__diffs" role="list">
            {different.map((d) => (
              <li key={d.topic}>
                <span className="compat__topic">{d.topic}</span>
                <span className="compat__pair">
                  <span><span className="visually-hidden">You: </span>{d.mine}</span>
                  <span aria-hidden="true" className="compat__slash">/</span>
                  <span><span className="visually-hidden">{name}: </span>{d.theirs}</span>
                </span>
              </li>
            ))}
          </ul>
          <p className="compat__note">Differences aren’t dealbreakers. They’re just worth talking about.</p>
        </div>
      )}
    </section>
  );
}
