import { useEffect, useRef, useState } from 'react';
import { createShareToken, listShareTokens, revokeShareToken, type ShareToken } from '../lib/shareLinks';

/**
 * Share-link management, relocated from the old Share tab (UX overhaul
 * section D) into a small popover mounted in the run header. Caller is
 * responsible for only rendering this when signed in + sync is on — see
 * RunView.tsx, which gates it the same way the old Share tab was gated
 * (`SYNC_AVAILABLE && session`).
 */
export function SharePopover({ runId }: { runId: string }) {
  const [open, setOpen] = useState(false);
  const [tokens, setTokens] = useState<ShareToken[]>([]);
  const [creating, setCreating] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);

  async function refresh() {
    setTokens(await listShareTokens(runId));
  }

  useEffect(() => {
    if (open) refresh();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, runId]);

  useEffect(() => {
    if (!open) return;
    function onDocClick(e: MouseEvent) {
      if (rootRef.current && !rootRef.current.contains(e.target as Node)) setOpen(false);
    }
    function onKeyDown(e: KeyboardEvent) {
      if (e.key === 'Escape') setOpen(false);
    }
    document.addEventListener('mousedown', onDocClick);
    document.addEventListener('keydown', onKeyDown);
    return () => {
      document.removeEventListener('mousedown', onDocClick);
      document.removeEventListener('keydown', onKeyDown);
    };
  }, [open]);

  async function handleCreate() {
    setCreating(true);
    try {
      await createShareToken(runId);
      await refresh();
    } finally {
      setCreating(false);
    }
  }

  async function handleRevoke(token: string) {
    await revokeShareToken(token);
    await refresh();
  }

  const active = tokens.filter((t) => !t.revoked);
  const revokedCount = tokens.filter((t) => t.revoked).length;

  return (
    <div className="share-popover" ref={rootRef}>
      <button
        type="button"
        className="secondary share-popover-trigger"
        aria-expanded={open}
        aria-haspopup="dialog"
        onClick={() => setOpen((v) => !v)}
      >
        Share
      </button>

      {open && (
        <div className="share-popover-panel" role="dialog" aria-label="Share this run">
          <p className="muted share-popover-desc">
            A share link gives read-only access to this run's team, graveyard, milestones, rules, and
            timeline — no sign-in required to view. It updates live while you play. Never grants write access.
          </p>

          {active.length === 0 ? (
            <button onClick={handleCreate} disabled={creating}>
              {creating ? 'Creating…' : 'Create share link'}
            </button>
          ) : (
            active.map((t) => {
              const url = `${location.origin}${location.pathname}#share/${t.token}`;
              return (
                <div key={t.token} className="share-link-row">
                  <input type="text" readOnly value={url} onClick={(e) => e.currentTarget.select()} />
                  <button className="secondary" onClick={() => handleRevoke(t.token)}>
                    Revoke
                  </button>
                </div>
              );
            })
          )}

          {revokedCount > 0 && <p className="muted share-popover-revoked">{revokedCount} revoked link(s) — no longer work.</p>}
        </div>
      )}
    </div>
  );
}
