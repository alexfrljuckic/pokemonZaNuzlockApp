import type { RunEvent } from '@nuzlocke/engine';
import { supabase } from './supabase';

// Profiles + follows (backlog 35, docs/PROFILES.md). Everything here guards
// on the supabase client, so with VITE_SYNC_ENABLED=false every function is
// an inert no-op and no profile UI renders — degrade-to-free by construction.

export interface Profile {
  userId: string;
  handle: string;
  displayName: string;
  createdAt: string;
}

export interface ProfileRunSummary {
  token: string;
  gameId: string;
  version: string;
  createdAt: string;
  eventCount: number;
}

export interface PublicProfile extends Profile {
  runs: ProfileRunSummary[];
}

export interface FeedItem {
  handle: string;
  displayName: string;
  token: string;
  gameId: string;
  version: string;
  event: RunEvent;
}

export const HANDLE_RE = /^[a-z0-9][a-z0-9-]{2,23}$/;

export interface ProfileSearchResult {
  handle: string;
  displayName: string;
}

/** Discovery search by handle/display-name prefix (>=2 chars). Anonymous-safe —
 * the search_profiles RPC exposes only public (handle, display_name) pairs. */
export async function searchProfiles(query: string): Promise<ProfileSearchResult[]> {
  if (!supabase) return [];
  const q = query.trim();
  if (q.length < 2) return [];
  const { data, error } = await supabase.rpc('search_profiles', { p_query: q, p_limit: 10 });
  if (error || !data) return [];
  return data.map((r: Record<string, unknown>) => ({
    handle: r.handle as string,
    displayName: (r.display_name as string) ?? '',
  }));
}

/** The signed-in user's own profile row, or null (none claimed / sync off). */
export async function getMyProfile(userId: string): Promise<Profile | null> {
  if (!supabase) return null;
  const { data, error } = await supabase.from('profiles').select('*').eq('user_id', userId).maybeSingle();
  if (error || !data) return null;
  return { userId: data.user_id, handle: data.handle, displayName: data.display_name, createdAt: data.created_at };
}

/** Claim a handle. Returns an error message (e.g. handle taken) or null on success. */
export async function claimProfile(userId: string, handle: string, displayName: string): Promise<string | null> {
  if (!supabase) return 'Sync is disabled.';
  if (!HANDLE_RE.test(handle)) return 'Handles are 3–24 chars: lowercase letters, digits, dashes.';
  const { error } = await supabase
    .from('profiles')
    .insert({ user_id: userId, handle, display_name: displayName.trim() });
  if (!error) return null;
  return /duplicate|unique/i.test(error.message) ? 'That handle is already taken.' : error.message;
}

/** Delete the signed-in user's own profile: frees the handle and removes their
 * public presence (follow edges cascade via the FK). Runs and share links are
 * unaffected — this only removes the public profile, not the account or its data.
 * Owner-only RLS already scopes the delete to the caller's row. */
export async function deleteProfile(userId: string): Promise<string | null> {
  if (!supabase) return 'Sync is disabled.';
  const { error } = await supabase.from('profiles').delete().eq('user_id', userId);
  return error ? error.message : null;
}

/** Public profile by handle — anonymous-safe (handle-gated SECURITY DEFINER RPC). */
export async function fetchProfile(handle: string): Promise<PublicProfile | null> {
  if (!supabase) return null;
  const { data, error } = await supabase.rpc('get_profile', { p_handle: handle });
  if (error || !data || data.length === 0) return null;
  const head = data[0];
  const runs = data
    .filter((r: { run_token: string | null }) => r.run_token != null)
    .map((r: Record<string, unknown>) => ({
      token: r.run_token as string,
      gameId: r.run_game_id as string,
      version: r.run_version as string,
      createdAt: r.run_created_at as string,
      eventCount: Number(r.run_event_count ?? 0),
    }));
  return {
    userId: head.user_id,
    handle: head.handle,
    displayName: head.display_name,
    createdAt: head.created_at,
    runs,
  };
}

export async function isFollowing(followeeId: string): Promise<boolean> {
  if (!supabase) return false;
  const { data } = await supabase.from('follows').select('followee_id').eq('followee_id', followeeId).maybeSingle();
  return data != null;
}

export async function follow(followerId: string, followeeId: string): Promise<void> {
  if (!supabase) return;
  await supabase.from('follows').insert({ follower_id: followerId, followee_id: followeeId });
}

export async function unfollow(followeeId: string): Promise<void> {
  if (!supabase) return;
  await supabase.from('follows').delete().eq('followee_id', followeeId);
}

/** Big-beats feed (boss/death/wipe/ending) from followed users' shared runs,
 * newest first. Polled on open — never a realtime subscription (COSTS.md). */
export async function fetchFeed(limit = 30): Promise<FeedItem[]> {
  if (!supabase) return [];
  const { data, error } = await supabase.rpc('get_feed', { p_limit: limit });
  if (error || !data) return [];
  return data.map((r: Record<string, unknown>) => ({
    handle: r.handle as string,
    displayName: r.display_name as string,
    token: r.run_token as string,
    gameId: r.game_id as string,
    version: r.version as string,
    event: { seq: r.seq, at: r.at, type: r.type, payload: r.payload } as RunEvent,
  }));
}
