import { useState } from 'react';
import { useAuth } from '../lib/useAuth';

export function AuthBar() {
  const { session, loading, available, signInWithEmail, signOut } = useAuth();
  const [email, setEmail] = useState('');
  const [sent, setSent] = useState(false);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!available || loading) return null;

  if (session) {
    return (
      <p className="muted auth-bar">
        Signed in as {session.user.email} ·{' '}
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

  if (sent) {
    return <p className="muted auth-bar">Check {email} for a sign-in link.</p>;
  }

  return (
    <p className="muted auth-bar">
      <input type="text" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="email for sync" />
      <button className="secondary" onClick={handleSignIn} disabled={sending || !email.trim()}>
        {sending ? 'Sending…' : 'Send magic link'}
      </button>
      {error && <span className="auth-error"> {error}</span>}
    </p>
  );
}
