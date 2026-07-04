import { fallen, milestonesFor, type EngineContext, type RunEvent, type RunState } from '@nuzlocke/engine';
import { DeathsOverTimeStrip } from '../../components/charts/DeathsOverTimeStrip';
import { EncounterOutcomeDonut } from '../../components/charts/EncounterOutcomeDonut';
import { MilestoneProgressBar } from '../../components/charts/MilestoneProgressBar';
import { SurvivalBySpeciesBars } from '../../components/charts/SurvivalBySpeciesBars';

export function StatsTab({ events, state, ctx }: { events: RunEvent[]; state: RunState; ctx: EngineContext }) {
  const outcomes = { caught: 0, failed: 0, skipped: 0 };
  for (const ev of events) {
    if (ev.type === 'encounter_resolved') outcomes[ev.payload.outcome]++;
  }

  const deaths = fallen(state);
  const revives = events.filter((ev) => ev.type === 'revive').length;
  const ruleChanges = state.ruleChanges.length;
  const milestonesTotal = ctx.dataset ? milestonesFor(ctx.dataset, state.version).length : 0;

  return (
    <section>
      <h2>Stats</h2>

      <h3 className="chart-heading">Encounter outcomes</h3>
      <EncounterOutcomeDonut outcomes={outcomes} />

      <h3 className="chart-heading">Deaths over time</h3>
      <DeathsOverTimeStrip events={events} />

      <h3 className="chart-heading">Survival by species</h3>
      <SurvivalBySpeciesBars pokemon={state.pokemon} />

      <h3 className="chart-heading">Boss fight progress</h3>
      <MilestoneProgressBar cleared={state.milestonesCleared.length} total={milestonesTotal} />

      <p className="muted">
        Wipes: {state.wipes.length} · Revives used: {revives} · Rule changes: {ruleChanges}
      </p>
      <p className="muted">Total events logged: {events.length}</p>

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
