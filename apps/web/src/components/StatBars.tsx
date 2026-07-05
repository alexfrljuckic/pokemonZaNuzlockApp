import { STAT_ORDER, statLabel, statsFor } from '../lib/speciesData';

/** Base-stat bar block for a species. Renders nothing when the species has no
 * stat data. Shared by MilestoneCard and TrainersHere detail views. */
export function StatBars({ species }: { species: string }) {
  const st = statsFor(species);
  if (!st) return null;
  return (
    <div className="poke-statbars">
      {STAT_ORDER.map((k) => (
        <div key={k} className="statbar">
          <span className="statbar-label">{statLabel(k)}</span>
          <span className="statbar-track">
            <span className="statbar-fill" style={{ width: `${Math.min(100, (st[k] / 200) * 100)}%` }} />
          </span>
          <span className="statbar-value">{st[k]}</span>
        </div>
      ))}
    </div>
  );
}
