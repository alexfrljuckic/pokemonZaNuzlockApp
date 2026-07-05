import { useMemo } from 'react';
import { deriveState, nextBoss, party, type EngineContext, type RunEvent } from '@nuzlocke/engine';

interface Point {
  position: number; // 0..1 along the event sequence
  partyMax: number | null;
  cap: number | null;
}

/** (party max level, current cap) sampled at every event where either could
 * change, by replaying event-log prefixes. Pure — exported for tests.
 * O(n²) folds, fine at our log sizes (hundreds of cheap events). */
export function headroomSeries(events: RunEvent[], ctx: EngineContext): Point[] {
  const sorted = [...events].sort((a, b) => a.seq - b.seq);
  const relevant = new Set([
    'run_started',
    'encounter_resolved',
    'special_claimed',
    'level_up',
    'pokemon_updated',
    'pokemon_evolved',
    'pokemon_evolution_reverted',
    'moved',
    'faint',
    'revive',
    'milestone_cleared',
    'next_boss_set',
    'rule_changed',
  ]);
  const lastSeq = sorted.length > 0 ? sorted[sorted.length - 1].seq : 0;
  const points: Point[] = [];
  for (let i = 0; i < sorted.length; i++) {
    if (!relevant.has(sorted[i].type)) continue;
    const state = deriveState(sorted.slice(0, i + 1), ctx);
    const team = party(state);
    const boss = nextBoss(state, ctx);
    const point: Point = {
      position: lastSeq > 0 ? sorted[i].seq / lastSeq : 0,
      partyMax: team.length > 0 ? Math.max(...team.map((p) => p.level)) : null,
      cap: boss?.aceLevel ?? null,
    };
    const prev = points[points.length - 1];
    if (!prev || prev.partyMax !== point.partyMax || prev.cap !== point.cap) points.push(point);
  }
  return points;
}

/** Step-line chart: the cap ladder vs your strongest party member across the
 * run — headroom at a glance, red when the party is over the cap. */
export function LevelCapHeadroom({ events, ctx }: { events: RunEvent[]; ctx: EngineContext }) {
  const points = useMemo(() => headroomSeries(events, ctx), [events, ctx]);
  const usable = points.filter((p) => p.partyMax != null || p.cap != null);

  if (usable.length === 0) {
    return (
      <div className="chart-block">
        <p className="muted chart-caption">No party or cap data yet.</p>
      </div>
    );
  }

  const maxLevel = Math.max(10, ...usable.map((p) => Math.max(p.partyMax ?? 0, p.cap ?? 0)));
  const W = 300;
  const H = 80;
  const x = (pos: number) => 8 + pos * (W - 16);
  const y = (lvl: number) => H - 10 - (lvl / maxLevel) * (H - 22);

  // step-line paths (extend each value to the next point's x)
  const path = (get: (p: Point) => number | null) => {
    let d = '';
    let last: number | null = null;
    for (const p of usable) {
      const v = get(p);
      if (v == null) continue;
      if (last == null) d += `M ${x(p.position).toFixed(1)} ${y(v).toFixed(1)}`;
      else d += ` L ${x(p.position).toFixed(1)} ${y(last).toFixed(1)} L ${x(p.position).toFixed(1)} ${y(v).toFixed(1)}`;
      last = v;
    }
    if (last != null) d += ` L ${x(1).toFixed(1)} ${y(last).toFixed(1)}`;
    return d;
  };

  const latest = usable[usable.length - 1];
  const over = latest.partyMax != null && latest.cap != null && latest.partyMax > latest.cap;
  const headroom =
    latest.partyMax != null && latest.cap != null ? latest.cap - latest.partyMax : null;

  return (
    <div className="chart-block">
      <svg viewBox={`0 0 ${W} ${H}`} className="chart-svg chart-svg-wide" role="img" aria-label="Level cap headroom">
        <line x1="8" y1={H - 10} x2={W - 8} y2={H - 10} stroke="var(--border)" strokeWidth="1" />
        <path d={path((p) => p.cap)} fill="none" stroke="var(--highlight)" strokeWidth="2" />
        <path
          d={path((p) => p.partyMax)}
          fill="none"
          stroke={over ? 'var(--danger)' : 'var(--success)'}
          strokeWidth="2"
          strokeDasharray="4 3"
        />
      </svg>
      <p className="muted chart-caption">
        <span style={{ color: 'var(--highlight)' }}>—</span> cap ·{' '}
        <span style={{ color: over ? 'var(--danger)' : 'var(--success)' }}>- -</span> strongest party member
        {headroom != null &&
          (headroom >= 0 ? ` · ${headroom} level${headroom === 1 ? '' : 's'} of headroom` : ` · ${-headroom} OVER the cap`)}
        {latest.cap == null && ' · no cap-gating boss left'}
      </p>
    </div>
  );
}
