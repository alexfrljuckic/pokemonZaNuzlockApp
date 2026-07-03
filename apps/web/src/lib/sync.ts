import type { RunEvent } from '@nuzlocke/engine';
import { supabase } from './supabase';
import { listRuns, loadEvents, mergeRemoteEvents, upsertRunSummary, type RunSummary } from './db';
import { broadcastRunChanged } from './shareLinks';

export const SYNC_AVAILABLE = !!supabase;

/** Pushes a run's summary + full event log to Supabase. Upserts are idempotent. */
export async function pushRun(run: RunSummary, userId: string): Promise<void> {
  if (!supabase) return;
  await supabase
    .from('runs')
    .upsert({ id: run.id, user_id: userId, game_id: run.gameId, version: run.version, created_at: run.createdAt });

  const events = await loadEvents(run.id);
  if (!events.length) return;
  const rows = events.map((ev) => ({ run_id: run.id, seq: ev.seq, at: ev.at, type: ev.type, payload: ev.payload }));
  // run_events has no update policy (append-only) — ignoreDuplicates means an
  // already-synced event is a no-op rather than an error.
  await supabase.from('run_events').upsert(rows, { onConflict: 'run_id,seq', ignoreDuplicates: true });
  // Ping any spectators watching this run's share link — carries no data,
  // just tells them to refetch via the token-gated RPC. Safe to fire even
  // if nobody's listening or the run was never shared.
  broadcastRunChanged(run.id);
}

/** Pulls a run's remote events and merges any this device hasn't seen. Returns whether anything changed. */
export async function pullRun(runId: string): Promise<boolean> {
  if (!supabase) return false;
  const { data, error } = await supabase
    .from('run_events')
    .select('seq, at, type, payload')
    .eq('run_id', runId)
    .order('seq');
  if (error || !data) return false;
  const remoteEvents = data.map((r) => ({ seq: r.seq, at: r.at, type: r.type, payload: r.payload })) as RunEvent[];
  return mergeRemoteEvents(runId, remoteEvents);
}

/** Push-then-pull for one run — best-effort, never throws (network errors are swallowed by the caller). */
export async function syncRun(run: RunSummary, userId: string): Promise<boolean> {
  await pushRun(run, userId);
  return pullRun(run.id);
}

/** On sign-in: pull every remote run this device doesn't know about yet, and merge events for all of them. */
export async function pullAllRuns(userId: string): Promise<void> {
  if (!supabase) return;
  const { data: remoteRuns, error } = await supabase
    .from('runs')
    .select('id, game_id, version, created_at')
    .eq('user_id', userId);
  if (error || !remoteRuns) return;

  const localIds = new Set((await listRuns()).map((r) => r.id));
  for (const rr of remoteRuns) {
    if (!localIds.has(rr.id)) {
      await upsertRunSummary({ id: rr.id, gameId: rr.game_id, version: rr.version, createdAt: rr.created_at });
    }
    await pullRun(rr.id);
  }
}
