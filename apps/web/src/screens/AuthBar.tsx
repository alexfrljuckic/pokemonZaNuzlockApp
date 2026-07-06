import { useState } from 'react';
import { useAuth } from '../lib/useAuth';
import { OAUTH_PROVIDERS, type OAuthProvider } from '../lib/env';

const PROVIDER_LABEL: Record<OAuthProvider, string> = {
  google: 'Google',
  discord: 'Discord',
};

export function AuthBar() {
  const { session, loading, available, signInWithProvider, signOut } = useAuth();
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

  // Signed out with no OAuth providers configured (VITE_OAUTH_PROVIDERS unset):
  // nothing to render. Sign-in is OAuth-only now (magic-link email was removed —
  // Supabase's built-in email rate limit is too low for real use), so the env
  // var is required for any sign-in; production sets it. See docs/OAUTH-SETUP.md.
  if (OAUTH_PROVIDERS.length === 0) return null;

  async function handleProvider(provider: OAuthProvider) {
    setError(null);
    // On success this redirects the browser away, so there's nothing to await
    // for the happy path; only an error (e.g. provider not enabled) returns here.
    const { error: oauthError } = await signInWithProvider(provider);
    if (oauthError) setError(oauthError.message);
  }

  return (
    <div className="auth-bar auth-bar-stack">
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
      {error && (
        <span className="auth-error" role="alert">
          {error}
        </span>
      )}
    </div>
  );
}
