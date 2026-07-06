import { useEffect, useState } from 'react';
import { aggregateRuns, deriveState, type CrossRunStats } from '@nuzlocke/engine';
import { DATASETS, speciesToLine } from '../lib/datasets';
import { loadEvents, type RunSummary } from '../lib/db';
import { SpriteImg } from '../components/SpriteImg';

/** Cross-run aggregates over every local run (backlog 33c). Local-first: reads
 * IndexedDB only — dozens of runs × hundreds of events derive in well under a
 * frame. Abandoned runs are counted in the overview but excluded from the
 * aggregates (Alex, 2026-07-05); wiped runs are included — a wipe is a real
 * finished run. Runs whose game has no dataset are skipped. */
export function CrossRunStatsScreen({ runs }: { runs: RunSummary[] }) {
  const [stats, setStats] = useState<CrossRunStats | null>(null);
  const [skipped, setSkipped] = useState(0);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const states = [];
      let unsupported = 0;
      for (const run of runs) {
        const dataset = DATASETS[run.gameId];
        if (!dataset) {
          unsupported++;
          continue;
        }
        const events = await loadEvents(run.id);
        if (events.length === 0) continue;
        states.push(deriveState(events, { dataset, speciesToLine }));
      }
      if (!cancelled) {
        setStats(aggregateRuns(states));
        setSkipped(unsupported);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [runs]);

  if (!stats) return <p className="muted">Crunching your runs…</p>;

  // finished = every run with a final outcome; wiped runs are real finished
  // runs (they count in aggregates too), only abandoned ones are discarded
  // from the aggregates below.
  const finished = stats.victories + stats.abandoned + stats.wiped;
  const winRate = finished > 0 ? Math.round((stats.victories / finished) * 100) : null;
  const topDeaths = Object.entries(stats.deathsBySpecies).sort((a, b) => b[1] - a[1]).slice(0, 10);
  const topUsed = Object.entries(stats.usedSpecies).sort((a, b) => b[1] - a[1]).slice(0, 10);
  const maxDeath = topDeaths[0]?.[1] ?? 1;
  const maxUsed = topUsed[0]?.[1] ?? 1;

  return (
    <section>
      <h2>Your stats</h2>
      <p className="muted">
        {stats.runs} run{stats.runs === 1 ? '' : 's'} · {stats.victories} victor
        {stats.victories === 1 ? 'y' : 'ies'} · {stats.active} active · {stats.wiped} wiped ·{' '}
        {stats.wipedContinuing} wiped-continuing · {stats.abandoned} abandoned
        {skipped > 0 ? ` · ${skipped} unsupported (skipped)` : ''}
      </p>
      <p className="muted">
        {winRate != null ? `Win rate ${winRate}% of finished runs · ` : ''}
        {stats.totalDeaths} death{stats.totalDeaths === 1 ? '' : 's'} across {stats.aggregated} counted run
        {stats.aggregated === 1 ? '' : 's'} (abandoned runs excluded)
      </p>
      {stats.catchRate != null && (
        <p className="muted">
          Catch rate {Math.round(stats.catchRate * 100)}% ({stats.encountersCaught}/{stats.encountersOffered} first-encounters
          caught)
        </p>
      )}

      {/* two chart columns on desktop, single stack on phones (.stats-grid) */}
      <div className="stats-grid">
        <div className="stats-cell">
          <h3 className="chart-heading">Deaths by species</h3>
          {topDeaths.length === 0 ? (
            <p className="muted chart-caption">No deaths yet. Long may it last.</p>
          ) : (
            <div className="deaths-by-boss">
              {topDeaths.map(([species, n]) => (
                <div key={species} className="dbb-row">
                  <span className="dbb-name">
                    <SpriteImg species={species} size={26} /> {species}
                  </span>
                  <span className="dbb-bar-track">
                    <span className="dbb-bar" style={{ width: `${(n / maxDeath) * 100}%` }} />
                  </span>
                  <span className="dbb-count">{n}</span>
                </div>
              ))}
            </div>
          )}
        </div>
        <div className="stats-cell">
          <h3 className="chart-heading">Most-used party species</h3>
          {topUsed.length === 0 ? (
            <p className="muted chart-caption">No party members yet.</p>
          ) : (
            <div className="deaths-by-boss">
              {topUsed.map(([species, n]) => (
                <div key={species} className="dbb-row">
                  <span className="dbb-name">
                    <SpriteImg species={species} size={26} /> {species}
                  </span>
                  <span className="dbb-bar-track">
                    <span className="dbb-bar dbb-bar-used" style={{ width: `${(n / maxUsed) * 100}%` }} />
                  </span>
                  <span className="dbb-count">{n}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
