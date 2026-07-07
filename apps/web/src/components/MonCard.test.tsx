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
    // held item now shown as a sprite (with text fallback on 404); nature stays text
    const itemImg = glance!.querySelector('.item-sprite') as HTMLImageElement | null;
    expect(itemImg?.getAttribute('src')).toContain('oran-berry.png');
    expect(itemImg?.getAttribute('alt')).toBe('oran berry');
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

  it('marks the nature-raised stat with an up arrow and the lowered stat with a down arrow', async () => {
    // Adamant: +Attack / −Sp. Atk (labels "Atk" / "SpA")
    const { container, click } = await render(
      <MonCard p={{ ...mon, nature: 'adamant' }} gameId="bdsp" />,
    );
    await click(container.querySelector('.mon-card-head')!);
    const bars = [...container.querySelectorAll('.statbar')];
    const barFor = (label: string) =>
      bars.find((b) => b.querySelector('.statbar-label')?.textContent?.startsWith(label));

    const atk = barFor('Atk')!;
    const spa = barFor('SpA')!;
    expect(atk.querySelector('.statbar-nature-raised')).toBeTruthy();
    expect(atk.querySelector('.statbar-nature-raised')?.textContent).toBe('▲');
    expect(spa.querySelector('.statbar-nature-lowered')).toBeTruthy();
    expect(spa.querySelector('.statbar-nature-lowered')?.textContent).toBe('▼');
    // the tooltip reads the nature + which stat it moves
    expect(atk.querySelector('.statbar-nature')?.getAttribute('title')).toContain('Adamant');
    expect(atk.querySelector('.statbar-nature')?.getAttribute('title')).toContain('raises');
    // exactly one up and one down arrow across all bars — HP never gets one
    expect(container.querySelectorAll('.statbar-nature-raised').length).toBe(1);
    expect(container.querySelectorAll('.statbar-nature-lowered').length).toBe(1);
  });

  it('renders no nature arrows for a natureless mon or a neutral nature', async () => {
    const none = await render(<MonCard p={{ ...mon, nature: undefined }} gameId="bdsp" />);
    await none.click(none.container.querySelector('.mon-card-head')!);
    expect(none.container.querySelector('.statbar-nature')).toBeNull();

    const neutral = await render(<MonCard p={{ ...mon, nature: 'hardy' }} gameId="bdsp" />);
    await neutral.click(neutral.container.querySelector('.mon-card-head')!);
    expect(neutral.container.querySelector('.statbar-nature')).toBeNull();
  });

  it('shows the type matchups — weaknesses, resistances and immunities — in the expanded detail', async () => {
    // bulbasaur is grass/poison: weak to fire/psychic/flying/ice, resists water/grass/fighting/fairy, no immunity
    const { container, click } = await render(<MonCard p={mon} gameId="bdsp" />);
    await click(container.querySelector('.mon-card-head')!);
    const matchups = container.querySelector('.mrd-matchups')!;
    expect(matchups).toBeTruthy();

    const weak = matchups.querySelector('.mrd-mu-weak')!;
    expect(weak).toBeTruthy();
    expect(weak.textContent).toContain('Weak');
    expect(weak.textContent).toContain('fire');
    // each chip carries its multiplier — grass/poison is weak ×2 to fire
    expect(weak.textContent).toContain('×2');

    const resist = matchups.querySelector('.mrd-mu-resist')!;
    expect(resist).toBeTruthy();
    expect(resist.textContent).toContain('Resists');
    expect(resist.textContent).toContain('×½');
    // grass/poison resists water and fighting; NOT fire (a weakness)
    expect(resist.textContent).toContain('water');
    expect(resist.textContent).toContain('fighting');
    expect(resist.textContent).not.toContain('fire');

    // no immunity for grass/poison — the group is absent, not empty
    expect(matchups.querySelector('.mrd-mu-immune')).toBeNull();
  });

  it('renders the Immune-to group for a mon with a ×0 matchup (gengar → normal/fighting)', async () => {
    // gengar is ghost/poison: immune to normal (ghost) and fighting (ghost)
    const { container, click } = await render(
      <MonCard p={{ ...mon, species: 'gengar' }} gameId="bdsp" />,
    );
    await click(container.querySelector('.mon-card-head')!);
    const immune = container.querySelector('.mrd-mu-immune')!;
    expect(immune).toBeTruthy();
    expect(immune.textContent).toContain('Immune');
    expect(immune.textContent).toContain('normal');
    expect(immune.textContent).toContain('fighting');
  });

  it('shows a Boxed status chip for boxed mons and a Fainted chip for dead ones', async () => {
    const boxed = await render(<MonCard p={{ ...mon, status: 'box' }} gameId="bdsp" />);
    expect(boxed.container.querySelector('.mon-status-box')?.textContent).toBe('Boxed');

    const dead = await render(
      <MonCard
        p={{ ...mon, status: 'dead', death: { at: 't0', cause: 'a wild Bidoof', killer: 'Bidoof' } }}
        gameId="bdsp"
      />,
    );
    expect(dead.container.querySelector('.mon-status-dead')?.textContent).toBe('Fainted');
    // Team & Box is the graveyard's single home now — the cause shows at a glance
    expect(dead.container.querySelector('.mon-card-death')?.textContent).toContain('a wild Bidoof');
  });
});
