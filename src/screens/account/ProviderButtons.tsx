interface ProviderButtonsProps {
  verb: 'Continue' | 'Sign in';
  busy: boolean;
  onSelect: (provider: 'apple' | 'google') => void;
}

/** Apple and Google sign-in. In the prototype they're simulated; a real auth SDK plugs in here. */
export function ProviderButtons({ verb, busy, onSelect }: ProviderButtonsProps) {
  return (
    <div className="auth__providers">
      <button type="button" className="auth__provider auth__provider--apple" onClick={() => onSelect('apple')} disabled={busy}>
        {verb} with Apple
      </button>
      <button type="button" className="auth__provider auth__provider--google" onClick={() => onSelect('google')} disabled={busy}>
        {verb} with Google
      </button>
    </div>
  );
}
