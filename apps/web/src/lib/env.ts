// There is no backend yet — sync must default to disabled so the app is fully
// usable offline from day one. See docs/COSTS.md.
export const SYNC_ENABLED = import.meta.env.VITE_SYNC_ENABLED === 'true';

export type OAuthProvider = 'google' | 'discord';
const SUPPORTED: OAuthProvider[] = ['google', 'discord'];

export function parseProviders(raw: unknown): OAuthProvider[] {
  if (typeof raw !== 'string') return [];
  const seen = new Set<string>();
  return raw
    .split(',')
    .map((p) => p.trim().toLowerCase())
    .filter((p): p is OAuthProvider => SUPPORTED.includes(p as OAuthProvider) && !seen.has(p) && !!seen.add(p));
}

// OAuth sign-in providers, opt-in via VITE_OAUTH_PROVIDERS (comma-separated,
// e.g. "google,discord"). Empty by default so no provider button ever renders
// until it has actually been configured in Supabase — a half-wired button that
// errors on click is worse than no button. See docs/OAUTH-SETUP.md.
//
// MUST stay BELOW SUPPORTED + parseProviders: this runs at module-eval time, so
// if the declarations it depends on sit below it AND VITE_OAUTH_PROVIDERS is a
// non-empty string (the filter path actually runs), it reads SUPPORTED in its
// temporal dead zone and throws, crashing app boot. Regression: env.test.ts.
export const OAUTH_PROVIDERS = parseProviders(import.meta.env.VITE_OAUTH_PROVIDERS);
