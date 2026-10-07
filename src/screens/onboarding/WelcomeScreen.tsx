import { useNavigate } from 'react-router';
import { ONBOARDING_ROUTES } from '../../app/navigation';
import { Logo } from '../../components/brand/Logo';
import { Button } from '../../components/ui';
import { useOnboardingDraft } from '../../onboarding/useOnboardingDraft';
import { localDb } from '../../repositories/local/localDb';
import { useSession } from '../../session/SessionProvider';
import { getStep, STEPS } from './stepRegistry';
import './WelcomeScreen.css';

export function WelcomeScreen() {
  const navigate = useNavigate();
  const { refresh } = useSession();
  const { hasDraft, lastStepId } = useOnboardingDraft();
  const resumeStep = getStep(lastStepId);

  const start = () => navigate(ONBOARDING_ROUTES.step(STEPS[0]!.id));
  const resume = () => navigate(ONBOARDING_ROUTES.step(resumeStep?.id ?? STEPS[0]!.id));

  // Prototype convenience: skip onboarding with the preconfigured demo profile.
  // Once the session refreshes, the guest gate sends the now-onboarded user to Explore.
  const useDemo = async () => {
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
        {hasDraft ? (
          <>
            <Button size="lg" block onClick={resume}>Continue your profile</Button>
            <Button size="lg" variant="secondary" block onClick={start}>Start from the beginning</Button>
          </>
        ) : (
          <Button size="lg" block onClick={start}>Create your profile</Button>
        )}
        <Button variant="quiet" block onClick={() => void useDemo()}>Explore with the demo profile</Button>
        <p className="welcome__note">This is a demo. Everything you enter stays on this device.</p>
      </div>
    </main>
  );
}
