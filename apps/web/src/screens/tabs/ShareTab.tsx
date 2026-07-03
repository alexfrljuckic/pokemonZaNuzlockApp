import { useEffect, useState } from 'react';
import { createShareToken, listShareTokens, revokeShareToken, type ShareToken } from '../../lib/shareLinks';

export function ShareTab({ runId }: { runId: string }) {
  const [tokens, setTokens] = useState<ShareToken[]>([]);
  const [creating, setCreating] = useState(false);

  async function refresh() {
    setTokens(await listShareTokens(runId));
  }

  useEffect(() => {
    refresh();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [runId]);

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

  return (
    <section>
      <h2>Share</h2>
      <p className="muted">
        A share link gives read-only access to this run's team, graveyard, milestones, rules, and timeline —
        no sign-in required to view. It updates live while you play. Never grants write access.
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

      {tokens.some((t) => t.revoked) && (
        <p className="muted">{tokens.filter((t) => t.revoked).length} revoked link(s) — no longer work.</p>
      )}
    </section>
  );
}
