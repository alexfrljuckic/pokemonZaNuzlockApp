// @vitest-environment happy-dom
import { describe, expect, it } from 'vitest';
import { act } from 'react';
import { createRoot } from 'react-dom/client';
import type { Area } from '@nuzlocke/engine';
import { ItemsHere } from './ItemsHere';

(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;

function areaWith(items: Area['items']): Area {
  return {
    id: 'route-219',
    name: 'Route 219',
    unlockAfter: null,
    tags: ['route'],
    encounters: [],
    items,
  };
}

async function render(node: React.ReactElement) {
  const container = document.createElement('div');
  document.body.appendChild(container);
  const root = createRoot(container);
  await act(async () => {
    root.render(node);
  });
  return container;
}

describe('ItemsHere access requirements', () => {
  it('renders a "Requires Surf" access badge + accessible label for an access-gated item', async () => {
    const container = await render(
      <ItemsHere area={areaWith([{ name: 'Super Potion', access: ['surf'] }])} version="brilliant-diamond" />,
    );
    const badge = container.querySelector('.item-access');
    expect(badge).not.toBeNull();
    expect(badge?.textContent).toBe('Surf');
    const chip = container.querySelector('button.item-chip');
    // Requirement surfaces both in the accessible label and the hover title.
    expect(chip?.getAttribute('aria-label')).toContain('Requires Surf');
    expect(chip?.getAttribute('title')).toContain('Requires Surf');
  });

  it('joins multiple field moves in the requirement label', async () => {
    const container = await render(
      <ItemsHere
        area={areaWith([{ name: 'Wave Incense', access: ['surf', 'waterfall'] }])}
        version="brilliant-diamond"
      />,
    );
    const badges = [...container.querySelectorAll('.item-access')].map((b) => b.textContent);
    expect(badges).toEqual(['Surf', 'Waterfall']);
    const chip = container.querySelector('button.item-chip');
    expect(chip?.getAttribute('aria-label')).toContain('Requires Surf + Waterfall');
  });

  it('renders no access badge and no requirement label for a freely reachable item', async () => {
    const container = await render(
      <ItemsHere area={areaWith([{ name: 'Potion' }])} version="brilliant-diamond" />,
    );
    expect(container.querySelector('.item-access')).toBeNull();
    const chip = container.querySelector('button.item-chip');
    expect(chip?.getAttribute('aria-label')).toBeNull();
    // Read-only chips still get no mark/unmark tooltip when there is nothing to note.
    expect(chip?.getAttribute('title') ?? '').not.toContain('Requires');
  });
});
