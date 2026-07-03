import type { RunEvent } from '@nuzlocke/engine';
import { supabase } from './supabase';

export interface ShareToken {
  token: string;
  runId: string;
  createdAt: string;
  revoked: boolean;
}

export interface SharedRun {
  runId: string;
  gameId: string;
  version: string;
  createdAt: string;
  events: RunEvent[];
}

export async function listShareTokens(runId: string): Promise<ShareToken[]> {
  if (!supabase) return [];
  const { data, error } = await supabase.from('share_tokens').select('*').eq('run_id', runId);
  if (error || !data) return [];
  return data.map((r) => ({ token: r.token, runId: r.run_id, createdAt: r.created_at, revoked: r.revoked }));
}

export async function createShareToken(runId: string): Promise<ShareToken | null> {
  if (!supabase) return null;
  const { data, error } = await supabase.from('share_tokens').insert({ run_id: runId }).select().single();
  if (error || !data) return null;
  return { token: data.token, runId: data.run_id, createdAt: data.created_at, revoked: data.revoked };
}

export async function revokeShareToken(token: string): Promise<void> {
  if (!supabase) return;
  await supabase.from('share_tokens').update({ revoked: true }).eq('token', token);
}

/** The only public read path — token-gated server-side, safe for anonymous callers. See migration comments. */
export async function fetchSharedRun(token: string): Promise<SharedRun | null> {
  if (!supabase) return null;
  const { data, error } = await supabase.rpc('get_shared_run', { p_token: token });
  if (error || !data || data.length === 0) return null;
  const row = data[0];
  return {
    runId: row.run_id,
    gameId: row.game_id,
    version: row.version,
    createdAt: row.created_at,
    events: row.events as RunEvent[],
  };
}

/** Fire-and-forget: tells any spectators on this run's channel to refetch. Carries no data itself. */
export function broadcastRunChanged(runId: string): void {
  if (!supabase) return;
  const channel = supabase.channel(`run:${runId}`);
  channel.subscribe((status) => {
    if (status === 'SUBSCRIBED') {
      channel.send({ type: 'broadcast', event: 'changed', payload: {} }).finally(() => {
        supabase!.removeChannel(channel);
      });
    }
  });
}

/** Spectator side: calls `onChanged` whenever the owner broadcasts a change. Returns an unsubscribe function. */
export function subscribeToRunChanges(runId: string, onChanged: () => void): () => void {
  if (!supabase) return () => {};
  const channel = supabase
    .channel(`run:${runId}`)
    .on('broadcast', { event: 'changed' }, () => onChanged())
    .subscribe();
  return () => {
    supabase!.removeChannel(channel);
  };
}
