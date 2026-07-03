/// <reference types="vite/client" />

interface ImportMetaEnv {
  /** Enables background sync to a backend. No backend exists yet — must default to false/local-only. */
  readonly VITE_SYNC_ENABLED?: string;
  readonly VITE_SUPABASE_URL?: string;
  readonly VITE_SUPABASE_ANON_KEY?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
