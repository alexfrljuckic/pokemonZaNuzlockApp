// @vitest-environment happy-dom
import { describe, expect, it } from 'vitest';
import { act } from 'react';
import type { ReactElement } from 'react';
import { createRoot } from 'react-dom/client';
import { ItemSprite } from './ItemSprite';

(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;

async function render(ui: ReactElement) {
  const container = document.createElement('div');
  document.body.appendChild(container);
  const root = createRoot(container);
  await act(async () => {
    root.render(ui);
  });
  return container;
}

describe('ItemSprite', () => {
  it('renders the Showdown item icon for a held-item slug', async () => {
    const container = await render(<ItemSprite item="choice-band" />);
    const img = container.querySelector('img.item-sprite') as HTMLImageElement;
    expect(img).toBeTruthy();
    expect(img.getAttribute('src')).toContain('itemicons/choice-band.png');
    expect(img.getAttribute('alt')).toBe('choice band');
    expect(container.querySelector('.item-sprite-fallback')).toBeNull();
  });

  it('falls back to "@ name" text when the icon fails to load', async () => {
    const container = await render(<ItemSprite item="made-up-item" />);
    const img = container.querySelector('img.item-sprite') as HTMLImageElement;
    await act(async () => {
      img.dispatchEvent(new Event('error'));
    });
    expect(container.querySelector('img.item-sprite')).toBeNull();
    expect(container.querySelector('.item-sprite-fallback')?.textContent).toBe('@ made up item');
  });
});
