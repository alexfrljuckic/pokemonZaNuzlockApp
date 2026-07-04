import { useEffect, useMemo, useState } from 'react';
import { deriveState, milestonesFor, pendingWipeDecision, RULES, type RunEvent } from '@nuzlocke/engine';
import { DATASETS, speciesToLine } from '../lib/datasets';
import { fetchSharedRun, subscribeToRunChanges, type SharedRun } from '../lib/shareLinks';

export function SpectatorView({ token }: { token: string }) {
  const [shared, setShared] = useState<SharedRun | null | 'loading'>('loading');

  async function refresh() {
    setShared(await fetchSharedRun(token));
  }

  useEffect(() => {
    refresh();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token]);

  useEffect(() => {
    if (shared === 'loading' || !shared) return;
    return subscribeToRunChanges(shared.runId, refresh);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [shared === 'loading' || !shared ? null : shared.runId]);

  if (shared === 'loading') {
    return <p className="muted">Loading…</p>;
  }
  if (!shared) {
    return (
      <section>
        <h2>Link not found</h2>
        <p className="muted">This share link is invalid or has been revoked by its owner.</p>
      </section>
    );
  }

  return <SpectatorRun shared={shared} />;
}

function SpectatorRun({ shared }: { shared: SharedRun }) {
  const ctx = useMemo(() => ({ dataset: DATASETS[shared.gameId], speciesToLine }), [shared.gameId]);
  const state = useMemo(
    () => (shared.events.length ? deriveState(shared.events as RunEvent[], ctx) : null),
    [shared.events, ctx],
  );

  if (!state || !ctx.dataset) {
    return <p className="muted">Unsupported or empty run.</p>;
  }

  const party = Object.values(state.pokemon).filter((p) => p.status === 'party');
  const box = Object.values(state.pokemon).filter((p) => p.status === 'box');
  const graveyard = Object.values(state.pokemon).filter((p) => p.status === 'dead');
  const versionMilestones = milestonesFor(ctx.dataset, state.version);
  const clearedMilestones = versionMilestones
    .filter((m) => state.milestonesCleared.includes(m.id))
    .sort((a, b) => a.order - b.order);
  const activeRules = Object.values(RULES).filter((r) => state.ruleset.rules[r.id]?.enabled);
  const showWipeScreen = pendingWipeDecision(state);

  return (
    <>
      <section>
        <h2>{ctx.dataset.name}</h2>
        <p className="muted">
          {shared.version} · preset {state.ruleset.presetId} ·{' '}
          <span className={`status-${state.status}`}>{state.status}</span> · <span className="muted">read-only</span>
        </p>
      </section>

      {showWipeScreen && (
        <section className="wipe-screen">
          <h2>Team wiped</h2>
          <p>Waiting on the owner to decide whether to continue or end this run.</p>
        </section>
      )}

      <section>
        <h2>Team ({party.length})</h2>
        {party.length === 0 && <p className="muted">No party members.</p>}
        {party.map((p) => (
          <div key={p.id} className="pokemon-card">
            <span>
              {p.nickname} <span className="muted">({p.species}, Lv {p.level})</span>
            </span>
          </div>
        ))}
      </section>

      <section>
        <h2>Box ({box.length})</h2>
        {box.length === 0 && <p className="muted">Empty.</p>}
        {box.map((p) => (
          <div key={p.id} className="pokemon-card">
            <span>
              {p.nickname} <span className="muted">({p.species}, Lv {p.level})</span>
            </span>
          </div>
        ))}
      </section>

      <section>
        <h2>Graveyard ({graveyard.length})</h2>
        {graveyard.length === 0 && <p className="muted">No losses yet.</p>}
        {graveyard.map((p) => (
          <div key={p.id} className="pokemon-card">
            <span>
              {p.nickname} <span className="muted">({p.species}, Lv {p.level})</span>
            </span>
            <span className="muted">
              {p.death?.cause ?? 'unknown cause'}
              {p.death?.killer ? ` — ${p.death.killer}` : ''}
            </span>
          </div>
        ))}
      </section>

      <section>
        <h2>Boss fights cleared ({clearedMilestones.length}/{versionMilestones.length})</h2>
        {clearedMilestones.length === 0 && <p className="muted">None yet.</p>}
        {clearedMilestones.map((m) => (
          <div key={m.id} className="milestone-row">
            <span>{m.name}</span>
            <span className="muted">cleared</span>
          </div>
        ))}
      </section>

      <section>
        <h2>Active rules</h2>
        {activeRules.map((r) => (
          <div key={r.id} className="rule-row">
            {r.name} <span className="muted">({r.enforcement})</span>
          </div>
        ))}
        {state.ruleset.houseRules.length > 0 && (
          <>
            <h3>House rules</h3>
            <ul>
              {state.ruleset.houseRules.map((hr, i) => (
                <li key={i}>{hr}</li>
              ))}
            </ul>
          </>
        )}
      </section>

      <section>
        <h2>Timeline ({shared.events.length} events)</h2>
        <div className="event-log">
          {[...shared.events]
            .sort((a, b) => b.seq - a.seq)
            .map((ev) => (
              <div key={ev.seq}>
                {ev.type} — {new Date(ev.at).toLocaleString()}
              </div>
            ))}
        </div>
      </section>
    </>
  );
}
