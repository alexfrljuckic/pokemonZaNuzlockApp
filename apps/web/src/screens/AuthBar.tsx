import { useRef, useState } from 'react';
import { useAuth } from '../lib/useAuth';
import { OAUTH_PROVIDERS, type OAuthProvider } from '../lib/env';
import { usePopoverDialog } from '../components/usePopoverDialog';

const PROVIDER_LABEL: Record<OAuthProvider, string> = {
  google: 'Google',
  discord: 'Discord',
};

/* Inline brand glyphs (standard sign-in-button marks; no external requests). */
const PROVIDER_ICON: Record<OAuthProvider, JSX.Element> = {
  google: (
    <svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true">
      <path
        fill="#4285F4"
        d="M23.5 12.27c0-.85-.08-1.67-.22-2.45H12v4.64h6.45a5.52 5.52 0 0 1-2.4 3.62v3h3.88c2.27-2.09 3.57-5.17 3.57-8.81z"
      />
      <path
        fill="#34A853"
        d="M12 24c3.24 0 5.96-1.07 7.94-2.91l-3.88-3.01c-1.07.72-2.45 1.15-4.06 1.15-3.13 0-5.78-2.11-6.72-4.95H1.28v3.11A12 12 0 0 0 12 24z"
      />
      <path
        fill="#FBBC05"
        d="M5.28 14.28a7.21 7.21 0 0 1 0-4.56V6.61H1.28a12 12 0 0 0 0 10.78l4-3.11z"
      />
      <path
        fill="#EA4335"
        d="M12 4.77c1.76 0 3.34.6 4.59 1.8l3.44-3.44C17.95 1.19 15.23 0 12 0A12 12 0 0 0 1.28 6.61l4 3.11C6.22 6.88 8.87 4.77 12 4.77z"
      />
    </svg>
  ),
  discord: (
    <svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true">
      <path
        fill="#5865F2"
        d="M20.32 4.37a19.8 19.8 0 0 0-4.89-1.52.07.07 0 0 0-.08.04c-.21.38-.44.87-.6 1.25a18.3 18.3 0 0 0-5.5 0 12.6 12.6 0 0 0-.61-1.25.07.07 0 0 0-.08-.04 19.7 19.7 0 0 0-4.88 1.52.06.06 0 0 0-.03.02C.53 9.05-.32 13.58.1 18.06c0 .02.01.04.03.05a19.9 19.9 0 0 0 6 3.03c.03.01.06 0 .07-.02.46-.63.87-1.3 1.22-2a.07.07 0 0 0-.04-.1 13.1 13.1 0 0 1-1.87-.9.07.07 0 0 1-.01-.11l.37-.29a.07.07 0 0 1 .07-.01c3.93 1.8 8.18 1.8 12.06 0a.07.07 0 0 1 .07 0l.37.3a.07.07 0 0 1 0 .11c-.6.35-1.22.65-1.88.9a.07.07 0 0 0-.04.1c.36.7.78 1.36 1.23 2 .01.02.04.03.07.02a19.8 19.8 0 0 0 6-3.03.07.07 0 0 0 .03-.05c.5-5.18-.84-9.68-3.55-13.66a.06.06 0 0 0-.03-.03zM8.02 15.33c-1.18 0-2.16-1.08-2.16-2.42 0-1.33.96-2.42 2.16-2.42 1.21 0 2.18 1.1 2.16 2.42 0 1.34-.96 2.42-2.16 2.42zm7.97 0c-1.18 0-2.15-1.08-2.15-2.42 0-1.33.95-2.42 2.15-2.42 1.22 0 2.18 1.1 2.16 2.42 0 1.34-.94 2.42-2.16 2.42z"
      />
    </svg>
  ),
};

