import { useEffect, useRef, useState } from 'react';
import type { Session } from '@supabase/supabase-js';
import { useAuth } from '../lib/useAuth';
import { usePopoverDialog } from '../components/usePopoverDialog';
import { THEME_CHANGE_EVENT, applyTheme, applyThemeExplicit, currentTheme, type ThemeId } from '../lib/theme';
import { THEMES } from '../games';
import { SYNC_ENABLED } from '../lib/env';
import {
  HANDLE_RE,
  claimProfile,
  deleteProfile,
  getMyProfile,
  updateProfile,
  type Profile,
} from '../lib/profiles';

/** Normalize what the user typed into a stored handle: no leading '@' (we show
 * it but don't store it), lowercase, trimmed. */
const sanitizeHandle = (raw: string) => raw.trim().toLowerCase().replace(/^@+/, '');

/* Inline gear glyph — no external request (CSP forbids remote assets). */
const GearIcon = () => (
  <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <circle cx="12" cy="12" r="3" />
    <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z" />
  </svg>
);

/** The gear menu: theme picker (always) plus account management — sign out and
 * public-profile setup/delete — when signed in. Consolidates what used to be
 * three loose top-of-page controls so the visible header stays uncluttered.
 * `session` is null on read-only sub-screens (spectator/profile), where only
 * the theme picker shows. */
export function SettingsMenu({ session }: { session: Session | null }) {
  const { signOut } = useAuth();
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  usePopoverDialog(open, () => setOpen(false), { root: rootRef, panel: panelRef, trigger: triggerRef });

  const [theme, setTheme] = useState<ThemeId>(currentTheme);
  useEffect(() => {
    // apply the stored theme once on load; reflect any later version-theme swap
    applyTheme(currentTheme());
    const onThemeChange = (e: Event) => setTheme((e as CustomEvent<ThemeId>).detail);
    window.addEventListener(THEME_CHANGE_EVENT, onThemeChange);
    return () => window.removeEventListener(THEME_CHANGE_EVENT, onThemeChange);
  }, []);

  const showAccount = !!session && SYNC_ENABLED;

  return (
    <div className="settings-menu" ref={rootRef}>
      <button
        ref={triggerRef}
        type="button"
        className="settings-cog"
        aria-label="Settings"
        aria-haspopup="dialog"
        aria-expanded={open}
        onClick={() => setOpen((v) => !v)}
      >
        <GearIcon />
      </button>

      {open && (
        <div ref={panelRef} className="settings-panel" role="dialog" aria-modal="true" aria-label="Settings">
          <label className="settings-row">
            <span className="settings-label">Theme</span>
            <select
              className="theme-select"
              value={theme}
              onChange={(e) => applyThemeExplicit(e.target.value as ThemeId)}
              aria-label="Color theme"
            >
              {THEMES.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.name}
                </option>
              ))}
            </select>
          </label>

          {showAccount && (
            <>
              <hr className="settings-sep" />
              <ProfileSection session={session} />
              <hr className="settings-sep" />
              <button type="button" className="secondary settings-signout" onClick={() => signOut()}>
                Sign out
              </button>
            </>
          )}
        </div>
      )}
    </div>
  );
}

/** Public-profile management inside the settings menu: claim a handle, edit the
 * handle / display name, or delete the profile. Owns its own fetch so the link,
 * edit form and delete action never drift out of sync. */
function ProfileSection({ session }: { session: Session }) {
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loaded, setLoaded] = useState(false);
  // The claim/edit form. `editing` is true while the form is shown for an
  // EXISTING profile (so we render Save/Cancel); a fresh claim always shows it.
  const [editing, setEditing] = useState(false);
  const [handle, setHandle] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [confirmingDelete, setConfirmingDelete] = useState(false);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    let cancelled = false;
    setLoaded(false);
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

  function startEdit() {
    if (!profile) return;
    setHandle(profile.handle);
    setDisplayName(profile.displayName);
    setError(null);
    setEditing(true);
  }

  async function save() {
    setBusy(true);
    setError(null);
    try {
      const clean = sanitizeHandle(handle);
      const err = profile
        ? await updateProfile(session.user.id, clean, displayName)
        : await claimProfile(session.user.id, clean, displayName);
      if (err) {
        setError(err);
      } else {
        setProfile(await getMyProfile(session.user.id));
        setEditing(false);
      }
    } finally {
      setBusy(false);
    }
  }

  async function handleDelete() {
    setDeleting(true);
    setError(null);
    const err = await deleteProfile(session.user.id);
    setDeleting(false);
    if (err) setError(err);
    else {
      setProfile(null);
      setConfirmingDelete(false);
    }
  }

  if (!loaded) return <p className="muted settings-note">Loading profile…</p>;

  // Form shown for a fresh claim (no profile) or when editing an existing one.
  const showForm = !profile || editing;
  const canSubmit = !busy && HANDLE_RE.test(sanitizeHandle(handle));

  return (
    <div className="settings-profile">
      <span className="settings-label">Public profile</span>

      {profile && !editing && (
        <>
          <div className="settings-profile-identity">
            {profile.displayName && <strong>{profile.displayName}</strong>}
            <a className="settings-profile-link" href={`#u/${profile.handle}`}>
              @{profile.handle}
            </a>
          </div>
          {!confirmingDelete ? (
            <span className="settings-confirm-actions">
              <button type="button" className="secondary" onClick={startEdit}>
                Edit
              </button>
              <button type="button" className="secondary link-danger" onClick={() => setConfirmingDelete(true)}>
                Delete
              </button>
            </span>
          ) : (
            <span className="settings-delete-confirm">
              <span className="muted">Delete @{profile.handle}? Your runs and account stay.</span>
              <span className="settings-confirm-actions">
                <button type="button" className="danger" disabled={deleting} onClick={handleDelete}>
                  {deleting ? 'Deleting…' : 'Delete'}
                </button>
                {/* autoFocus lands keyboard users on the SAFE choice */}
                <button type="button" className="secondary" autoFocus disabled={deleting} onClick={() => setConfirmingDelete(false)}>
                  Cancel
                </button>
              </span>
            </span>
          )}
        </>
      )}

      {showForm && (
        <div className="profile-claim">
          <p className="muted profile-field-help">
            Your <strong>handle</strong> is your unique @address — it’s your profile link and how
            people find you in search. Your <strong>display name</strong> is the friendly name shown
            to others; it doesn’t have to be unique.
          </p>
          <label className="profile-field">
            <span className="profile-field-label">Handle</span>
            <span className="handle-input">
              <span aria-hidden="true">@</span>
              <input
                type="text"
                placeholder="your-handle"
                value={handle}
                onChange={(e) => setHandle(e.target.value)}
                aria-label="Handle"
                autoComplete="off"
              />
            </span>
          </label>
          <label className="profile-field">
            <span className="profile-field-label">Display name</span>
            <input
              type="text"
              placeholder="optional"
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              aria-label="Display name"
            />
          </label>
          <span className="settings-confirm-actions">
            <button type="button" disabled={!canSubmit} onClick={save}>
              {busy ? 'Saving…' : profile ? 'Save' : 'Claim'}
            </button>
            {profile && (
              <button type="button" className="secondary" disabled={busy} onClick={() => setEditing(false)}>
                Cancel
              </button>
            )}
          </span>
        </div>
      )}
      {error && <span className="muted profile-error">{error}</span>}
    </div>
  );
}
