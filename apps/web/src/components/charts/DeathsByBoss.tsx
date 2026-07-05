import type { EngineContext, RunEvent } from '@nuzlocke/engine';

/** Bar per boss that has killed at least one team member (faint events carry
 * an optional milestoneId). Battles outside milestones group under "wild /
 * other". Renders nothing when there are no deaths at all. */
export function DeathsByBoss({ events, ctx }: { events: RunEvent[]; ctx: EngineContext }) {
  const faints = events.filter((ev): ev is Extract<RunEvent, { type: 'faint' }> => ev.type === 'faint');
  if (faints.length === 0) return <p className="muted chart-caption">No deaths yet.</p>;

  const counts = new Map<string, number>();
  for (const f of faints) {
    const key = f.payload.milestoneId ?? 'wild-other';
    counts.set(key, (counts.get(key) ?? 0) + 1);
  }
  const rows = [...counts.entries()]
    .map(([id, n]) => ({
      id,
      name: id === 'wild-other' ? 'Wild / other' : ctx.dataset.milestones.find((m) => m.id === id)?.name ?? id,
      n,
    }))
    .sort((a, b) => b.n - a.n);
  const max = rows[0].n;

  return (
    <div className="chart-block deaths-by-boss">
      {rows.map((r) => (
        <div key={r.id} className="dbb-row">
          <span className="dbb-name">{r.name}</span>
          <span className="dbb-bar-track">
            <span className="dbb-bar" style={{ width: `${(r.n / max) * 100}%` }} />
          </span>
          <span className="dbb-count">{r.n}</span>
        </div>
      ))}
    </div>
  );
}
