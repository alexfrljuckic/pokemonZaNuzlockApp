// Pure RunState selectors — derived reads shared by the app's views so the
// same question is never re-implemented per screen. Engine stays pure TS.
import type { Area, EngineContext, PokemonInstance, RunEvent, RunState } from './types.js';

/** Current party members. */
export function party(state: RunState): PokemonInstance[] {
  return Object.values(state.pokemon).filter((p) => p.status === 'party');
}

/** Boxed (alive, benched) Pokémon. */
export function boxed(state: RunState): PokemonInstance[] {
  return Object.values(state.pokemon).filter((p) => p.status === 'box');
}

/** The graveyard. */
export function fallen(state: RunState): PokemonInstance[] {
  return Object.values(state.pokemon).filter((p) => p.status === 'dead');
}

/** The "up next" areas — a sliding window that progresses as routes get
 * resolved, not just when milestones clear (the old most-recent-milestone
 * rule went dark between badges). Frontier = the first `windowSize`
 * unresolved areas, in dataset (story) order, whose gate is satisfied
 * (no `unlockAfter`, or any cleared milestone). A hint, not a lock. */
export function frontierAreas(areas: Area[], state: RunState, windowSize = 4): Set<string> {
  const cleared = new Set(state.milestonesCleared);
  const next = new Set<string>();
  for (const area of areas) {
    if (next.size >= windowSize) break;
    // towns and other encounter-less areas have nothing to resolve — they
    // must not clog the window forever
    if (area.encounters.length === 0) continue;
    if (state.encounterOutcomes[area.id]) continue;
    if (area.unlockAfter != null && !cleared.has(area.unlockAfter)) continue;
    next.add(area.id);
  }
  return next;
}

/** Back-compat single-area check; prefer frontierAreas for whole views. */
export function isFrontier(area: Area, state: RunState, allAreas?: Area[]): boolean {
  if (allAreas) return frontierAreas(allAreas, state).has(area.id);
  // Without ordering context, fall back to "unresolved and reachable".
  if (state.encounterOutcomes[area.id]) return false;
  const cleared = new Set(state.milestonesCleared);
  return area.unlockAfter == null || cleared.has(area.unlockAfter);
}

// ---- Cross-run aggregates (backlog 33c) ----

export interface CrossRunStats {
  runs: number;
  victories: number;
  abandoned: number;
  /** runs ended by a wipe with the 'reset' decision — real finished runs */
  wiped: number;
  wipedContinuing: number;
  active: number;
  /** runs included in the aggregates below — abandoned runs are counted
   * above but EXCLUDED here (decided 2026-07-05, see METRICS-DASHBOARD.md).
   * Wiped runs ARE included: a wipe is a real finished run, not a discard. */
  aggregated: number;
  totalDeaths: number;
  deathsBySpecies: Record<string, number>;
  /** party appearances per species across aggregated runs (final party) */
  usedSpecies: Record<string, number>;
  /** first-encounters offered across aggregated runs (caught + failed + skipped) */
  encountersOffered: number;
  /** of those, how many ended in a catch */
  encountersCaught: number;
  /** encountersCaught / encountersOffered, or null when nothing was offered */
  catchRate: number | null;
}

/** Fold a collection of derived run states into cross-run stats. Pure —
 * callers derive each run's state from its own event log first. */
export function aggregateRuns(states: RunState[]): CrossRunStats {
  const stats: CrossRunStats = {
    runs: states.length,
    victories: 0,
    abandoned: 0,
    wiped: 0,
    wipedContinuing: 0,
    active: 0,
    aggregated: 0,
    totalDeaths: 0,
    deathsBySpecies: {},
    usedSpecies: {},
    encountersOffered: 0,
    encountersCaught: 0,
    catchRate: null,
  };
  for (const s of states) {
    if (s.status === 'victory') stats.victories++;
    else if (s.status === 'abandoned') stats.abandoned++;
    else if (s.status === 'wiped') stats.wiped++;
    else if (s.status === 'wiped-continuing') stats.wipedContinuing++;
    else stats.active++;

    if (s.status === 'abandoned') continue;
    stats.aggregated++;
    // catch rate across aggregated runs — encounterOutcomes may be absent on
    // hand-built RunState fixtures, so guard it (real derived states always
    // carry it). Each area holds one legal outcome, so this never double-counts.
    for (const outcome of Object.values(s.encounterOutcomes ?? {})) {
      stats.encountersOffered++;
      if (outcome === 'caught') stats.encountersCaught++;
    }
    for (const p of Object.values(s.pokemon)) {
      if (p.status === 'dead') {
        stats.totalDeaths++;
        stats.deathsBySpecies[p.species] = (stats.deathsBySpecies[p.species] ?? 0) + 1;
      }
      if (p.status === 'party') {
        stats.usedSpecies[p.species] = (stats.usedSpecies[p.species] ?? 0) + 1;
      }
    }
  }
  if (stats.encountersOffered > 0) stats.catchRate = stats.encountersCaught / stats.encountersOffered;
  return stats;
}

// ---- Catch-rate by area (metrics panel, backlog Metrics/Stats) ----

export interface AreaCatchRate {
  areaId: string;
  name: string;
  caught: number;
  /** encounter blown — fled / failed the catch / KO'd it */
  failed: number;
  skipped: number;
  /** areas with a resolved first-encounter (caught + failed + skipped) */
  offered: number;
  /** fraction 0..1 of OFFERED encounters that ended in a catch. `null` when
   * nothing was offered (avoids a spurious 0% for untouched areas). */
  catchRate: number | null;
}

