import { useEffect, useState } from 'react';
import { SpeedInsights } from '@vercel/speed-insights/react';
import { listRuns, type RunSummary } from './lib/db';
import { SYNC_ENABLED } from './lib/env';
import { pullAllRuns } from './lib/sync';
import {
  applyTheme,
  applyThemeExplicit,
  currentTheme,
  THEME_CHANGE_EVENT,
  type ThemeId,
} from './lib/theme';
import { THEMES } from './games';
import { useAuth } from './lib/useAuth';
import { AuthBar } from './screens/AuthBar';
import { ErrorBoundary } from './components/ErrorBoundary';
import { ContinueScreen, NewGameScreen } from './screens/RunPicker';
import { CrossRunStatsScreen } from './screens/CrossRunStatsScreen';
import { ProfileScreen } from './screens/ProfileScreen';
import { ProfileSetup } from './components/ProfileSetup';
import { FollowFeed } from './components/FollowFeed';
import { TrainerSearch } from './components/TrainerSearch';
import { RunView } from './screens/RunView';
import { SpectatorView } from './screens/SpectatorView';
import { TitleScreen } from './screens/TitleScreen';
import { formatHash, parseHash, type Route } from './lib/route';

// Single source of truth for the current hash-route. Never throws — a garbage
// hash parses to { screen: 'home' }.
function readRoute(): Route {
  return parseHash(location.hash);
}

// Programmatic hash writer used by every navigation in the owner app. Guards
// against no-op writes (which would fire a redundant hashchange) and lets the
// caller choose push (new history entry, Back returns here) vs replace (no
// entry). We compare against the *current* hash rather than tracking a flag,
// so user-driven Back/Forward — which change location.hash before firing
// hashchange — never round-trips back through here.
function navigate(route: Route, mode: 'push' | 'replace' = 'push') {
  const next = formatHash(route);
  // location.hash is '' when empty; formatHash('home') is also ''. Normalize.
  const current = location.hash;
  if (next === current || (next === '' && current === '')) return;
  const url = next === '' ? location.pathname + location.search : next;
  if (mode === 'push') history.pushState(null, '', url);
  else history.replaceState(null, '', url);
  // pushState/replaceState never fire hashchange; dispatch one so the single
  // listener in App re-derives the route. (Back/Forward DO fire it natively.)
  window.dispatchEvent(new Event('hashchange'));
}

function ThemePicker() {
  const [theme, setTheme] = useState<ThemeId>(currentTheme);

  useEffect(() => {
    // Apply the stored theme once on load. Opening/creating a run may later
    // switch to that game's version theme (unless the user has chosen one
    // explicitly) — reflect any such change in the dropdown's displayed value.
    applyTheme(currentTheme());
    const onThemeChange = (e: Event) => setTheme((e as CustomEvent<ThemeId>).detail);
    window.addEventListener(THEME_CHANGE_EVENT, onThemeChange);
    return () => window.removeEventListener(THEME_CHANGE_EVENT, onThemeChange);
  }, []);

  return (
    <select
      className="theme-select"
      value={theme}
      onChange={(e) => applyThemeExplicit(e.target.value as ThemeId)}
      aria-label="Color theme"
    >
      {THEMES.map((t) => (
        <option key={t.id} value={t.id}>
          {t.name}
        </option>
      ))}
    </select>
  );
}

export default function App() {
  const [route, setRoute] = useState<Route>(readRoute);

  useEffect(() => {
    // Fires for both user-driven (Back/Forward, manual edit) and programmatic
    // (pushState/replaceState do NOT fire it, so navigate() dispatches it)
    // hash changes. Re-deriving from location.hash keeps this the one place
    // that reflects the URL into app state.
    const onHashChange = () => setRoute(readRoute());
    window.addEventListener('hashchange', onHashChange);
    // popstate covers Back/Forward across our pushState entries (hashchange
    // also fires when the hash differs, but popstate is the reliable signal).
    window.addEventListener('popstate', onHashChange);
    return () => {
      window.removeEventListener('hashchange', onHashChange);
      window.removeEventListener('popstate', onHashChange);
    };
  }, []);

  // Share links and profile pages are fully separate, unauthenticated
  // read-only routes — no run-picker, no local run loading, no sign-in
  // required to view (the follow button asks for one when relevant).
  if (route.screen === 'share' || route.screen === 'profile') {
    // Leave the read-only route back to the main app by clearing the hash.
    // The React tree swaps out under the clicked button, so move focus to the
    // main app's <h1> — otherwise keyboard focus silently drops to <body>.
    const goHome = () => {
      history.pushState(null, '', location.pathname + location.search);
      window.dispatchEvent(new Event('hashchange'));
      requestAnimationFrame(() => document.querySelector<HTMLElement>('.app-header h1')?.focus());
    };
    return (
      <>
        <div className="app-header">
          <div className="app-header-left">
            <button className="back-icon" aria-label="Back to app" title="Back to app" onClick={goHome}>
              ←
            </button>
            <h1>Nuzlocke Tracker</h1>
          </div>
          <ThemePicker />
        </div>
        {route.screen === 'share' ? (
          <SpectatorView
            token={route.token}
            tab={route.tab}
            onTabChange={(tab) => navigate({ screen: 'share', token: route.token, tab })}
          />
        ) : (
          <ProfileScreen handle={route.handle} />
        )}
        <SpeedInsights />
      </>
    );
  }

  return <OwnerApp route={route} />;
}

// The New Game (#new) and Your Stats (#stats) screens live in the URL so they're
// bookmarkable / back-button-friendly. The "Continue" run list stays local
// state: it's a transient list-picker, not a place worth deep-linking to.
type Screen = 'title' | 'continue';

