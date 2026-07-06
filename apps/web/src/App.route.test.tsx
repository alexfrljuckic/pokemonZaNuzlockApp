// @vitest-environment happy-dom
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { act } from 'react';
import { createRoot, type Root } from 'react-dom/client';

// App-level routing integration: exercises the hash <-> screen wiring end to
// end (open run → hash, tab click → hash, hashchange → tab restore, deep-link
// guard) with every data/UI collaborator stubbed to the minimum. This is the
// runtime companion to route.test.ts's pure coverage.

const RUN = { id: 'run-1', gameId: 'sv', version: 'scarlet', createdAt: '2026-01-01' };

vi.mock('./lib/db', () => ({ listRuns: async () => [RUN] }));
vi.mock('./lib/sync', () => ({ pullAllRuns: vi.fn(async () => {}) }));
vi.mock('./lib/env', () => ({ SYNC_ENABLED: false }));
vi.mock('./lib/useAuth', () => ({ useAuth: () => ({ session: null }) }));
vi.mock('@vercel/speed-insights/react', () => ({ SpeedInsights: () => null }));

vi.mock('./lib/theme', () => ({
  applyTheme: vi.fn(),
  applyThemeExplicit: vi.fn(),
  currentTheme: () => 'dark',
  THEME_CHANGE_EVENT: 'theme-change',
}));
vi.mock('./games', () => ({ THEMES: [{ id: 'dark', name: 'Dark' }] }));

vi.mock('./screens/AuthBar', () => ({ AuthBar: () => null }));
vi.mock('./components/ProfileSetup', () => ({ ProfileSetup: () => null }));
vi.mock('./components/FollowFeed', () => ({ FollowFeed: () => null }));
vi.mock('./components/TrainerSearch', () => ({ TrainerSearch: () => null }));
vi.mock('./components/ErrorBoundary', () => ({
  ErrorBoundary: ({ children }: { children: React.ReactNode }) => <>{children}</>,
}));
vi.mock('./screens/CrossRunStatsScreen', () => ({ CrossRunStatsScreen: () => null }));
vi.mock('./screens/ProfileScreen', () => ({ ProfileScreen: () => <div data-testid="profile" /> }));
vi.mock('./screens/SpectatorView', () => ({
  SpectatorView: ({ tab }: { tab: string }) => <div data-testid="spectator" data-tab={tab} />,
}));

vi.mock('./screens/TitleScreen', () => ({
  TitleScreen: ({ onContinue }: { onContinue: () => void }) => (
    <button data-testid="go-continue" onClick={onContinue}>
      Continue
    </button>
  ),
}));
vi.mock('./screens/RunPicker', () => ({
  ContinueScreen: ({ onSelect }: { onSelect: (id: string) => void }) => (
    <button data-testid="open-run" onClick={() => onSelect(RUN.id)}>
      Open run
    </button>
  ),
  NewGameScreen: () => null,
}));

// RunView stub echoes the tab it was handed and exposes a button to change tabs.
vi.mock('./screens/RunView', () => ({
  RunView: ({ tab, onTabChange }: { tab: string; onTabChange: (t: string) => void }) => (
    <div data-testid="runview" data-tab={tab}>
      <button data-testid="to-stats" onClick={() => onTabChange('stats')}>
        Stats
      </button>
    </div>
  ),
}));

import App from './App';

(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;

let container: HTMLElement;
let root: Root;

async function render() {
  container = document.createElement('div');
  document.body.appendChild(container);
  await act(async () => {
    root = createRoot(container);
    root.render(<App />);
  });
  await act(async () => {}); // flush listRuns()
}

async function setHash(h: string) {
  await act(async () => {
    location.hash = h;
    window.dispatchEvent(new Event('hashchange'));
  });
}

beforeEach(() => {
  history.replaceState(null, '', location.pathname);
});
afterEach(async () => {
  await act(async () => root.unmount());
  container.remove();
  history.replaceState(null, '', location.pathname);
});

describe('App hash routing', () => {
  it('opening a run writes #run/<id>/routes and shows the run', async () => {
    await render();
    await act(async () => {
      container.querySelector<HTMLButtonElement>('[data-testid="go-continue"]')!.click();
    });
    await act(async () => {
      container.querySelector<HTMLButtonElement>('[data-testid="open-run"]')!.click();
    });
    expect(location.hash).toBe('#run/run-1/routes');
    const rv = container.querySelector('[data-testid="runview"]')!;
    expect(rv.getAttribute('data-tab')).toBe('routes');
  });

  it('switching tab updates the hash segment', async () => {
    await render();
    await setHash('#run/run-1/routes');
    await act(async () => {
      container.querySelector<HTMLButtonElement>('[data-testid="to-stats"]')!.click();
    });
    expect(location.hash).toBe('#run/run-1/stats');
    expect(container.querySelector('[data-testid="runview"]')!.getAttribute('data-tab')).toBe('stats');
  });

  it('a hashchange restores the tab (Back/Forward semantics)', async () => {
    await render();
    await setHash('#run/run-1/stats');
    expect(container.querySelector('[data-testid="runview"]')!.getAttribute('data-tab')).toBe('stats');
    await setHash('#run/run-1/team');
    expect(container.querySelector('[data-testid="runview"]')!.getAttribute('data-tab')).toBe('team');
  });

  it('deep-link to a missing run degrades to a friendly not-found', async () => {
    await render();
    await setHash('#run/does-not-exist/stats');
    expect(container.querySelector('[data-testid="runview"]')).toBeNull();
    expect(container.textContent).toContain('Run not found');
  });

  it('#share/<token>/<tab> opens spectator on that tab', async () => {
    await render();
    await setHash('#share/tok/bosses');
    const spec = container.querySelector('[data-testid="spectator"]')!;
    expect(spec).toBeTruthy();
    expect(spec.getAttribute('data-tab')).toBe('bosses');
  });

  it('bare #share/<token> defaults spectator to the first tab', async () => {
    await render();
    await setHash('#share/tok');
    expect(container.querySelector('[data-testid="spectator"]')!.getAttribute('data-tab')).toBe('routes');
  });
});
