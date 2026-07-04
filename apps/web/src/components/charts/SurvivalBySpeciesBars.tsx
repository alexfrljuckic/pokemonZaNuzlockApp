import type { PokemonInstance } from '@nuzlocke/engine';

interface SpeciesTally {
  species: string;
  alive: number;
  dead: number;
}

/** Hand-rolled horizontal bar chart: alive vs. fainted count per species caught this run. */
export function SurvivalBySpeciesBars({ pokemon }: { pokemon: Record<string, PokemonInstance> }) {
  const bySpecies = new Map<string, SpeciesTally>();
  for (const p of Object.values(pokemon)) {
    const entry = bySpecies.get(p.species) ?? { species: p.species, alive: 0, dead: 0 };
    if (p.status === 'dead') entry.dead++;
    else entry.alive++;
    bySpecies.set(p.species, entry);
  }

  const rows = Array.from(bySpecies.values()).sort((a, b) => b.alive + b.dead - (a.alive + a.dead));

  if (rows.length === 0) {
    return (
      <div className="chart-block">
        <p className="muted chart-caption">No Pokémon caught yet.</p>
      </div>
    );
  }

  const maxTotal = Math.max(...rows.map((r) => r.alive + r.dead), 1);

  return (
    <div className="chart-block">
      <div className="chart-bars">
        {rows.map((r) => {
          const total = r.alive + r.dead;
          const aliveWidth = (r.alive / maxTotal) * 100;
          const deadWidth = (r.dead / maxTotal) * 100;
          return (
            <div key={r.species} className="chart-bar-row">
              <span className="chart-bar-label">{r.species}</span>
              <div className="chart-bar-track">
                {r.alive > 0 && (
                  <span
                    className="chart-bar-fill chart-bar-alive"
                    style={{ width: `${aliveWidth}%` }}
                    title={`${r.alive} alive`}
                  />
                )}
                {r.dead > 0 && (
                  <span
                    className="chart-bar-fill chart-bar-dead"
                    style={{ width: `${deadWidth}%` }}
                    title={`${r.dead} fainted`}
                  />
                )}
              </div>
              <span className="chart-bar-count muted">
                {r.alive} alive · {r.dead} fainted{total === 0 ? '' : ` (${total} total)`}
              </span>
            </div>
          );
        })}
      </div>
      <ul className="chart-legend">
        <li className="chart-legend-item">
          <span className="chart-swatch" style={{ background: 'var(--success)' }} aria-hidden="true" />
          Alive/active
        </li>
        <li className="chart-legend-item">
          <span className="chart-swatch" style={{ background: 'var(--danger)' }} aria-hidden="true" />
          Fainted
        </li>
      </ul>
    </div>
  );
}
