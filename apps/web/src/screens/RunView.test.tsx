// @vitest-environment happy-dom
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { act } from 'react';
import { createRoot } from 'react-dom/client';

// RunView pulls in the engine, datasets and IndexedDB; this test only exercises
// the tab-switcher <-> route wiring the routing change added, so stub the heavy
// collaborators down to just enough to render the tab bar and one panel.
vi.mock('@nuzlocke/engine', () => ({
  deriveState: () => ({
    status: 'active',
    ruleset: { presetId: 'standard', houseRules: [] },
    version: 'scarlet',
    milestonesCleared: [],
    pokemon: {},
  }),
  milestonesFor: () => [],
  party: () => [],
  pendingWipeDecision: () => false,
}));

vi.mock('../lib/datasets', () => ({
  DATASETS: { sv: { gameId: 'sv', name: 'Scarlet & Violet' } },
  speciesToLine: {},
}));

vi.mock('../lib/db', () => ({
  loadEvents: async () => [{ seq: 0, at: '2026-01-01', type: 'run_started', payload: {} }],
  appendEvent: vi.fn(async () => {}),
}));

vi.mock('../lib/sync', () => ({ syncRun: vi.fn(), SYNC_AVAILABLE: false }));
vi.mock('../lib/theme', () => ({ applyVersionTheme: vi.fn() }));

// Stub the tab bodies + summary strip so each renders an identifiable marker
// and none of their own dependencies load.
vi.mock('../components/RunSummaryStrip', () => ({ RunSummaryStrip: () => <div data-testid="summary" /> }));
vi.mock('../components/SharePopover', () => ({ SharePopover: () => null }));
vi.mock('./tabs/RoutesTab', () => ({ RoutesTab: () => <div data-testid="panel-routes" /> }));
vi.mock('./tabs/TeamBoxTab', () => ({ TeamBoxTab: () => <div data-testid="panel-team" /> }));
vi.mock('./tabs/MilestonesTab', () => ({ MilestonesTab: () => <div data-testid="panel-bosses" /> }));
vi.mock('./tabs/RulesTab', () => ({ RulesTab: () => <div data-testid="panel-rules" /> }));
vi.mock('./tabs/StatsTab', () => ({ StatsTab: () => <div data-testid="panel-stats" /> }));
vi.mock('./WipeScreen', () => ({ WipeScreen: () => null }));

import { RunView } from './RunView';
import type { TabSlug } from '../lib/route';

(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;

const run = { id: 'run1', gameId: 'sv', version: 'scarlet', createdAt: '2026-01-01' };

async function renderRunView(tab: TabSlug, onTabChange = vi.fn()) {
  const container = document.createElement('div');
  document.body.appendChild(container);
  await act(async () => {
    createRoot(container).render(
      <RunView run={run} session={null} tab={tab} onTabChange={onTabChange} onSwitchRun={vi.fn()} />,
    );
  });
  // flush the loadEvents microtask + re-render
  await act(async () => {});
  return { container, onTabChange };
}

describe('RunView tab <-> route wiring', () => {
  let container: HTMLElement | null = null;
  afterEach(() => {
    container?.remove();
    container = null;
  });

  it('renders the panel named by the tab slug', async () => {
    const r = await renderRunView('stats');
    container = r.container;
    expect(container.querySelector('[data-testid="panel-stats"]')).toBeTruthy();
    expect(container.querySelector('[data-testid="panel-routes"]')).toBeNull();
  });

  it('clicking another tab calls onTabChange with that tab slug', async () => {
    const onTabChange = vi.fn();
    const r = await renderRunView('routes', onTabChange);
    container = r.container;
    // find the "Stats" tab button and click it
    const statsBtn = [...container.querySelectorAll('button[role="tab"]')].find(
      (b) => b.textContent?.includes('Stats'),
    ) as HTMLButtonElement;
    expect(statsBtn).toBeTruthy();
    await act(async () => {
      statsBtn.click();
    });
    expect(onTabChange).toHaveBeenCalledWith('stats');
  });
});
