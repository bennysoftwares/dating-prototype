import { useId, useState, type FormEvent } from 'react';
import { Link } from 'react-router';
import { ACCOUNT_ROUTES, ONBOARDING_ROUTES } from '../../app/navigation';
import { TextField } from '../../components/form';
import { Button } from '../../components/ui';
import { isValidEmail, PASSWORD_MIN } from '../../repositories/local/authRepo';
import { useRepositories } from '../../repositories/RepositoryContext';
import { useSession } from '../../session/SessionProvider';
import { useBack } from '../onboarding/useStepNavigation';
import { AuthLayout, DemoNote, FormError } from './AuthLayout';
import { ProviderButtons } from './ProviderButtons';

/** Rough password strength for the meter: length and variety. Guidance, not a rule. */
export function passwordStrength(pw: string): { level: 0 | 1 | 2 | 3; label: string } {
  if (!pw) return { level: 0, label: '' };
  const variety = [/[a-z]/, /[A-Z]/, /\d/, /[^A-Za-z0-9]/].filter((r) => r.test(pw)).length;
  if (pw.length < PASSWORD_MIN) return { level: 1, label: 'Too short' };
  if (pw.length >= 12 && variety >= 3) return { level: 3, label: 'Strong' };
  return variety >= 2 ? { level: 2, label: 'Good' } : { level: 1, label: 'Add numbers or symbols' };
}

/**
 * Getting started, step 1: an account. Apple, Google or email. Everyone confirms they're
 * 18+ and accepts the Terms and Privacy Policy once, before any account is created.
 */
export function CreateAccountScreen() {
  const back = useBack();
  const { auth } = useRepositories();
  const { state, refresh } = useSession();
  const consentId = useId();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [reveal, setReveal] = useState(false);
  const [consent, setConsent] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<{ email?: string; password?: string; consent?: string }>({});
  const existing = state.status === 'ready' ? state.auth.account : null;
  const strength = passwordStrength(password);

  const run = async (fn: () => Promise<unknown>) => {
    setBusy(true);
    setError(null);
    try {
      await fn();
      // The session gate moves on: verify email, or straight to profile setup.
      await refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'That didn’t work. Try again.');
      setBusy(false);
    }
  };

  const needConsent = () => {
    if (consent) return false;
    setFieldErrors((f) => ({ ...f, consent: 'Please confirm to continue.' }));
    document.getElementById(consentId)?.focus();
    return true;
  };

  const submit = (e: FormEvent) => {
    e.preventDefault();
    const errs: typeof fieldErrors = {};
    if (!isValidEmail(email)) errs.email = 'Enter a valid email address.';
    if (password.length < PASSWORD_MIN) errs.password = `Use at least ${PASSWORD_MIN} characters.`;
    if (!consent) errs.consent = 'Please confirm to continue.';
    setFieldErrors(errs);
    if (Object.keys(errs).length) return;
    void run(() => auth.signUpWithEmail({ email, password, consent: { accepted: consent } }));
  };

  return (
    <AuthLayout
      title="Create your account"
      subtitle="Then we'll set up your profile together. It takes about five minutes."
      onBack={() => back(ONBOARDING_ROUTES.welcome)}
      footer={<p>Already have an account? <Link to={ACCOUNT_ROUTES.signIn} className="auth__link">Sign in</Link></p>}
    >
      {existing && (
        <div className="auth__notice" role="note">
          <strong>This device already has an account{existing.email ? ` (${existing.email})` : ''}.</strong>
          <span>Creating a new one replaces it, including its profile, likes and chats. <Link to={ACCOUNT_ROUTES.signIn} className="auth__link">Sign in instead</Link></span>
        </div>
      )}

      <label className={fieldErrors.consent ? 'auth__consent auth__consent--error' : 'auth__consent'}>
        <input
          id={consentId}
          type="checkbox"
          checked={consent}
          onChange={(e) => {
            setConsent(e.target.checked);
            setFieldErrors((f) => ({ ...f, consent: undefined }));
          }}
          aria-invalid={fieldErrors.consent ? true : undefined}
          aria-describedby={fieldErrors.consent ? `${consentId}-err` : undefined}
        />
        <span>
          I'm 18 or older and I agree to the <Link to={ACCOUNT_ROUTES.terms}>Terms</Link> and <Link to={ACCOUNT_ROUTES.privacy}>Privacy Policy</Link>.
          {fieldErrors.consent && <span id={`${consentId}-err`} className="visually-hidden">{fieldErrors.consent}</span>}
        </span>
      </label>

      <ProviderButtons verb="Continue" busy={busy} onSelect={(p) => { if (!needConsent()) void run(() => auth.continueWithProvider(p, { accepted: true })); }} />
      <DemoNote>Apple and Google sign-in are simulated. No account is contacted.</DemoNote>

      <p className="auth__divider">or with email</p>

      <form className="auth__form" onSubmit={submit} noValidate>
        <TextField id="signup-email" label="Email" type="email" inputMode="email" autoComplete="email" autoCapitalize="none" spellCheck={false} value={email} onChange={(v) => { setEmail(v); setFieldErrors((f) => ({ ...f, email: undefined })); }} error={fieldErrors.email} />
        <div className="auth__password">
          <TextField
            id="signup-password"
            label="Password"
            type={reveal ? 'text' : 'password'}
            autoComplete="new-password"
            value={password}
            onChange={(v) => { setPassword(v); setFieldErrors((f) => ({ ...f, password: undefined })); }}
            hint={`At least ${PASSWORD_MIN} characters.`}
            error={fieldErrors.password}
          />
          <button type="button" className="auth__reveal" onClick={() => setReveal((r) => !r)} aria-pressed={reveal}>
            {reveal ? 'Hide' : 'Show'}<span className="visually-hidden"> password</span>
          </button>
        </div>
        {password && (
          <div className="auth__strength" aria-live="polite">
            <div className="auth__strength-bar" aria-hidden="true">
              {[1, 2, 3].map((n) => <span key={n} className={strength.level >= n ? 'is-on' : undefined} />)}
            </div>
            <span>Password strength: {strength.label}</span>
          </div>
        )}
        <FormError message={error} />
        <Button type="submit" size="lg" block disabled={busy}>Create account</Button>
      </form>
    </AuthLayout>
  );
}
