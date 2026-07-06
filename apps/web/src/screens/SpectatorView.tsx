import { useEffect, useMemo, useState } from 'react';
import {
  boxed,
  chosenStarter,
  deriveState,
  fallen,
  milestoneRoster,
  milestonesFor,
  nextBoss,
  party,
  pendingWipeDecision,
  type RunEvent,
} from '@nuzlocke/engine';
import { DATASETS, speciesToLine } from '../lib/datasets';
import { fetchSharedRun, subscribeToRunChanges, type SharedRun } from '../lib/shareLinks';
import { MilestoneCard } from '../components/MilestoneCard';
import { MonCard } from '../components/MonCard';
import { RunSummaryStrip } from '../components/RunSummaryStrip';
import { RunTimeline } from '../components/RunTimeline';
import { StatsTab } from './tabs/StatsTab';

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

  const gameId = ctx.dataset.gameId;
  const events = shared.events as RunEvent[];
  const team = party(state);
  const box = boxed(state);
  const graveyard = fallen(state);
  const milestones = milestonesFor(ctx.dataset, state.version, state.ruleset).sort((a, b) => a.order - b.order);
  const clearedCount = milestones.filter((m) => state.milestonesCleared.includes(m.id)).length;
  const boss = nextBoss(state, ctx);
  const starter = chosenStarter(state);
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

      <RunSummaryStrip events={events} state={state} ctx={ctx} />

      <section>
        <h2>Team ({team.length}/6)</h2>
        {team.length === 0 && <p className="muted">No party members.</p>}
        <div className="mon-grid">
          {team.map((p) => (
            <MonCard key={p.id} p={p} gameId={gameId} />
          ))}
        </div>
      </section>

      <section>
        <h2>Box ({box.length})</h2>
        {box.length === 0 && <p className="muted">Empty.</p>}
        <div className="mon-grid">
          {box.map((p) => (
            <MonCard key={p.id} p={p} gameId={gameId} />
          ))}
        </div>
      </section>

      <section>
        <h2>Graveyard ({graveyard.length})</h2>
        {graveyard.length === 0 && <p className="muted">No losses yet.</p>}
        <div className="mon-grid">
          {graveyard.map((p) => (
            <MonCard key={p.id} p={p} gameId={gameId} />
          ))}
        </div>
      </section>

      <section>
        <h2>
          Boss fights ({clearedCount}/{milestones.length} defeated)
        </h2>
        <div className="milestone-card-grid">
          {milestones.map((m) => (
            <MilestoneCard
              key={m.id}
              milestone={m}
              roster={milestoneRoster(m, starter) ?? []}
              cleared={state.milestonesCleared.includes(m.id)}
              isNext={boss?.id === m.id}
              isPinnedNext={state.nextBossId === m.id}
            />
          ))}
        </div>
      </section>

      {state.ruleset.houseRules.length > 0 && (
        <section>
          <h2>House rules</h2>
          <ul>
            {state.ruleset.houseRules.map((hr, i) => (
              <li key={i}>{hr}</li>
            ))}
          </ul>
        </section>
      )}

      <StatsTab events={events} state={state} ctx={ctx} />

      <section>
        <h2>Timeline</h2>
        <RunTimeline events={events} ctx={ctx} pokemon={state.pokemon} />
      </section>
    </>
  );
}
