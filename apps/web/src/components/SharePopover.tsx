import { useEffect, useRef, useState } from 'react';
import { createShareToken, listShareTokens, revokeShareToken, type ShareToken } from '../lib/shareLinks';
import { usePopoverDialog } from './usePopoverDialog';

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
  const panelRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);

  async function refresh() {
    setTokens(await listShareTokens(runId));
  }

  useEffect(() => {
    if (open) refresh();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, runId]);

  // Dialog focus management (audit P2): shared popover behavior — outside
  // click / Escape close, focus in, Tab trapped, focus restored on close.
  usePopoverDialog(open, () => setOpen(false), { root: rootRef, panel: panelRef, trigger: triggerRef });

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
        ref={triggerRef}
        type="button"
        className="secondary share-popover-trigger"
        aria-expanded={open}
        aria-haspopup="dialog"
        onClick={() => setOpen((v) => !v)}
      >
        Share
      </button>

      {open && (
        <div ref={panelRef} className="share-popover-panel" role="dialog" aria-modal="true" aria-label="Share this run">
          <p className="muted share-popover-desc">
            A share link gives read-only access to this run's team, graveyard, milestones, rules, and
            timeline — no sign-in required to view. It updates live while you play. Never grants write access.
          </p>

          {active.length === 0 ? (
            <button onClick={handleCreate} disabled={creating}>
              {creating ? 'Creating…' : 'Create share link'}
            </button>
          ) : (
            active.map((t) => (
              <ShareLinkRow
                key={t.token}
                url={`${location.origin}${location.pathname}#share/${t.token}`}
                onRevoke={() => handleRevoke(t.token)}
              />
            ))
          )}

          {revokedCount > 0 && <p className="muted share-popover-revoked">{revokedCount} revoked link(s) — no longer work.</p>}
        </div>
      )}
    </div>
  );
}

/** One active share link: the (selectable) URL, a copy-to-clipboard button with
 * transient "Copied!" feedback, and revoke. */
function ShareLinkRow({ url, onRevoke }: { url: string; onRevoke: () => void }) {
  const [copied, setCopied] = useState(false);

  async function copy() {
    try {
      await navigator.clipboard.writeText(url);
    } catch {
      // Fallback for non-secure contexts / browsers without the async Clipboard
      // API: copy via a throwaway textarea. The input stays selectable either way.
      const ta = document.createElement('textarea');
      ta.value = url;
      ta.style.position = 'fixed';
      ta.style.opacity = '0';
      document.body.appendChild(ta);
      ta.select();
      try {
        document.execCommand('copy');
      } catch {
        /* give up silently — the user can still select the field and copy manually */
      }
      document.body.removeChild(ta);
    }
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  }

  return (
    <div className="share-link-row">
      <input type="text" readOnly value={url} onClick={(e) => e.currentTarget.select()} />
      <button className="secondary share-copy-btn" onClick={copy} aria-label="Copy share link">
        {copied ? 'Copied!' : 'Copy'}
      </button>
      <button className="secondary" onClick={onRevoke}>
        Revoke
      </button>
    </div>
  );
}
