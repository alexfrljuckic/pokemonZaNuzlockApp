import { useEffect, useState } from 'react';
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
import { ContinueScreen, NewGameScreen } from './screens/RunPicker';
import { RunView } from './screens/RunView';
import { SpectatorView } from './screens/SpectatorView';
import { TitleScreen } from './screens/TitleScreen';

function readShareToken(): string | null {
  const match = /^#share\/(.+)$/.exec(location.hash);
  return match ? match[1] : null;
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
  const [shareToken, setShareToken] = useState(readShareToken);

  useEffect(() => {
    const onHashChange = () => setShareToken(readShareToken());
    window.addEventListener('hashchange', onHashChange);
    return () => window.removeEventListener('hashchange', onHashChange);
  }, []);

  // Share links are a fully separate, unauthenticated read-only route — no
  // run-picker, no local run loading, no sign-in required to view.
  if (shareToken) {
    return (
      <>
        <div className="app-header">
          <h1>Nuzlocke Tracker</h1>
          <ThemePicker />
        </div>
        <SpectatorView token={shareToken} />
      </>
    );
  }

  return <OwnerApp />;
}

type Screen = 'title' | 'continue' | 'new';

function OwnerApp() {
  const [runs, setRuns] = useState<RunSummary[]>([]);
  const [screen, setScreen] = useState<Screen>('title');
  const [activeRunId, setActiveRunId] = useState<string | null>(null);
  const { session } = useAuth();

  async function refreshRuns() {
    setRuns(await listRuns());
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

  async function handleCreated(runId: string) {
    await refreshRuns();
    setActiveRunId(runId);
  }

  const activeRun = runs.find((r) => r.id === activeRunId) ?? null;

  // One global back affordance, always in the same top-left corner of the
  // chrome: run → run list, picker screens → title. Null on the title screen.
  const headerBack = activeRun
    ? () => setActiveRunId(null)
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
          <h1>Nuzlocke Tracker</h1>
        </div>
        <ThemePicker />
      </div>
      {/* Reflects actual sync state, not just the env flag: sync only happens
          when the deployment has credentials AND the user is signed in. */}
      {!SYNC_ENABLED ? (
        <span className="sync-badge">Local only</span>
      ) : session ? (
        <span className="sync-badge sync-on">● Syncing</span>
      ) : (
        <span className="sync-badge sync-wait">○ Sign in to sync</span>
      )}
      <AuthBar />

      {activeRun ? (
        <RunView run={activeRun} session={session} />
      ) : screen === 'title' ? (
        <TitleScreen
          hasRuns={runs.length > 0}
          onNewGame={() => setScreen('new')}
          onContinue={() => setScreen('continue')}
        />
      ) : (
        <>
          {screen === 'continue' ? (
            <ContinueScreen runs={runs} onSelect={setActiveRunId} />
          ) : (
            <NewGameScreen onCreated={handleCreated} />
          )}
        </>
      )}
    </>
  );
}
