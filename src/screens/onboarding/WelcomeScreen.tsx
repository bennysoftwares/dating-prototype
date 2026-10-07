import { useNavigate } from 'react-router';
import { ACCOUNT_ROUTES } from '../../app/navigation';
import { Logo } from '../../components/brand/Logo';
import { Button } from '../../components/ui';
import { localDb } from '../../repositories/local/localDb';
import { useSession } from '../../session/SessionProvider';
import './WelcomeScreen.css';

export function WelcomeScreen() {
  const navigate = useNavigate();
  const { refresh } = useSession();

  // Prototype convenience: skip setup with the preconfigured demo profile.
  // Once the session refreshes, the gate sends the now-signed-in user to Explore.
  const openDemo = async () => {
    localDb.loadDemoUser();
    await refresh();
  };

  return (
    <main className="welcome">
      <div className="welcome__art" aria-hidden="true">
        <div className="welcome__card welcome__card--back" />
        <div className="welcome__card welcome__card--mid" />
        <div className="welcome__card welcome__card--front">
          <span className="welcome__card-prompt">My ideal first date…</span>
          <span className="welcome__card-answer">Coffee that turns into dinner.</span>
        </div>
      </div>

      <div className="welcome__content">
        <div className="welcome__brand">
          <Logo size={34} />
        </div>
        <h1 className="welcome__title">Meet someone worth staying for.</h1>
        <p className="welcome__body">
          Real photos, real profiles and clear intentions. Swipe through people near you, read what makes them them, and start a conversation that goes somewhere.
        </p>
      </div>

      <div className="welcome__actions">
        <Button size="lg" block onClick={() => navigate(ACCOUNT_ROUTES.create)}>Create account</Button>
        <Button size="lg" variant="secondary" block onClick={() => navigate(ACCOUNT_ROUTES.signIn)}>I already have an account</Button>
        <Button variant="quiet" block onClick={() => void openDemo()}>Explore with the demo profile</Button>
        <p className="welcome__note">This is a demo. Everything you enter stays on this device.</p>
      </div>
    </main>
  );
}
