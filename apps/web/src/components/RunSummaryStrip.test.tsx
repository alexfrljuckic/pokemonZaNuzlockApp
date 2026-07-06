// @vitest-environment happy-dom
import { describe, expect, it, vi } from 'vitest';
import { act } from 'react';
import { createRoot } from 'react-dom/client';

// RunSummaryStrip pulls in the engine + describeEvent/sprite helpers; this test
// only exercises the clickable level-cap chip, so stub the collaborators down to
// just enough to render the cap.
const nextBoss = vi.fn();
vi.mock('@nuzlocke/engine', () => ({
  RULES: {},
  nextBoss: (...args: unknown[]) => nextBoss(...args),
  party: () => [],
}));
vi.mock('../lib/describeEvent', () => ({
  describeEvent: () => null,
  visibleEvents: (e: unknown[]) => e,
}));
vi.mock('./SpriteImg', () => ({ SpriteImg: () => null }));
vi.mock('./TrainerSprite', () => ({ TrainerSprite: () => null }));

import { RunSummaryStrip } from './RunSummaryStrip';

(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;

const state = {
  ruleset: { rules: { 'level-cap': { enabled: true, params: { offset: 0 } } } },
  pokemon: {},
} as never;
const ctx = { dataset: { gameId: 'sv' } } as never;

async function render(node: React.ReactElement) {
  const container = document.createElement('div');
  document.body.appendChild(container);
  await act(async () => {
    createRoot(container).render(node);
  });
  return container;
}

describe('RunSummaryStrip level-cap chip', () => {
  it('renders the cap as a button that invokes onGoToBosses when a next boss exists', async () => {
    nextBoss.mockReturnValue({ name: 'Katy', aceLevel: 15 });
    const onGoToBosses = vi.fn();
    const container = await render(
      <RunSummaryStrip events={[]} state={state} ctx={ctx} onGoToBosses={onGoToBosses} />,
    );

    const btn = container.querySelector('button.summary-cap') as HTMLButtonElement;
    expect(btn).toBeTruthy();
    expect(btn.getAttribute('aria-label')).toBe('Go to Boss Fights');
    expect(btn.textContent).toContain('Lv 15');
    expect(btn.textContent).toContain('Katy');

    await act(async () => {
      btn.click();
    });
    expect(onGoToBosses).toHaveBeenCalledTimes(1);
  });

  it('renders the cap as a plain div (not a button) when no handler is wired', async () => {
    nextBoss.mockReturnValue({ name: 'Katy', aceLevel: 15 });
    const container = await render(<RunSummaryStrip events={[]} state={state} ctx={ctx} />);

    // Still shows the cap, but as a non-interactive chip — never a dead button.
    expect(container.querySelector('div.summary-cap')).toBeTruthy();
    expect(container.querySelector('button.summary-cap')).toBeNull();
  });
});