const BENEFITS: { icon: JSX.Element; title: string; desc: string }[] = [
  {
    icon: (
      <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <path d="M21 12a9 9 0 0 1-15.6 6.2M3 12a9 9 0 0 1 15.6-6.2" />
        <path d="M21 3v6h-6M3 21v-6h6" />
      </svg>
    ),
    title: 'Sync across devices',
    desc: 'Log a catch on your phone, plan on your desktop — same run.',
  },
  {
    icon: (
      <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <path d="M10 13a5 5 0 0 0 7.5.5l3-3a5 5 0 0 0-7-7l-1.7 1.7" />
        <path d="M14 11a5 5 0 0 0-7.5-.5l-3 3a5 5 0 0 0 7 7l1.7-1.7" />
      </svg>
    ),
    title: 'Share your run live',
    desc: 'One link lets friends watch every catch and every loss as it happens.',
  },
  {
    icon: (
      <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
        <circle cx="9" cy="7" r="4" />
        <path d="M23 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75" />
      </svg>
    ),
    title: 'Follow other trainers',
    desc: 'A public profile for your shared runs, and a feed of your friends’ big moments.',
  },
];

export function AuthBar() {
  const { session, loading, available, signInWithProvider } = useAuth();
  const [error, setError] = useState<string | null>(null);
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  usePopoverDialog(open, () => setOpen(false), { root: rootRef, panel: panelRef, trigger: triggerRef });

  if (!available || loading) return null;

  if (session) {
    const who = session.user.email ?? session.user.user_metadata?.name ?? 'your account';
    // Sign out lives in the SettingsMenu cog now — keep this line pure status.
    return <p className="muted auth-bar">Signed in as {who}</p>;
  }

  // Sign-in is OAuth-only (magic-link email was removed — Supabase's built-in
  // email rate limit is too low for real use), so VITE_OAUTH_PROVIDERS is
  // required for any sign-in. If sync is configured but the var is missing,
  // say so instead of rendering nothing — a silent dead end here already cost
  // us a debugging session (UX-AUDIT NF-H1). See docs/OAUTH-SETUP.md.
  if (OAUTH_PROVIDERS.length === 0) {
    return (
      <p className="muted auth-bar">
        Sign-in is unavailable in this deployment (no sign-in providers configured). Your runs still work
        and stay on this device.
      </p>
    );
  }

  async function handleProvider(provider: OAuthProvider) {
    setError(null);
    // On success this redirects the browser away, so there's nothing to await
    // for the happy path; only an error (e.g. provider not enabled) returns here.
    const { error: oauthError } = await signInWithProvider(provider);
    if (oauthError) setError(oauthError.message);
  }

  // Zero page footprint (Alex): the pitch + provider buttons live in a
  // dialog popover behind one small trigger, on every screen size — the
  // panel just caps to the viewport width on phones.
  return (
    <div className="auth-popover" ref={rootRef}>
      <button
        ref={triggerRef}
        type="button"
        className="secondary auth-signin-trigger"
        aria-expanded={open}
        aria-haspopup="dialog"
        onClick={() => setOpen((v) => !v)}
      >
        Sign in
        <span className="auth-signin-hint">sync · share · follow</span>
      </button>

      {open && (
        <div ref={panelRef} className="auth-popover-panel" role="dialog" aria-modal="true" aria-label="Sign in">
          <h3 className="auth-card-title">Take your run everywhere</h3>
          <ul className="auth-benefits">
            {BENEFITS.map((b) => (
              <li key={b.title}>
                <span className="auth-benefit-icon">{b.icon}</span>
                <span>
                  <strong>{b.title}</strong>
                  <span className="muted auth-benefit-desc">{b.desc}</span>
                </span>
              </li>
            ))}
          </ul>
          <div className="auth-providers">
            {OAUTH_PROVIDERS.map((provider) => (
              <button
                key={provider}
                className="secondary auth-provider-btn"
                onClick={() => handleProvider(provider)}
              >
                {PROVIDER_ICON[provider]}
                Continue with {PROVIDER_LABEL[provider]}
              </button>
            ))}
          </div>
          <p className="muted auth-card-footnote">
            Free — and everything keeps working on this device without an account.
          </p>
          {error && (
            <span className="auth-error" role="alert">
              {error}
            </span>
          )}
        </div>
      )}
    </div>
  );
}
