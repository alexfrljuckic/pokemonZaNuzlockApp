import { formatDuration, runTiming, type EngineContext, type RunEvent } from '@nuzlocke/engine';

/** Elapsed wall-clock time for the run plus time-to-each-boss, derived purely
 * from event timestamps. Total = last usable timestamp − first (idle gaps are
 * not subtracted — we don't record session heartbeats). Sparse/missing
 * timestamps degrade to "—" rather than crash. Reuses the deaths-by-boss bar
 * atoms for the per-boss rows so it sits flush with the other Stats panels. */
export function RunTimePanel({ events, ctx }: { events: RunEvent[]; ctx: EngineContext }) {
  const timing = runTiming(events, ctx);

  const bossesWithTime = timing.bossTimings.filter((b) => b.elapsedMs != null);
  const maxBossMs = bossesWithTime.reduce((m, b) => Math.max(m, b.elapsedMs ?? 0), 0);

  return (
    <div className="chart-block">
      <p className="chart-run-duration">
        <span className="chart-run-duration-value">{formatDuration(timing.totalMs)}</span>
        <span className="muted"> total run time</span>
      </p>

      {timing.totalMs == null ? (
        <p className="muted chart-caption">
          {timing.timestampedEvents === 0
            ? 'No timestamps recorded for this run yet.'
            : 'Not enough timestamped events to measure duration yet.'}
        </p>
      ) : timing.bossTimings.length === 0 ? (
        <p className="muted chart-caption">No bosses cleared yet.</p>
      ) : (
        <div className="deaths-by-boss">
          {timing.bossTimings.map((b) => (
            <div key={b.milestoneId} className="dbb-row">
              <span className="dbb-name">{b.name}</span>
              <span className="dbb-bar-track">
                <span
                  className="dbb-bar dbb-bar-used"
                  style={{ width: b.elapsedMs != null && maxBossMs > 0 ? `${(b.elapsedMs / maxBossMs) * 100}%` : 0 }}
                />
              </span>
              <span className="dbb-count">{formatDuration(b.elapsedMs)}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
