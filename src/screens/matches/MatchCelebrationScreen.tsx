import { useEffect, useRef } from 'react';
import { useNavigate, useParams, useSearchParams } from 'react-router';
import { ROUTES } from '../../app/navigation';
import { Button, EmptyState, PhotoFrame } from '../../components/ui';
import { useConnections } from '../../connections/ConnectionsProvider';
import { describeContext } from '../../domain/matching';
import './MatchCelebrationScreen.css';

/** "It's mutual." Calm and warm: both photos, what each person liked, then straight to talking. */
export function MatchCelebrationScreen() {
  const { matchId = '' } = useParams();
  const [search] = useSearchParams();
  const navigate = useNavigate();
  const { status, viewer, getConversation } = useConnections();
  const convo = getConversation(matchId);
  const headingRef = useRef<HTMLHeadingElement>(null);

  useEffect(() => {
    headingRef.current?.focus({ preventScroll: true });
  }, [convo?.match.id]);

  const from = search.get('from');
  const keepBrowsing = () => navigate(from === 'likes' ? ROUTES.likes : ROUTES.discover, { replace: true });

  if (status === 'loading') return <div className="celebrate" aria-busy="true" />;
  if (!convo || !viewer) {
    return (
      <div className="celebrate">
        <EmptyState icon="chat" title="Match not found" action={<Button onClick={() => navigate(ROUTES.matches, { replace: true })}>Go to matches</Button>} />
      </div>
    );
  }

  const { other, match } = convo;
  const contexts = match.contexts ?? [];
  const theirComment = contexts.find((c) => c.fromUserId === other.userId && c.comment)?.comment;

  return (
    <div className="celebrate">
      <main className="celebrate__inner">
        <div className="celebrate__photos" aria-hidden="true">
          <div className="celebrate__photo celebrate__photo--me">
            <PhotoFrame photo={viewer.photos[0]} ratio="4 / 5" rounded="xl" monogram={viewer.firstName.charAt(0)} />
          </div>
          <div className="celebrate__photo celebrate__photo--them">
            <PhotoFrame photo={other.photos[0]} ratio="4 / 5" rounded="xl" monogram={other.firstName.charAt(0)} />
          </div>
        </div>

        <h1 ref={headingRef} tabIndex={-1} className="celebrate__title">It's mutual.</h1>
        <p className="celebrate__sub">You and {other.firstName} like each other.</p>

        {contexts.length > 0 && (
          <ul className="celebrate__context" role="list">
            {contexts.map((c) => (
              <li key={`${c.fromUserId}-${c.at}`}>{describeContext(c, viewer.userId, other.firstName)}</li>
            ))}
          </ul>
        )}
        {theirComment && (
          <p className="celebrate__comment">
            <span className="visually-hidden">{other.firstName} wrote: </span>“{theirComment}”
          </p>
        )}
      </main>

      <div className="celebrate__actions">
        <Button size="lg" icon="chat" block onClick={() => navigate(ROUTES.chat(match.id), { replace: true })}>
          Send a message
        </Button>
        <Button variant="quiet" block onClick={keepBrowsing}>
          Keep browsing
        </Button>
      </div>
    </div>
  );
}
