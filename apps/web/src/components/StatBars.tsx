import { natureEffect, type NatureStat } from '../lib/natures';
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
 * stat data. Shared by MilestoneCard and TrainersHere detail views.
 *
 * When a `nature` is supplied, the stat it raises gets a ↑ and the stat it
 * lowers a ↓ next to the label — neutral/undefined natures show no arrows. */
export function StatBars({ species, nature }: { species: string; nature?: string | null }) {
  const st = statsFor(species);
  if (!st) return null;
  const effect = natureEffect(nature);
  return (
    <div className="poke-statbars">
      {STAT_ORDER.map((k) => {
        const v = st[k] ?? 0;
        const arrow =
          k === effect.raised ? 'raised' : k === effect.lowered ? 'lowered' : null;
        return (
          <div key={k} className="statbar">
            <span className="statbar-label">
              {statLabel(k)}
              {arrow && (
                <span
                  className={`statbar-nature statbar-nature-${arrow}`}
                  title={natureArrowTitle(nature, k as NatureStat, arrow)}
                  aria-hidden="true"
                >
                  {arrow === 'raised' ? '▲' : '▼'}
                </span>
              )}
            </span>
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

/** Human-readable tooltip for a nature arrow, e.g. "Adamant nature: raises Atk". */
function natureArrowTitle(
  nature: string | null | undefined,
  stat: NatureStat,
  arrow: 'raised' | 'lowered',
): string {
  const name = nature ? nature.charAt(0).toUpperCase() + nature.slice(1) : 'Nature';
  return `${name} nature: ${arrow === 'raised' ? 'raises' : 'lowers'} ${statLabel(stat)}`;
}
