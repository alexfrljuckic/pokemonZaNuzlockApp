import { catchRateByArea, catchRateSummary, type EngineContext, type RunState } from '@nuzlocke/engine';

/** One bar per area whose first-encounter has been resolved: the green portion
 * is the catch (100% or 0% per area, since each area offers a single legal
 * encounter), the label shows the outcome, and a caption rolls up the whole
 * run's catch rate. Reuses the deaths-by-boss bar atoms for visual parity with
 * the neighbouring Stats panels. Renders nothing actionable until an area is
 * resolved. */
export function CatchRateByArea({ state, ctx }: { state: RunState; ctx: EngineContext }) {
  const rows = catchRateByArea(state, ctx);
  if (rows.length === 0) {
    return <p className="muted chart-caption">No encounters resolved yet.</p>;
  }
  const summary = catchRateSummary(rows);
  const pct = summary.catchRate != null ? Math.round(summary.catchRate * 100) : null;

  const outcomeLabel = (r: (typeof rows)[number]) =>
    r.caught ? 'caught' : r.failed ? 'lost' : 'skipped';

  return (
    <div className="chart-block">
      <div className="deaths-by-boss">
        {rows.map((r) => (
          <div key={r.areaId} className="dbb-row">
            <span className="dbb-name">{r.name}</span>
            <span className="dbb-bar-track">
              <span
                className="dbb-bar"
                style={{
                  width: '100%',
                  background: r.caught ? 'var(--success)' : r.failed ? 'var(--danger)' : 'var(--muted)',
                }}
              />
            </span>
            <span className="dbb-count">{outcomeLabel(r)}</span>
          </div>
        ))}
      </div>
      <p className="muted chart-caption">
        {summary.caught}/{summary.offered} caught
        {pct != null ? ` · ${pct}% catch rate` : ''}
        {summary.skipped > 0 ? ` · ${summary.skipped} skipped` : ''}
      </p>
    </div>
  );
}
