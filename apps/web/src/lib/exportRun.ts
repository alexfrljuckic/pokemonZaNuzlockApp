import type { RunEvent } from '@nuzlocke/engine';
import type { RunSummary } from './db';

/** Shape of an exported run file. `format`/`formatVersion` let a future
 * import path recognize and version these files. */
export interface RunExport {
  format: 'nuzlocke-tracker-run';
  formatVersion: 1;
  exportedAt: string;
  run: RunSummary;
  events: RunEvent[];
}

/** Pure serialization: the run summary + its full event log, events sorted by
 * seq so the file reads (and replays) in order regardless of store order. */
export function buildRunExport(
  run: RunSummary,
  events: RunEvent[],
  exportedAt: string = new Date().toISOString(),
): RunExport {
  return {
    format: 'nuzlocke-tracker-run',
    formatVersion: 1,
    exportedAt,
    run,
    events: [...events].sort((a, b) => a.seq - b.seq),
  };
}

/** `nuzlocke-<gameId>-<run start date>.json` — the run's own date, so two
 * exports of the same run get the same name. */
export function exportFileName(run: RunSummary): string {
  return `nuzlocke-${run.gameId}-${run.createdAt.slice(0, 10)}.json`;
}

/** Browser half: serialize to a Blob and trigger a download. */
export function downloadRunExport(run: RunSummary, events: RunEvent[]): void {
  const blob = new Blob([JSON.stringify(buildRunExport(run, events), null, 2)], {
    type: 'application/json',
  });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = exportFileName(run);
  a.click();
  URL.revokeObjectURL(url);
}
