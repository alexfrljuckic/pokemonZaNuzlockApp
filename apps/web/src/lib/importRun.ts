import type { RunEvent } from '@nuzlocke/engine';

/** Parsed + validated payload of a run-export file, ready for storage. */
export interface ParsedRunImport {
  gameId: string;
  version: string;
  createdAt: string;
  events: RunEvent[];
}

// Hard caps: an export of a real run is a few hundred events and well under
// 1 MB; anything past these is malformed or hostile (derive-perf DoS).
export const MAX_IMPORT_BYTES = 5 * 1024 * 1024;
export const MAX_IMPORT_EVENTS = 20_000;

const SLUG = /^[a-z0-9-]{1,64}$/;

class ImportError extends Error {}
const fail = (msg: string): never => {
  throw new ImportError(msg);
};

const isPlainObject = (v: unknown): v is Record<string, unknown> =>
  typeof v === 'object' && v !== null && !Array.isArray(v);

/** Parse and strictly validate an exported run file (see exportRun.ts).
 * Throws with a human-readable message on anything off. The file's run id is
 * deliberately NOT returned — imports always mint a fresh id so a file can
 * never collide with an existing local run or squat on someone else's synced
 * run id. Event seqs are renumbered 1..n after sorting, so duplicates or
 * gaps in the file can't confuse later appends. Everything else is kept
 * verbatim: deriveState ignores event types it doesn't know, unknown gameIds
 * hit RunView's unsupported-run guard, and all strings render through React
 * (escaped) — the remaining risk is size, which the caps above bound. */
export function parseRunExport(text: string): ParsedRunImport {
  if (text.length > MAX_IMPORT_BYTES) fail('File is too large to be a run export.');

  let raw: unknown;
  try {
    raw = JSON.parse(text);
  } catch {
    return fail('Not a JSON file.');
  }
  if (!isPlainObject(raw)) return fail('Not a run export file.');
  if (raw.format !== 'nuzlocke-tracker-run') return fail('Not a run export file (wrong format marker).');
  if (raw.formatVersion !== 1) return fail(`Unsupported export version: ${String(raw.formatVersion)}.`);

  const run = raw.run;
  if (!isPlainObject(run)) return fail('Export has no run summary.');
  const { gameId, version, createdAt } = run;
  if (typeof gameId !== 'string' || !SLUG.test(gameId)) return fail('Export has an invalid game id.');
  if (typeof version !== 'string' || !SLUG.test(version)) return fail('Export has an invalid version.');
  if (typeof createdAt !== 'string' || Number.isNaN(Date.parse(createdAt)))
    return fail('Export has an invalid start date.');

  const events = raw.events;
  if (!Array.isArray(events) || events.length === 0) return fail('Export has no events.');
  if (events.length > MAX_IMPORT_EVENTS) return fail('Export has an implausible number of events.');

  for (const ev of events) {
    if (!isPlainObject(ev)) return fail('Export contains a malformed event.');
    if (typeof ev.seq !== 'number' || !Number.isFinite(ev.seq)) return fail('Export contains an event with a bad sequence number.');
    if (typeof ev.at !== 'string') return fail('Export contains an event with a bad timestamp.');
    if (typeof ev.type !== 'string' || ev.type.length === 0 || ev.type.length > 64)
      return fail('Export contains an event with a bad type.');
    if (!isPlainObject(ev.payload)) return fail('Export contains an event with a bad payload.');
  }

  // sort by the file's seq, then renumber 1..n — order is what matters
  const sorted = (events as unknown as RunEvent[])
    .slice()
    .sort((a, b) => a.seq - b.seq)
    .map((ev, i) => ({ ...ev, seq: i + 1 }));

  // without a founding run_started the fold derives an empty ruleset — that
  // file is not a usable run
  if (sorted[0].type !== 'run_started') return fail("Export doesn't start with a run_started event.");

  return { gameId, version, createdAt, events: sorted };
}
