import { useNavigate } from 'react-router';
import { ONBOARDING_ROUTES } from '../../app/navigation';
import { Button, Icon, type IconName } from '../../components/ui';
import { clearOnboardingDraft, useOnboardingDraft } from '../../onboarding/useOnboardingDraft';
import { isValid, validators } from '../../onboarding/validation';
import { useRepositories } from '../../repositories/RepositoryContext';
import { useSession } from '../../session/SessionProvider';
import { AuthLayout } from '../account/AuthLayout';
import { SECTION_LABELS, STEPS } from './stepRegistry';
import './OnboardingIntroScreen.css';

const SECTION_INFO: Record<keyof typeof SECTION_LABELS, { icon: IconName; blurb: string }> = {
  basics: { icon: 'user', blurb: 'Name, age, gender and where you are.' },
  dating: { icon: 'heart', blurb: 'Who you want to meet and what you’re looking for.' },
  about: { icon: 'sprout', blurb: 'Work, lifestyle, family and languages.' },
  profile: { icon: 'camera', blurb: 'Interests, photos, prompts and a short bio.' },
};

/**
 * Getting started, step 3: what setting up a profile involves, before the first question.
 * Also where someone comes back to resume a half-finished profile.
 */
export function OnboardingIntroScreen() {
  const navigate = useNavigate();
  const { auth } = useRepositories();
  const { state, refresh } = useSession();
  const { draft, hasDraft } = useOnboardingDraft();
  const account = state.status === 'ready' ? state.auth.account : null;
  // Resume at the first required question still unanswered (or the preview when all are done).
  const resumeStep = STEPS.find((s) => !s.optional && !isValid(validators[s.id](draft)));
  const resumeIndex = resumeStep ? STEPS.indexOf(resumeStep) : STEPS.length;
  const started = hasDraft && resumeIndex > 0;

  const sections = (Object.keys(SECTION_LABELS) as (keyof typeof SECTION_LABELS)[]).map((id) => {
    const steps = STEPS.filter((s) => s.section === id);
    const done = started && steps.every((s) => s.optional || isValid(validators[s.id](draft)));
    return { id, steps: steps.length, done };
  });

  const start = () => navigate(ONBOARDING_ROUTES.step(STEPS[0]!.id));
  const resume = () => navigate(resumeStep ? ONBOARDING_ROUTES.step(resumeStep.id) : ONBOARDING_ROUTES.preview);
  const startOver = () => {
    clearOnboardingDraft();
    start();
  };
  const signOut = async () => {
    await auth.signOut();
    await refresh();
  };

  const who = account?.email ?? (account?.method === 'apple' ? 'Apple' : account?.method === 'google' ? 'Google' : 'this device');

  return (
    <AuthLayout
      title={started ? 'Welcome back' : "Let's set up your profile"}
      subtitle={started ? (resumeStep ? `You're on step ${resumeIndex + 1} of ${STEPS.length}. Everything so far is saved.` : 'All done. Check your profile and finish.') : 'About five minutes. You can stop any time; your answers are saved as you go.'}
      footer={<p>Signed in with {who}. <button type="button" className="auth__link" onClick={() => void signOut()}>Sign out</button></p>}
    >
      <ol className="intro__sections" role="list">
        {sections.map((s) => (
          <li key={s.id} className={s.done ? 'intro__section is-done' : 'intro__section'}>
            <span className="intro__icon" aria-hidden="true"><Icon name={s.done ? 'check' : SECTION_INFO[s.id].icon} size={22} /></span>
            <span className="intro__text">
              <span className="intro__name">{SECTION_LABELS[s.id]}{s.done && <span className="visually-hidden"> (done)</span>}</span>
              <span className="intro__blurb">{SECTION_INFO[s.id].blurb}</span>
            </span>
            <span className="intro__count">{s.steps} {s.steps === 1 ? 'step' : 'steps'}</span>
          </li>
        ))}
      </ol>

      <p className="intro__note">
        <Icon name="eye" size={18} />
        You choose what shows on your profile. Anything you hide is never shown to anyone.
      </p>

      <div className="intro__actions">
        {started ? (
          <>
            <Button size="lg" block onClick={resume}>Continue</Button>
            <Button variant="quiet" block onClick={startOver}>Start over</Button>
          </>
        ) : (
          <Button size="lg" block onClick={start}>Let's go</Button>
        )}
      </div>
    </AuthLayout>
  );
}
