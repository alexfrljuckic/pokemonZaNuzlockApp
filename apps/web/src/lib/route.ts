// Hand-rolled hash routing (no router library — deliberate; the app is a
// local-first SPA and the only "routes" are: home, an open run+tab, a
// read-only share link+tab, and a public profile). This module is the single
// source of truth for the hash <-> app-state mapping. Keep it PURE (no DOM,
// no window) so it is trivially unit-testable — App.tsx reads/writes
// location.hash and delegates all string work here.
//
// Hash formats:
//   (empty)                       → home / run picker
//   #new                          → the New Game / game-picker flow
//   #stats                        → the cross-run "Your Stats" screen
//   #trainers                     → the "Find Trainers" discovery + feed screen
//   #run/<runId>/<tab>            → an owned run open on <tab>
//   #run/<runId>                  → same, defaults to the first tab
//   #share/<token>/<tab>          → read-only spectator view on <tab>
//   #share/<token>                → spectator, first tab
//   #u/<handle>                   → public profile (no tab concept)

// The five in-run tabs, keyed by a stable url-friendly slug. The slug is the
// public contract (it appears in shareable links) — internal display labels
// can change freely, these must not.
export const TAB_SLUGS = ['routes', 'team', 'bosses', 'rules', 'stats'] as const;
export type TabSlug = (typeof TAB_SLUGS)[number];

export const DEFAULT_TAB: TabSlug = 'routes';

export function isTabSlug(s: string): s is TabSlug {
  return (TAB_SLUGS as readonly string[]).includes(s);
}

// Bridge between the url slugs above and RunView's internal tab labels (which
// double as display text). Kept here so the slug contract and its mapping are
// tested together; RunView imports both directions rather than re-deriving.
export const TAB_LABEL_BY_SLUG = {
  routes: 'Routes',
  team: 'Team & Box',
  bosses: 'Boss Fights',
  rules: 'Rules',
  stats: 'Stats',
} as const satisfies Record<TabSlug, string>;

export type TabLabel = (typeof TAB_LABEL_BY_SLUG)[TabSlug];

const SLUG_BY_TAB_LABEL = Object.fromEntries(
  (Object.entries(TAB_LABEL_BY_SLUG) as [TabSlug, TabLabel][]).map(([slug, label]) => [label, slug]),
) as Record<TabLabel, TabSlug>;

export function slugForTabLabel(label: TabLabel): TabSlug {
  return SLUG_BY_TAB_LABEL[label];
}

export function tabLabelForSlug(slug: TabSlug): TabLabel {
  return TAB_LABEL_BY_SLUG[slug];
}

export type Route =
  | { screen: 'home' }
  | { screen: 'new' }
  | { screen: 'stats' }
  | { screen: 'trainers' }
  | { screen: 'run'; runId: string; tab: TabSlug }
  | { screen: 'share'; token: string; tab: TabSlug }
  | { screen: 'profile'; handle: string };

// Profile handles are the same restricted alphabet the old readProfileHandle
// regex used. Run ids / share tokens are opaque; we only forbid the path
// separator so a stray extra segment can't smuggle in.
const HANDLE_RE = /^[a-z0-9-]+$/;

/**
 * Parse a location.hash string (with or without the leading '#') into a Route.
 * Never throws — any malformed / unrecognized hash degrades to `home`.
 */
export function parseHash(hash: string): Route {
  const raw = hash.startsWith('#') ? hash.slice(1) : hash;
  if (!raw) return { screen: 'home' };

  const parts = raw.split('/').filter((p) => p.length > 0);
  if (parts.length === 0) return { screen: 'home' };

  const [head, ...rest] = parts;

  // Home-screen sub-screens: single-segment, no params. A stray extra segment
  // (e.g. #new/junk) still resolves to the screen rather than falling to home.
  if (head === 'new') return { screen: 'new' };
  if (head === 'stats') return { screen: 'stats' };
  if (head === 'trainers') return { screen: 'trainers' };

  if (head === 'run') {
    const runId = rest[0];
    if (!runId) return { screen: 'home' };
    const slug = rest[1];
    const tab = slug && isTabSlug(slug) ? slug : DEFAULT_TAB;
    return { screen: 'run', runId, tab };
  }

  if (head === 'share') {
    const token = rest[0];
    if (!token) return { screen: 'home' };
    const slug = rest[1];
    const tab = slug && isTabSlug(slug) ? slug : DEFAULT_TAB;
    return { screen: 'share', token, tab };
  }

  if (head === 'u') {
    const handle = rest[0];
    if (!handle || !HANDLE_RE.test(handle)) return { screen: 'home' };
    return { screen: 'profile', handle };
  }

  return { screen: 'home' };
}

/**
 * Format a Route into a location.hash string (including the leading '#',
 * except for `home` which returns '' — an empty hash is the home screen).
 * `formatHash(parseHash(x))` is stable for any well-formed x.
 */
export function formatHash(route: Route): string {
  switch (route.screen) {
    case 'home':
      return '';
    case 'new':
      return '#new';
    case 'stats':
      return '#stats';
    case 'trainers':
      return '#trainers';
    case 'run':
      return `#run/${route.runId}/${route.tab}`;
    case 'share':
      return `#share/${route.token}/${route.tab}`;
    case 'profile':
      return `#u/${route.handle}`;
  }
}
