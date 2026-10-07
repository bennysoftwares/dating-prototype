import { useState, type FormEvent } from 'react';
import { Link } from 'react-router';
import { ACCOUNT_ROUTES, ONBOARDING_ROUTES } from '../../app/navigation';
import { TextField } from '../../components/form';
import { Button } from '../../components/ui';
import { useRepositories } from '../../repositories/RepositoryContext';
import { useSession } from '../../session/SessionProvider';
import { useBack } from '../onboarding/useStepNavigation';
import { AuthLayout, DemoNote, FormError } from './AuthLayout';
import { ProviderButtons } from './ProviderButtons';

/** Sign back in. Everything stays on the device while signed out. */
export function SignInScreen() {
  const back = useBack();
  const { auth } = useRepositories();
  const { state, refresh } = useSession();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [reveal, setReveal] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const account = state.status === 'ready' ? state.auth.account : null;
  const onDevice = account && (account.method === 'demo' || account.method === 'device');

  const run = async (fn: () => Promise<unknown>) => {
    setBusy(true);
    setError(null);
    try {
      await fn();
      await refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'That didn’t work. Try again.');
      setBusy(false);
    }
  };

  const submit = (e: FormEvent) => {
    e.preventDefault();
    if (!email.trim() || !password) return setError('Enter your email and password.');
    void run(() => auth.signInWithEmail(email, password));
  };

  return (
    <AuthLayout
      title="Welcome back"
      subtitle="Sign in to pick up where you left off."
      onBack={() => back(ONBOARDING_ROUTES.welcome)}
      footer={<p>New to TurtleDoves? <Link to={ACCOUNT_ROUTES.create} className="auth__link">Create an account</Link></p>}
    >
      {onDevice && (
        <div className="auth__notice">
          <strong>{account.method === 'demo' ? 'The demo profile is on this device.' : 'Your profile is on this device.'}</strong>
          <Button variant="secondary" block onClick={() => void run(() => auth.resumeOnDevice())} disabled={busy}>
            Continue on this device
          </Button>
        </div>
      )}

      <form className="auth__form" onSubmit={submit} noValidate>
        <TextField id="signin-email" label="Email" type="email" inputMode="email" autoComplete="email" autoCapitalize="none" spellCheck={false} value={email} onChange={setEmail} />
        <div className="auth__password">
          <TextField id="signin-password" label="Password" type={reveal ? 'text' : 'password'} autoComplete="current-password" value={password} onChange={setPassword} />
          <button type="button" className="auth__reveal" onClick={() => setReveal((r) => !r)} aria-pressed={reveal}>
            {reveal ? 'Hide' : 'Show'}<span className="visually-hidden"> password</span>
          </button>
        </div>
        <Link to={ACCOUNT_ROUTES.forgot} className="auth__link">Forgot password?</Link>
        <FormError message={error} />
        <Button type="submit" size="lg" block disabled={busy}>Sign in</Button>
      </form>

      <p className="auth__divider">or</p>
      <ProviderButtons verb="Sign in" busy={busy} onSelect={(p) => void run(() => auth.continueWithProvider(p, { accepted: true }))} />
      <DemoNote>Accounts live on this device only. Apple and Google sign-in are simulated.</DemoNote>
    </AuthLayout>
  );
}
