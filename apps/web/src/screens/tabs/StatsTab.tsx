import type { EngineContext, RunEvent, RunState } from '@nuzlocke/engine';

export function StatsTab({ events, state, ctx }: { events: RunEvent[]; state: RunState; ctx: EngineContext }) {
  const outcomes = { caught: 0, failed: 0, skipped: 0 };
  for (const ev of events) {
    if (ev.type === 'encounter_resolved') outcomes[ev.payload.outcome]++;
  }

  const deaths = Object.values(state.pokemon).filter((p) => p.status === 'dead');
  const revives = events.filter((ev) => ev.type === 'revive').length;
  const ruleChanges = state.ruleChanges.length;

  return (
    <section>
      <h2>Stats</h2>
      <p>
        Encounters — caught {outcomes.caught} · failed {outcomes.failed} · skipped {outcomes.skipped}
      </p>
      <p>
        Milestones cleared: {state.milestonesCleared.length}/{ctx.dataset.milestones.length}
      </p>
      <p>
        Wipes: {state.wipes.length} · Revives used: {revives} · Rule changes: {ruleChanges}
      </p>
      <p>Total events logged: {events.length}</p>

      <h2>Graveyard ({deaths.length})</h2>
      {deaths.length === 0 ? (
        <p className="muted">No deaths yet.</p>
      ) : (
        deaths.map((p) => (
          <div key={p.id} className="pokemon-card">
            <span>
              {p.nickname} <span className="muted">({p.species}, Lv {p.level})</span>
            </span>
            <span className="muted">
              {p.death?.cause ?? 'unknown cause'}
              {p.death?.killer ? ` — ${p.death.killer}` : ''}
            </span>
          </div>
        ))
      )}
    </section>
  );
}