/** Per-area first-encounter catch outcomes for the current run. Reads the
 * derived `encounterOutcomes` map (one legal outcome per area — already
 * accounts for encounter resets and version filtering the fold applied), so
 * it never double-counts a re-resolved area. Areas are named from the dataset
 * and returned in dataset (story) order; areas with no resolved encounter are
 * omitted. Pure — order-independent. */
export function catchRateByArea(state: RunState, ctx: EngineContext): AreaCatchRate[] {
  const rows: AreaCatchRate[] = [];
  for (const area of ctx.dataset.areas) {
    const outcome = state.encounterOutcomes[area.id];
    if (!outcome) continue;
    rows.push({
      areaId: area.id,
      name: area.name,
      caught: outcome === 'caught' ? 1 : 0,
      failed: outcome === 'failed' ? 1 : 0,
      skipped: outcome === 'skipped' ? 1 : 0,
      offered: 1,
      catchRate: outcome === 'caught' ? 1 : 0,
    });
  }
  return rows;
}

export interface CatchRateSummary {
  caught: number;
  failed: number;
  skipped: number;
  offered: number;
  catchRate: number | null;
}

/** Whole-run roll-up of catch outcomes — the totals under the per-area bars,
 * and the number the cross-run screen can average. */
export function catchRateSummary(rows: AreaCatchRate[]): CatchRateSummary {
  const summary: CatchRateSummary = { caught: 0, failed: 0, skipped: 0, offered: 0, catchRate: null };
  for (const r of rows) {
    summary.caught += r.caught;
    summary.failed += r.failed;
    summary.skipped += r.skipped;
    summary.offered += r.offered;
  }
  if (summary.offered > 0) summary.catchRate = summary.caught / summary.offered;
  return summary;
}

// ---- Time-in-run (metrics panel, backlog Metrics/Stats) ----

/** Milliseconds between two event `at` timestamps, or `null` if either is
 * missing / unparseable — timestamps are ISO strings but a sparse import or a
 * hand-built log may lack them, and we degrade to "—" rather than crash. */
function spanMs(from: string | undefined, to: string | undefined): number | null {
  if (!from || !to) return null;
  const a = Date.parse(from);
  const b = Date.parse(to);
  if (Number.isNaN(a) || Number.isNaN(b)) return null;
  return b - a;
}

export interface BossTiming {
  milestoneId: string;
  name: string;
  /** ms from run start to clearing this boss; null when either timestamp is absent */
  elapsedMs: number | null;
}

export interface RunTiming {
  /** ms from the earliest to the latest usable timestamp; null when < 2 exist */
  totalMs: number | null;
  startedAt: string | null;
  lastEventAt: string | null;
  /** count of events carrying a parseable timestamp — surfaces sparse logs */
  timestampedEvents: number;
  /** time from run start to each cleared milestone, in clear order */
  bossTimings: BossTiming[];
}

/** Elapsed wall-clock time for the run, derived purely from event timestamps.
 * Total duration = last usable timestamp − first (we don't try to subtract
 * idle gaps; "active time" would need session heartbeats we don't record).
 * Per-boss timings measure run-start → that milestone's clear. Everything is
 * `null`-tolerant: a log with sparse or missing `at` fields yields nulls the
 * UI renders as "—" instead of throwing. Pure & order-independent (sorts by
 * seq first, matching deriveState). */
export function runTiming(events: RunEvent[], ctx: EngineContext): RunTiming {
  const sorted = [...events].sort((a, b) => a.seq - b.seq);
  const parseable = sorted.filter((e) => e.at && !Number.isNaN(Date.parse(e.at)));

  const startEvent = sorted.find((e) => e.type === 'run_started');
  // prefer the explicit run_started timestamp; fall back to the earliest
  // parseable event so imported logs without a clean start still get a floor
  const startedAt =
    startEvent && startEvent.at && !Number.isNaN(Date.parse(startEvent.at))
      ? startEvent.at
      : parseable[0]?.at ?? null;
  const lastEventAt = parseable.length > 0 ? parseable[parseable.length - 1].at : null;

  const bossTimings: BossTiming[] = [];
  for (const e of sorted) {
    if (e.type !== 'milestone_cleared') continue;
    const m = ctx.dataset.milestones.find((x) => x.id === e.payload.milestoneId);
    bossTimings.push({
      milestoneId: e.payload.milestoneId,
      name: m?.name ?? e.payload.milestoneId,
      elapsedMs: spanMs(startedAt ?? undefined, e.at),
    });
  }

  return {
    totalMs: spanMs(startedAt ?? undefined, lastEventAt ?? undefined),
    startedAt,
    lastEventAt,
    timestampedEvents: parseable.length,
    bossTimings,
  };
}

/** Compact human duration ("2h 14m", "3d 4h", "—" when null). Pure helper the
 * UI reuses so owner and spectator format identically. */
export function formatDuration(ms: number | null): string {
  if (ms == null) return '—';
  if (ms < 0) ms = 0;
  const totalMinutes = Math.floor(ms / 60000);
  const days = Math.floor(totalMinutes / (60 * 24));
  const hours = Math.floor((totalMinutes % (60 * 24)) / 60);
  const minutes = totalMinutes % 60;
  if (days > 0) return `${days}d ${hours}h`;
  if (hours > 0) return `${hours}h ${minutes}m`;
  if (minutes > 0) return `${minutes}m`;
  return '<1m';
}
