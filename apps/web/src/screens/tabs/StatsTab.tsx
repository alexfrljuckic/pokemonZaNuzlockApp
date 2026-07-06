import { milestonesFor, type EngineContext, type RunEvent, type RunState } from '@nuzlocke/engine';
import { DeathsByBoss } from '../../components/charts/DeathsByBoss';
import { DeathsOverTimeStrip } from '../../components/charts/DeathsOverTimeStrip';
import { LevelCapHeadroom } from '../../components/charts/LevelCapHeadroom';
import { EncounterOutcomeDonut } from '../../components/charts/EncounterOutcomeDonut';
import { MilestoneProgressBar } from '../../components/charts/MilestoneProgressBar';
import { SurvivalBySpeciesBars } from '../../components/charts/SurvivalBySpeciesBars';
import { CatchRateByArea } from '../../components/charts/CatchRateByArea';
import { RunTimePanel } from '../../components/charts/RunTimePanel';
import { RunTimeline } from '../../components/RunTimeline';

/** `timeline` is owner-only: SpectatorView composes StatsTab but renders its
 * own Timeline section, so it stays off there to avoid doubling up. */
export function StatsTab({
  events,
  state,
  ctx,
  timeline = false,
}: {
  events: RunEvent[];
  state: RunState;
  ctx: EngineContext;
  timeline?: boolean;
}) {
  const outcomes = { caught: 0, failed: 0, skipped: 0 };
  for (const ev of events) {
    if (ev.type === 'encounter_resolved') outcomes[ev.payload.outcome]++;
  }

  const revives = events.filter((ev) => ev.type === 'revive').length;
  const ruleChanges = state.ruleChanges.length;
  const milestonesTotal = ctx.dataset ? milestonesFor(ctx.dataset, state.version, state.ruleset).length : 0;

  return (
    <section>
      <h2>Stats</h2>

      {/* each heading+chart pair is a cell so the desktop grid can reflow
          them side by side (single column on phones — see .stats-grid) */}
      <div className="stats-grid">
        <div className="stats-cell">
          <h3 className="chart-heading">Encounter outcomes</h3>
          <EncounterOutcomeDonut outcomes={outcomes} />
        </div>
        <div className="stats-cell">
          <h3 className="chart-heading">Deaths over time</h3>
          <DeathsOverTimeStrip events={events} />
        </div>
        <div className="stats-cell">
          <h3 className="chart-heading">Deaths by boss</h3>
          <DeathsByBoss events={events} ctx={ctx} />
        </div>
        <div className="stats-cell">
          <h3 className="chart-heading">Level-cap headroom</h3>
          <p className="muted chart-caption">
            How far your strongest party member sits below the next boss's level cap.
          </p>
          <LevelCapHeadroom events={events} ctx={ctx} />
        </div>
        <div className="stats-cell">
          <h3 className="chart-heading">Survival by species</h3>
          <SurvivalBySpeciesBars pokemon={state.pokemon} />
        </div>
        <div className="stats-cell">
          <h3 className="chart-heading">Boss fight progress</h3>
          <MilestoneProgressBar cleared={state.milestonesCleared.length} total={milestonesTotal} />
        </div>
        <div className="stats-cell">
          <h3 className="chart-heading">Catch rate by area</h3>
          <p className="muted chart-caption">
            Of the first-encounters you resolved per area, how many you caught vs lost or skipped.
          </p>
          <CatchRateByArea state={state} ctx={ctx} />
        </div>
        <div className="stats-cell">
          <h3 className="chart-heading">Time in run</h3>
          <p className="muted chart-caption">
            Elapsed wall-clock time and how long each boss took, from event timestamps.
          </p>
          <RunTimePanel events={events} ctx={ctx} />
        </div>
      </div>

      <p className="muted">
        Wipes: {state.wipes.length} · Revives used: {revives} · Rule changes: {ruleChanges}
      </p>
      <p className="muted">Total events logged: {events.length}</p>

      {timeline && (
        <>
          <h2>Timeline</h2>
          <RunTimeline events={events} ctx={ctx} pokemon={state.pokemon} />
        </>
      )}

    </section>
  );
}
