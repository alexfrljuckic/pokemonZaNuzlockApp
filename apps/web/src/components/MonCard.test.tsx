// @vitest-environment happy-dom
import { describe, expect, it } from 'vitest';
import { act } from 'react';
import { createRoot } from 'react-dom/client';
import type { PokemonInstance } from '@nuzlocke/engine';
import { MonCard } from './MonCard';

(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;

const mon: PokemonInstance = {
  id: 'm1',
  species: 'bulbasaur',
  nickname: 'Bulby',
  level: 12,
  status: 'party',
  heldItem: 'oran-berry',
  nature: 'Modest',
  moves: ['tackle', 'vine-whip'],
  origin: { areaId: 'route-201' },
};

async function render(node: React.ReactElement) {
  const container = document.createElement('div');
  document.body.appendChild(container);
  const root = createRoot(container);
  await act(async () => {
    root.render(node);
  });
  return {
    container,
    async click(el: Element) {
      await act(async () => {
        (el as HTMLElement).click();
      });
    },
  };
}

describe('MonCard full-width row layout', () => {
  it('renders as a full-width row (main strip + head button), never the old vertical grid card', async () => {
    const { container } = await render(<MonCard p={mon} gameId="bdsp" />);
    // full-width-row structure mirrors the boss-fight rows
    expect(container.querySelector('.mon-card-main')).toBeTruthy();
    expect(container.querySelector('.mon-card-head')).toBeTruthy();
    // the old vertical-card header class is gone — no grid-span reflow class either
    expect(container.querySelector('.mon-card-top')).toBeNull();
  });

  it('surfaces at-a-glance detail in the condensed row (item, nature, moves, next evolution)', async () => {
    const { container } = await render(<MonCard p={mon} gameId="bdsp" />);
    const glance = container.querySelector('.mon-card-glance');
    expect(glance).toBeTruthy();
    // held item + nature now visible WITHOUT expanding
    expect(glance!.textContent).toContain('oran-berry');
    expect(glance!.textContent).toContain('Modest');
    // the condensed row shows moves (more useful than the stat spread here)
    const moves = container.querySelector('.mon-card-moves');
    expect(moves).toBeTruthy();
    expect(moves!.textContent).toContain('tackle');
    expect(moves!.textContent).toContain('vine whip');
    // …and no longer the base-stat spark
    expect(container.querySelector('.mon-stat-spark')).toBeNull();
    // next-evolution nudge (bulbasaur -> ivysaur)
    expect(container.querySelector('.mon-card-evo')?.textContent?.toLowerCase()).toContain('ivysaur');
  });

  it('toggles expand when clicking anywhere on the row, but not when clicking an action button', async () => {
    let boxed = 0;
    const { container, click } = await render(
      <MonCard p={mon} gameId="bdsp" actions={[{ label: 'Box', onClick: () => (boxed += 1) }]} />,
    );
    const card = container.querySelector('.mon-card')!;
    const main = container.querySelector('.mon-card-main')!;
    // clicking the row (not the head button) expands
    await click(main);
    expect(card.classList.contains('expanded')).toBe(true);
    // clicking it again collapses
    await click(main);
    expect(card.classList.contains('expanded')).toBe(false);
    // an action button fires its handler WITHOUT toggling the row open
    const boxBtn = [...container.querySelectorAll('.mon-card-actions button')].find(
      (b) => b.textContent === 'Box',
    )!;
    await click(boxBtn);
    expect(boxed).toBe(1);
    expect(card.classList.contains('expanded')).toBe(false);
  });

  it('expands in place — detail appears under the row without a wrapping change', async () => {
    const { container, click } = await render(<MonCard p={mon} gameId="bdsp" />);
    expect(container.querySelector('.mon-card-detail')).toBeNull();
    const head = container.querySelector('.mon-card-head')!;
    expect(head.getAttribute('aria-expanded')).toBe('false');
    await click(head);
    expect(head.getAttribute('aria-expanded')).toBe('true');
    // detail is a sibling of the main strip inside the same card — grows downward
    const card = container.querySelector('.mon-card')!;
    expect(card.classList.contains('expanded')).toBe(true);
    expect(card.querySelector('.mon-card-detail')).toBeTruthy();
  });

  it('shows a Boxed status chip for boxed mons and a Fainted chip for dead ones', async () => {
    const boxed = await render(<MonCard p={{ ...mon, status: 'box' }} gameId="bdsp" />);
    expect(boxed.container.querySelector('.mon-status-box')?.textContent).toBe('Boxed');

    const dead = await render(<MonCard p={{ ...mon, status: 'dead' }} gameId="bdsp" />);
    expect(dead.container.querySelector('.mon-status-dead')?.textContent).toBe('Fainted');
  });
});
