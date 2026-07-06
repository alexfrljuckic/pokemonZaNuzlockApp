import { useState } from 'react';
import { useAuth } from '../lib/useAuth';
import { OAUTH_PROVIDERS, type OAuthProvider } from '../lib/env';

const PROVIDER_LABEL: Record<OAuthProvider, string> = {
  google: 'Google',
  discord: 'Discord',
};

export function AuthBar() {
  const { session, loading, available, signInWithEmail, signInWithProvider, signOut } = useAuth();
  const [email, setEmail] = useState('');
  const [sent, setSent] = useState(false);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!available || loading) return null;

  if (session) {
    const who = session.user.email ?? session.user.user_metadata?.name ?? 'your account';
    return (
      <p className="muted auth-bar">
        Signed in as {who} ·{' '}
        <button className="secondary" onClick={() => signOut()}>
          Sign out
        </button>
      </p>
    );
  }

  async function handleSignIn() {
    if (!email.trim()) return;
    setSending(true);
    setError(null);
    try {
      const { error: signInError } = await signInWithEmail(email.trim());
      if (signInError) {
        setError(signInError.message);
      } else {
        setSent(true);
      }
    } finally {
      setSending(false);
    }
  }

  async function handleProvider(provider: OAuthProvider) {
    setError(null);
    // On success this redirects the browser away, so there's nothing to await
    // for the happy path; only an error (e.g. provider not enabled) returns here.
    const { error: oauthError } = await signInWithProvider(provider);
    if (oauthError) setError(oauthError.message);
  }

  if (sent) {
    return <p className="muted auth-bar">Check {email} for a sign-in link.</p>;
  }

  return (
    <div className="auth-bar auth-bar-stack">
      {OAUTH_PROVIDERS.length > 0 && (
        <>
          <div className="auth-providers">
            {OAUTH_PROVIDERS.map((provider) => (
              <button
                key={provider}
                className="secondary auth-provider-btn"
                onClick={() => handleProvider(provider)}
              >
                Continue with {PROVIDER_LABEL[provider]}
              </button>
            ))}
          </div>
          <span className="auth-divider muted">or</span>
        </>
      )}
      <div className="auth-email-row">
        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="email for sync"
          aria-label="Email for sync"
        />
        <button className="secondary" onClick={handleSignIn} disabled={sending || !email.trim()}>
          {sending ? 'Sending…' : 'Send magic link'}
        </button>
      </div>
      {error && (
        <span className="auth-error" role="alert">
          {error}
        </span>
      )}
    </div>
  );
}
