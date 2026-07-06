// @vitest-environment happy-dom
import { describe, expect, it } from 'vitest';
import { act } from 'react';
import { createRoot } from 'react-dom/client';
import { TrainerSprite } from './TrainerSprite';

// The core guarantee: a trainer sprite that fails to load (or has no key) must
// still show SOMETHING — the bundled generic silhouette, never a blank slot.

(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;

async function render(node: React.ReactElement) {
  const container = document.createElement('div');
  document.body.appendChild(container);
  await act(async () => {
    createRoot(container).render(node);
  });
  return container;
}

describe('TrainerSprite', () => {
  it('renders the Showdown <img> for a resolvable key', async () => {
    const c = await render(<TrainerSprite trainerKey="acetrainer" />);
    const img = c.querySelector('img');
    expect(img).toBeTruthy();
    expect(img!.getAttribute('src')).toContain('/trainers/acetrainer.png');
    expect(c.querySelector('svg')).toBeNull();
  });

  it('falls back to the generic silhouette when the image errors', async () => {
    const c = await render(<TrainerSprite trainerKey="doesnotexist" size={44} />);
    const img = c.querySelector('img')!;
    await act(async () => {
      img.dispatchEvent(new Event('error'));
    });
    // The <img> is gone, replaced by an inline SVG that still occupies the slot.
    expect(c.querySelector('img')).toBeNull();
    const svg = c.querySelector('svg');
    expect(svg).toBeTruthy();
    expect(svg!.getAttribute('height')).toBe('44');
    // Themeable: uses currentColor rather than a hardcoded colour.
    expect(svg!.outerHTML).toContain('currentColor');
  });

  it('renders the generic silhouette immediately when no key is given', async () => {
    const c = await render(<TrainerSprite trainerKey="" />);
    expect(c.querySelector('img')).toBeNull();
    expect(c.querySelector('svg')).toBeTruthy();
  });
});
