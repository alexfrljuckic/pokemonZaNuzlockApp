// @vitest-environment happy-dom
import { describe, expect, it } from 'vitest';
import { act } from 'react';
import { createRoot } from 'react-dom/client';
import { buildRuleset, deriveState, type EngineContext, type RunEvent } from '@nuzlocke/engine';
import { DATASETS, speciesToLine } from '../../lib/datasets';
import { CatchRateByArea } from './CatchRateByArea';
import { RunTimePanel } from './RunTimePanel';

const dataset = DATASETS.lgpe;
const ctx: EngineContext = { dataset, speciesToLine };

(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;

let seq = 0;
const ev = (type: RunEvent['type'], payload: unknown): RunEvent =>
  ({ seq: ++seq, at: new Date(1700000000000 + seq * 60000).toISOString(), type, payload } as RunEvent);

const events: RunEvent[] = [
  ev('run_started', { gameId: 'lgpe', version: 'lets-go-pikachu', ruleset: buildRuleset('standard', 'lgpe') }),
  ev('encounter_resolved', { areaId: 'route-1', species: 'pidgey', outcome: 'caught', pokemonId: 'a', level: 4 }),
  ev('encounter_resolved', { areaId: 'route-2', species: 'caterpie', outcome: 'failed' }),
  ev('milestone_cleared', { milestoneId: 'gym-1-brock' }),
];

async function render(node: React.ReactElement) {
  const container = document.createElement('div');
  document.body.appendChild(container);
  await act(async () => {
    createRoot(container).render(node);
  });
  return container;
}

describe('CatchRateByArea panel', () => {
  it('renders a bar per resolved area with the run catch-rate caption', async () => {
    const state = deriveState(events, ctx);
    const c = await render(<CatchRateByArea state={state} ctx={ctx} />);
    expect(c.querySelectorAll('.dbb-row').length).toBe(2); // route-1, route-2
    expect(c.textContent).toContain('1/2 caught');
    expect(c.textContent).toContain('50% catch rate');
  });

  it('shows an empty-state before any encounter is resolved', async () => {
    const state = deriveState(
      [ev('run_started', { gameId: 'lgpe', version: 'lets-go-pikachu', ruleset: buildRuleset('standard', 'lgpe') })],
      ctx,
    );
    const c = await render(<CatchRateByArea state={state} ctx={ctx} />);
    expect(c.textContent).toContain('No encounters resolved yet.');
  });
});

describe('RunTimePanel', () => {
  it('renders total duration and per-boss timing rows', async () => {
    const c = await render(<RunTimePanel events={events} ctx={ctx} />);
    expect(c.textContent).toContain('total run time');
    expect(c.querySelectorAll('.dbb-row').length).toBe(1); // gym-1-brock
  });

  it('degrades to "—" when timestamps are missing (no crash)', async () => {
    const noTs = (type: RunEvent['type'], payload: unknown): RunEvent =>
      ({ seq: ++seq, at: '', type, payload } as RunEvent);
    const c = await render(
      <RunTimePanel
        events={[noTs('run_started', { gameId: 'lgpe', version: 'lets-go-pikachu', ruleset: buildRuleset('standard', 'lgpe') })]}
        ctx={ctx}
      />,
    );
    expect(c.textContent).toContain('—');
    expect(c.textContent).toMatch(/No timestamps recorded/);
  });
});
