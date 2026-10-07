import { useCallback, useEffect, useRef, useState, type FormEvent } from 'react';
import { useNavigate } from 'react-router';
import { ACCOUNT_ROUTES } from '../../app/navigation';
import { Button } from '../../components/ui';
import { useRepositories } from '../../repositories/RepositoryContext';
import { useSession } from '../../session/SessionProvider';
import { AuthLayout, DemoNote, FormError } from './AuthLayout';

const RESEND_AFTER_S = 30;

/** Getting started, step 2: confirm the email address with a 6-digit code. */
export function VerifyEmailScreen() {
  const navigate = useNavigate();
  const { auth } = useRepositories();
  const { state, refresh } = useSession();
  const email = state.status === 'ready' ? state.auth.account?.email : undefined;
  const [code, setCode] = useState('');
  const [demoCode, setDemoCode] = useState<string | null>(null);
  const [cooldown, setCooldown] = useState(0);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [status, setStatus] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);
  const sent = useRef(false);

  const send = useCallback(async () => {
    setError(null);
    try {
      const res = await auth.sendVerificationCode();
      setDemoCode(res.demoCode);
      setCooldown(RESEND_AFTER_S);
      setStatus(`Code sent to ${res.sentTo}.`);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'We couldn’t send a code. Try again.');
    }
  }, [auth]);

  useEffect(() => {
    if (sent.current) return;
    sent.current = true;
    void send();
    inputRef.current?.focus();
  }, [send]);

  useEffect(() => {
    if (cooldown <= 0) return;
    const t = window.setTimeout(() => setCooldown((c) => c - 1), 1000);
    return () => window.clearTimeout(t);
  }, [cooldown]);

  const verify = async (value: string) => {
    setBusy(true);
    setError(null);
    try {
      await auth.verifyEmail(value);
      await refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'That didn’t work. Try again.');
      setBusy(false);
      inputRef.current?.select();
    }
  };

  const onChange = (raw: string) => {
    const digits = raw.replace(/\D/g, '').slice(0, 6);
    setCode(digits);
    setError(null);
    if (digits.length === 6 && !busy) void verify(digits);
  };

  const submit = (e: FormEvent) => {
    e.preventDefault();
    if (code.length === 6) void verify(code);
    else setError('Enter the 6-digit code.');
  };

  const changeEmail = async () => {
    await auth.signOut();
    await refresh();
    navigate(ACCOUNT_ROUTES.create);
  };

  return (
    <AuthLayout
      title="Check your email"
      subtitle={<>We sent a 6-digit code to <strong>{email}</strong>. Enter it to confirm it's you.</>}
      footer={<button type="button" className="auth__link" onClick={() => void changeEmail()}>Use a different email</button>}
    >
      <form className="auth__form" onSubmit={submit} noValidate>
        <label htmlFor="verify-code" className="field__label">Verification code</label>
        <input
          ref={inputRef}
          id="verify-code"
          className="auth__code"
          inputMode="numeric"
          autoComplete="one-time-code"
          pattern="[0-9]*"
          maxLength={6}
          value={code}
          onChange={(e) => onChange(e.target.value)}
          aria-invalid={error ? true : undefined}
          aria-describedby="verify-demo"
        />
        <FormError message={error} />
        <Button type="submit" size="lg" block disabled={busy || code.length < 6}>Confirm email</Button>
      </form>

      <div className="auth__row">
        <span className="visually-hidden" role="status">{status}</span>
        <Button variant="quiet" onClick={() => void send()} disabled={cooldown > 0}>
          {cooldown > 0 ? `Send a new code in ${cooldown}s` : 'Send a new code'}
        </Button>
      </div>

      <div id="verify-demo">
        <DemoNote>
          No email is sent in this demo. Your code is{' '}
          <span className="auth__code-hint">{demoCode ? `${demoCode.slice(0, 3)} ${demoCode.slice(3)}` : '…'}</span>
        </DemoNote>
      </div>
    </AuthLayout>
  );
}
