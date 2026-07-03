import { createClient, type SupabaseClient } from '@supabase/supabase-js';
import { SYNC_ENABLED } from './env';

const url = import.meta.env.VITE_SUPABASE_URL;
const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

// null whenever sync is off or credentials are missing — every sync/auth
// feature in this app must check this and no-op cleanly, per the
// local-first invariant: nothing may break when VITE_SYNC_ENABLED=false.
export const supabase: SupabaseClient | null =
  SYNC_ENABLED && url && anonKey ? createClient(url, anonKey) : null;
