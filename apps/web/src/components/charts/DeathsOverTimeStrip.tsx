import type { RunEvent } from '@nuzlocke/engine';

interface DeathMarker {
  seq: number;
  species?: string;
  nickname?: string;
  position: number; // 0..1 along the run's event sequence
}

/** Hand-rolled horizontal timeline: a tick per faint, positioned by event order across the run. */
export function DeathsOverTimeStrip({ events }: { events: RunEvent[] }) {
  const totalEvents = events.length;
  const faints = events.filter((ev): ev is Extract<RunEvent, { type: 'faint' }> => ev.type === 'faint');

  if (totalEvents === 0 || faints.length === 0) {
    return (
      <div className="chart-block">
        <svg viewBox="0 0 300 40" className="chart-svg chart-svg-wide" role="img" aria-label="No deaths yet">
          <line x1="6" y1="20" x2="294" y2="20" stroke="var(--border)" strokeWidth="2" />
        </svg>
        <p className="muted chart-caption">No deaths yet.</p>
      </div>
    );
  }

  const lastSeq = events[totalEvents - 1].seq || totalEvents - 1;
  const markers: DeathMarker[] = faints.map((ev) => ({
    seq: ev.seq,
    position: lastSeq > 0 ? ev.seq / lastSeq : 0.5,
  }));

  const trackX0 = 6;
  const trackX1 = 294;
  const trackWidth = trackX1 - trackX0;

  return (
    <div className="chart-block">
      <svg viewBox="0 0 300 40" className="chart-svg chart-svg-wide" role="img" aria-label="Deaths over time">
        <line x1={trackX0} y1="20" x2={trackX1} y2="20" stroke="var(--border)" strokeWidth="2" />
        {markers.map((m, i) => {
          const x = trackX0 + Math.min(Math.max(m.position, 0), 1) * trackWidth;
          return (
            <g key={`${m.seq}-${i}`}>
              <line x1={x} y1="8" x2={x} y2="32" stroke="var(--danger)" strokeWidth="2" />
              <circle cx={x} cy="20" r="4" fill="var(--danger)" />
            </g>
          );
        })}
      </svg>
      <p className="muted chart-caption">
        {faints.length} death{faints.length === 1 ? '' : 's'} across {totalEvents} logged event
        {totalEvents === 1 ? '' : 's'}.
      </p>
    </div>
  );
}
