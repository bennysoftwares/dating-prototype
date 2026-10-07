import { useMemo } from 'react';
import { Card } from '../../components/ui';
import { rankCandidates, type RankedCandidate } from '../../recommendation';
import { localDb } from '../../repositories/local/localDb';
import { profileAge } from '../../utils/profileFormat';

type Status = string;

/**
 * Developer-only view of the recommendation engine: final score, every component,
 * soft preferences matched/missed, and every hard filter checked. Never shown to users.
 */
export function DebugRecommendations({ version }: { version: number }) {
  const result = useMemo(() => {
    void version;
    const user = localDb.user();
    const viewer = localDb.profiles().find((p) => p.id === user?.profileId);
    const prefs = localDb.preferences();
    if (!user || !viewer || !prefs || !user.onboardingComplete) return null;
    const matched = new Set(localDb.matches().flatMap((m) => m.userIds).filter((id) => id !== user.id));
    const ranking = rankCandidates(localDb.profiles(), viewer, prefs);
    const daily = localDb.dailyPicks();
    const likes = localDb.likes();
    const passes = localDb.passes();
    const statusOf = (r: RankedCandidate): Status => {
      if (matched.has(r.profile.userId)) return 'Matched (hidden from discovery)';
      if (likes.some((l) => l.toProfileId === r.profile.id)) return 'Liked';
      if (passes.some((p) => p.toProfileId === r.profile.id)) return 'Passed';
      if (!r.hard.passed) return 'Excluded by hard filter';
      const i = daily?.profileIds.indexOf(r.profile.id) ?? -1;
      return i >= 0 ? `Today's pick #${i + 1}` : 'Explore more';
    };
    return { ranking, statusOf, daily };
  }, [version]);

  if (!result) return <p className="debug__empty">Finish onboarding (or load the demo user) to inspect recommendations.</p>;
  const { ranking, statusOf, daily } = result;
  const rows = [...ranking.eligible, ...ranking.excluded];

  return (
    <Card padded={false}>
      <p className="debug__empty">
        {ranking.eligible.length} eligible · {ranking.excluded.length} excluded · daily set {daily ? `${daily.profileIds.length} on ${daily.date}` : 'not created yet'}
      </p>
      {rows.map((r) => (
        <details key={r.profile.id} className="debug__key debug__rec" data-testid={`rec-${r.profile.firstName}`}>
          <summary>
            <span className="debug__rec-name">
              <span>
                <strong>{r.profile.firstName}</strong>, {profileAge(r.profile)} · {r.distanceKm} km
              </span>
              <small>{statusOf(r)}</small>
            </span>
            <span className={r.hard.passed ? 'debug__score' : 'debug__score debug__score--out'}>{r.hard.passed ? r.score.total : 'out'}</span>
          </summary>
          <div className="debug__rec-body">
            <h4>Score breakdown · total {r.score.total}</h4>
            <table>
              <tbody>
                {r.score.components.map((c) => (
                  <tr key={c.id}>
                    <th scope="row">{c.label}</th>
                    <td>{c.points} / {c.max}</td>
                    <td>{c.detail}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            <h4>Soft preferences</h4>
            {r.score.softPreferences.length ? (
              <ul>{r.score.softPreferences.map((s) => <li key={s.label}>{s.outcome === 'matched' ? '✓' : s.outcome === 'missed' ? '✗' : '?'} {s.label}: {s.detail}</li>)}</ul>
            ) : <p>None set</p>}
            <h4>Hard filters checked</h4>
            <ul>
              {r.hard.checks.map((c) => (
                <li key={c.id} className={c.passed ? undefined : 'debug__fail'}>
                  {c.passed ? (c.applied ? '✓' : '–') : '✗'} {c.label}: {c.detail}
                </li>
              ))}
            </ul>
            <h4>User-facing reasons</h4>
            <ul>{r.reasons.map((x) => <li key={x}>{x}</li>)}</ul>
          </div>
        </details>
      ))}
    </Card>
  );
}
