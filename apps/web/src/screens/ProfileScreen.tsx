import { useEffect, useState } from 'react';
import { GAMES } from '../games';
import { useAuth } from '../lib/useAuth';
import {
  fetchProfile,
  follow,
  isFollowing,
  unfollow,
  type PublicProfile,
} from '../lib/profiles';

const gameName = (gameId: string) =>
  GAMES.find((g) => g.dataset.gameId === gameId)?.dataset.name.replace(/^Pokémon\s+/, '') ?? gameId;

/** Public profile page (#u/<handle>): display name, @handle, and one card per
 * EXPLICITLY SHARED run linking into the spectator view. Anonymous-safe —
 * the follow button appears only for signed-in non-owners. */
export function ProfileScreen({ handle }: { handle: string }) {
  const [profile, setProfile] = useState<PublicProfile | null | 'loading'>('loading');
  const [following, setFollowing] = useState(false);
  const [busy, setBusy] = useState(false);
  const { session } = useAuth();

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const p = await fetchProfile(handle);
      if (cancelled) return;
      setProfile(p);
      if (p && session && session.user.id !== p.userId) {
        setFollowing(await isFollowing(p.userId));
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [handle, session]);

  if (profile === 'loading') return <p className="muted">Loading profile…</p>;
  if (!profile) {
    return (
      <section>
        <h2>Profile not found</h2>
        <p className="muted">No one has claimed @{handle}.</p>
      </section>
    );
  }

  const isSelf = session?.user.id === profile.userId;

  async function toggleFollow() {
    if (!session || profile === 'loading' || !profile) return;
    setBusy(true);
    try {
      if (following) await unfollow(profile.userId);
      else await follow(session.user.id, profile.userId);
      setFollowing(!following);
    } finally {
      setBusy(false);
    }
  }

  return (
    <section>
      <h2>{profile.displayName || `@${profile.handle}`}</h2>
      <p className="muted">
        @{profile.handle} · joined {new Date(profile.createdAt).toLocaleDateString()} · {profile.runs.length} shared
        run{profile.runs.length === 1 ? '' : 's'}
      </p>
      {session && !isSelf && (
        <button className={following ? 'secondary' : ''} disabled={busy} onClick={toggleFollow}>
          {busy ? '…' : following ? 'Unfollow' : 'Follow'}
        </button>
      )}
      {isSelf && <p className="muted">This is your public profile — only runs you share appear here.</p>}

      {profile.runs.length === 0 ? (
        <p className="muted">No shared runs yet.</p>
      ) : (
        profile.runs.map((r) => (
          <div key={r.token} className="run-list-item" onClick={() => (location.hash = `#share/${r.token}`)}>
            <span>
              {gameName(r.gameId)} · {r.version.replace(/-/g, ' ')}
            </span>
            <span className="muted">
              {r.eventCount} events · {new Date(r.createdAt).toLocaleDateString()}
            </span>
          </div>
        ))
      )}
    </section>
  );
}
