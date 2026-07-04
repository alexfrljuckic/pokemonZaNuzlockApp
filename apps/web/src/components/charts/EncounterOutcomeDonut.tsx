const COLORS: Record<'caught' | 'failed' | 'skipped', string> = {
  caught: 'var(--success)',
  failed: 'var(--danger)',
  skipped: 'var(--muted)',
};

const LABELS: Record<'caught' | 'failed' | 'skipped', string> = {
  caught: 'Caught',
  failed: 'Failed',
  skipped: 'Skipped',
};

/** Hand-rolled SVG donut of encounter outcome proportions. Raw counts stay in the caption/legend. */
export function EncounterOutcomeDonut({
  outcomes,
}: {
  outcomes: { caught: number; failed: number; skipped: number };
}) {
  const total = outcomes.caught + outcomes.failed + outcomes.skipped;

  if (total === 0) {
    return (
      <div className="chart-block">
        <svg viewBox="0 0 100 100" className="chart-svg" role="img" aria-label="No encounters logged yet">
          <circle cx="50" cy="50" r="38" fill="none" stroke="var(--border)" strokeWidth="14" />
        </svg>
        <p className="muted chart-caption">No encounters logged yet.</p>
      </div>
    );
  }

  const radius = 38;
  const circumference = 2 * Math.PI * radius;
  const order: Array<'caught' | 'failed' | 'skipped'> = ['caught', 'failed', 'skipped'];

  let offsetAccum = 0;
  const segments = order.map((key) => {
    const value = outcomes[key];
    const fraction = value / total;
    const dash = fraction * circumference;
    const segment = {
      key,
      value,
      fraction,
      dashArray: `${dash} ${circumference - dash}`,
      dashOffset: -offsetAccum,
    };
    offsetAccum += dash;
    return segment;
  });

  return (
    <div className="chart-block">
      <svg viewBox="0 0 100 100" className="chart-svg" role="img" aria-label="Encounter outcomes donut chart">
        <circle cx="50" cy="50" r={radius} fill="none" stroke="var(--bg-chip)" strokeWidth="14" />
        {segments
          .filter((s) => s.value > 0)
          .map((s) => (
            <circle
              key={s.key}
              cx="50"
              cy="50"
              r={radius}
              fill="none"
              stroke={COLORS[s.key]}
              strokeWidth="14"
              strokeDasharray={s.dashArray}
              strokeDashoffset={s.dashOffset}
              transform="rotate(-90 50 50)"
              strokeLinecap="butt"
            />
          ))}
        <text x="50" y="47" textAnchor="middle" className="chart-donut-total" fill="var(--text)">
          {total}
        </text>
        <text x="50" y="61" textAnchor="middle" className="chart-donut-sub" fill="var(--muted)">
          encounters
        </text>
      </svg>
      <ul className="chart-legend">
        {order.map((key) => (
          <li key={key} className="chart-legend-item">
            <span className="chart-swatch" style={{ background: COLORS[key] }} aria-hidden="true" />
            {LABELS[key]}: {outcomes[key]} ({total > 0 ? Math.round((outcomes[key] / total) * 100) : 0}%)
          </li>
        ))}
      </ul>
    </div>
  );
}
