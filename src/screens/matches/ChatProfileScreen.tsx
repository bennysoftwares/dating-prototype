import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router';
import { ROUTES } from '../../app/navigation';
import { ProfileView } from '../../components/profile/ProfileView';
import { SafetySheet } from '../../components/safety/SafetySheet';
import { Button, EmptyState, IconButton } from '../../components/ui';
import { useConnections } from '../../connections/ConnectionsProvider';
import { buildCompatibility } from '../../recommendation/compatibility';
import { approxDistanceKm, distanceLabel } from '../../utils/profileFormat';
import { useSticky } from '../../hooks/useSticky';
import { useBack } from '../onboarding/useStepNavigation';
import '../discover/DiscoverProfileScreen.css';

/** Your match's full profile, opened from the conversation. */
export function ChatProfileScreen() {
  const { matchId = '' } = useParams();
  const navigate = useNavigate();
  const back = useBack();
  const { viewer, getConversation } = useConnections();
  const [safetyOpen, setSafetyOpen] = useState(false);
  const convo = useSticky(getConversation(matchId), safetyOpen);

  useEffect(() => window.scrollTo({ top: 0, behavior: 'instant' as ScrollBehavior }), []);

  if (!convo || !viewer) {
    return (
      <div className="dprofile__missing">
        <EmptyState icon="chat" title="Profile not available" action={<Button onClick={() => navigate(ROUTES.matches)}>Back to matches</Button>} />
      </div>
    );
  }
  const { other } = convo;
  return (
    <div className="dprofile">
      <header className="dprofile__top">
        <IconButton icon="chevronLeft" label={`Back to chat with ${other.firstName}`} onClick={() => back(ROUTES.chat(matchId))} />
        <div className="dprofile__heading">
          <h1>{other.firstName}</h1>
          <p>Your match</p>
        </div>
        <IconButton icon="more" label={`More options for ${other.firstName}`} onClick={() => setSafetyOpen(true)} />
      </header>
      <main className="dprofile__body">
        <ProfileView profile={other} distanceLabel={distanceLabel(other, approxDistanceKm(viewer.location, other.location))} compatibility={buildCompatibility(viewer, other)} />
      </main>
      <SafetySheet person={other} matchId={matchId} open={safetyOpen} onClose={() => setSafetyOpen(false)} onDone={() => navigate(ROUTES.matches, { replace: true })} />
      <footer className="dprofile__actions">
        <Button size="lg" icon="chat" onClick={() => back(ROUTES.chat(matchId))} className="dprofile__like">
          Message {other.firstName}
        </Button>
      </footer>
    </div>
  );
}
