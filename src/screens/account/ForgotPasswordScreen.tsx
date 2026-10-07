import { useState, type FormEvent } from 'react';
import { ACCOUNT_ROUTES } from '../../app/navigation';
import { TextField } from '../../components/form';
import { Button } from '../../components/ui';
import { isValidEmail } from '../../repositories/local/authRepo';
import { useRepositories } from '../../repositories/RepositoryContext';
import { useBack } from '../onboarding/useStepNavigation';
import { AuthLayout, DemoNote, FormError } from './AuthLayout';

/** Reset link request. Same answer whether or not the email has an account. */
export function ForgotPasswordScreen() {
  const back = useBack();
  const { auth } = useRepositories();
  const [email, setEmail] = useState('');
  const [sent, setSent] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    if (!isValidEmail(email)) return setError('Enter a valid email address.');
    setBusy(true);
    setError(null);
    await auth.requestPasswordReset(email);
    setBusy(false);
    setSent(true);
  };

  return (
    <AuthLayout title="Reset your password" subtitle="Enter the email you signed up with and we'll send you a link." onBack={() => back(ACCOUNT_ROUTES.signIn)}>
      {sent ? (
        <div className="auth__notice" role="status">
          <strong>Check your inbox</strong>
          <span>If there's an account for {email.trim()}, you'll get an email with a link to choose a new password.</span>
          <Button variant="secondary" onClick={() => back(ACCOUNT_ROUTES.signIn)}>Back to sign in</Button>
        </div>
      ) : (
        <form className="auth__form" onSubmit={(e) => void submit(e)} noValidate>
          <TextField id="reset-email" label="Email" type="email" inputMode="email" autoComplete="email" autoCapitalize="none" spellCheck={false} value={email} onChange={setEmail} />
          <FormError message={error} />
          <Button type="submit" size="lg" block disabled={busy}>Send reset link</Button>
        </form>
      )}
      <DemoNote>No email is sent in this demo. A real auth provider sends the reset link.</DemoNote>
    </AuthLayout>
  );
}