function OwnerApp({ route }: { route: Route }) {
  const [runs, setRuns] = useState<RunSummary[]>([]);
  const [runsLoaded, setRunsLoaded] = useState(false);
  const [screen, setScreen] = useState<Screen>('title');
  const { session } = useAuth();

  // The URL is the source of truth for which run is open: activeRunId is
  // whatever #run/<id>/<tab> names, or null on any non-run route. Navigation
  // (open/close a run) happens by writing the hash — the route flows back down
  // via App's hashchange listener, so there's no separate activeRunId state to
  // keep in sync.
  const activeRunId = route.screen === 'run' ? route.runId : null;

  async function refreshRuns() {
    setRuns(await listRuns());
    setRunsLoaded(true);
  }

  useEffect(() => {
    refreshRuns();
  }, []);

  // On sign-in, pull any runs from other devices/sessions into local storage
  // before showing the run list, so "continue a run" reflects everything the
  // account owns, not just what this browser created.
  useEffect(() => {
    if (!session) return;
    pullAllRuns(session.user.id)
      .then(refreshRuns)
      .catch(() => {});
  }, [session]);

  const openRun = (runId: string) => navigate({ screen: 'run', runId, tab: 'routes' });
  const closeRun = () => navigate({ screen: 'home' });
  const goHome = () => {
    setScreen('title');
    navigate({ screen: 'home' });
  };

  async function handleCreated(runId: string) {
    await refreshRuns();
    openRun(runId);
  }

  const activeRun = runs.find((r) => r.id === activeRunId) ?? null;

  // Deep-link guard (local-first): the hash may name a run that doesn't live in
  // this browser's IndexedDB — a stale bookmark, a link from another device, or
  // a deleted run. Once runs have loaded and it's still missing, show a
  // friendly not-found instead of a blank screen or a silent redirect.
  const runMissing = activeRunId != null && runsLoaded && !activeRun;

  // One global back affordance, always in the same top-left corner of the
  // chrome: run → run list, picker screens → title. Null on the title screen.
  // The #new / #stats screens live in the URL, so their Back writes the home
  // hash (pushing a history entry the browser Back button also honors); the
  // local "continue" list just flips local state.
  const onSubScreen = route.screen === 'new' || route.screen === 'stats';
  const headerBack = activeRunId
    ? closeRun
    : onSubScreen
      ? goHome
      : screen !== 'title'
        ? () => setScreen('title')
        : null;

  return (
    <>
      <div className="app-header">
        <div className="app-header-left">
          {headerBack && (
            <button className="back-icon" aria-label="Back" title="Back" onClick={headerBack}>
              ←
            </button>
          )}
          {/* tabIndex -1: focus target for the read-only route's back button */}
          <h1 tabIndex={-1}>Nuzlocke Tracker</h1>
        </div>
        <ThemePicker />
      </div>
      {/* Reflects actual sync state, not just the env flag: sync only happens
          when the deployment has credentials AND the user is signed in.
          role="status" announces sync-state changes to screen readers. */}
      {!SYNC_ENABLED ? (
        <span className="sync-badge" role="status">
          Local only
        </span>
      ) : session ? (
        <span className="sync-badge sync-on" role="status">
          ● Syncing
        </span>
      ) : (
        <span className="sync-badge sync-wait" role="status">
          ○ Sign in to sync
        </span>
      )}
      <AuthBar />
      <ProfileSetup session={session} />

      {/* Boundary around the whole content area so one broken run (or screen)
          can never white-screen the app — the fallback offers "back to runs"
          plus a raw export of the active run's events. */}
      <ErrorBoundary run={activeRun} onReset={closeRun}>
        {activeRun ? (
          <RunView
            run={activeRun}
            session={session}
            tab={route.screen === 'run' ? route.tab : 'routes'}
            onTabChange={(tab) => navigate({ screen: 'run', runId: activeRun.id, tab })}
            onSwitchRun={handleCreated}
          />
        ) : runMissing ? (
          <section>
            <h2>Run not found</h2>
            <p className="muted">
              This link points to a run that isn't on this device. Runs live only in the browser
              that created them (and any device you've signed in on) — check you're signed in, or go
              back to your runs.
            </p>
            <div className="panel-actions">
              <button onClick={closeRun}>Back to runs</button>
            </div>
          </section>
        ) : activeRunId ? (
          // Route names a run but the run list hasn't loaded yet — brief.
          <p className="muted">Loading run…</p>
        ) : route.screen === 'new' ? (
          <NewGameScreen onCreated={handleCreated} />
        ) : route.screen === 'stats' ? (
          <CrossRunStatsScreen runs={runs} />
        ) : screen === 'continue' ? (
          <ContinueScreen runs={runs} onSelect={openRun} onDeleted={refreshRuns} />
        ) : (
          <>
            <TitleScreen
              hasRuns={runs.length > 0}
              onNewGame={() => navigate({ screen: 'new' })}
              onContinue={() => setScreen('continue')}
              onStats={() => navigate({ screen: 'stats' })}
            />
            {/* Social discovery lives on the landing page — finding other trainers
                shouldn't require opening a run. The wrapper only renders when the
                children can (signed in + sync on) so signed-out users don't get an
                empty bordered section. */}
            {SYNC_ENABLED && session && (
              <section className="landing-social" aria-label="Trainers and friends">
                <TrainerSearch session={session} />
                <FollowFeed session={session} />
              </section>
            )}
          </>
        )}
      </ErrorBoundary>
      <SpeedInsights />
    </>
  );
}
