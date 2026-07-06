/** Hand-rolled filled progress bar: milestones cleared vs. total for the dataset. */
export function MilestoneProgressBar({ cleared, total }: { cleared: number; total: number }) {
  if (total <= 0) {
    return (
      <div className="chart-block">
        <p className="muted chart-caption">No boss fights defined for this dataset yet.</p>
      </div>
    );
  }

  const fraction = Math.min(Math.max(cleared / total, 0), 1);
  const percent = Math.round(fraction * 100);

  return (
    <div className="chart-block">
      <svg viewBox="0 0 300 24" className="chart-svg chart-svg-wide" role="img" aria-label="Boss fight progress bar">
        <rect x="0" y="4" width="300" height="16" rx="8" fill="var(--bg-chip)" />
        <rect x="0" y="4" width={300 * fraction} height="16" rx="8" fill="var(--accent)" />
      </svg>
      <p className="muted chart-caption">
        {cleared}/{total} boss fights defeated ({percent}%)
      </p>
    </div>
  );
}
