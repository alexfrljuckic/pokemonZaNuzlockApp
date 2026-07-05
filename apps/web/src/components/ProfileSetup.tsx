import { useEffect, useState } from 'react';
import type { Session } from '@supabase/supabase-js';
import { SYNC_ENABLED } from '../lib/env';
import { HANDLE_RE, claimProfile, getMyProfile, type Profile } from '../lib/profiles';

/** One-line profile chip under the auth bar: claim a handle once, then a
 * permanent link to your public page. Renders nothing when sync is off or
 * the user is signed out — profiles are a sync-tier feature. */
export function ProfileSetup({ session }: { session: Session | null }) {
  const [profile, setProfile] = useState<Profile | null>(null);
  const [open, setOpen] = useState(false);
  const [handle, setHandle] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    let cancelled = false;
    setLoaded(false);
    setProfile(null);
    if (!session || !SYNC_ENABLED) return;
    getMyProfile(session.user.id).then((p) => {
      if (!cancelled) {
        setProfile(p);
        setLoaded(true);
      }
    });
    return () => {
      cancelled = true;
    };
  }, [session]);

  if (!SYNC_ENABLED || !session || !loaded) return null;

  if (profile) {
    return (
      <p className="muted profile-chip">
        Public profile:{' '}
        <a href={`#u/${profile.handle}`}>@{profile.handle}</a>
      </p>
    );
  }

  async function claim() {
    if (!session) return;
    setBusy(true);
    setError(null);
    try {
      const err = await claimProfile(session.user.id, handle.trim().toLowerCase(), displayName);
      if (err) setError(err);
      else setProfile(await getMyProfile(session.user.id));
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="profile-chip">
      {!open ? (
        <button className="secondary" onClick={() => setOpen(true)}>
          Set up a public profile
        </button>
      ) : (
        <div className="profile-claim">
          <input
            type="text"
            placeholder="handle (a–z, 0–9, -)"
            value={handle}
            onChange={(e) => setHandle(e.target.value)}
            aria-label="Handle"
          />
          <input
            type="text"
            placeholder="display name (optional)"
            value={displayName}
            onChange={(e) => setDisplayName(e.target.value)}
            aria-label="Display name"
          />
          <button disabled={busy || !HANDLE_RE.test(handle.trim().toLowerCase())} onClick={claim}>
            {busy ? 'Claiming…' : 'Claim'}
          </button>
          {error && <span className="muted profile-error">{error}</span>}
        </div>
      )}
    </div>
  );
}
