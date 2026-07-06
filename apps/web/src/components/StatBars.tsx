import { STAT_ORDER, statLabel, statsFor } from '../lib/speciesData';

/** Colour tone for a base-stat value: low → red, okay → yellow, high → green.
 * Thresholds are the usual base-stat read (sub-60 is weak, 100+ is strong). */
function statTone(v: number): 'low' | 'mid' | 'high' {
  if (v < 60) return 'low';
  if (v < 100) return 'mid';
  return 'high';
}

/** Base-stat bar block for a species. The numeric value sits before the bar and
 * the fill is colour-graded by value. Renders nothing when the species has no
 * stat data. Shared by MilestoneCard and TrainersHere detail views. */
export function StatBars({ species }: { species: string }) {
  const st = statsFor(species);
  if (!st) return null;
  return (
    <div className="poke-statbars">
      {STAT_ORDER.map((k) => {
        const v = st[k] ?? 0;
        return (
          <div key={k} className="statbar">
            <span className="statbar-label">{statLabel(k)}</span>
            <span className="statbar-value">{v}</span>
            <span className="statbar-track">
              <span
                className={`statbar-fill tone-${statTone(v)}`}
                style={{ width: `${Math.min(100, (v / 200) * 100)}%` }}
              />
            </span>
          </div>
        );
      })}
    </div>
  );
}
