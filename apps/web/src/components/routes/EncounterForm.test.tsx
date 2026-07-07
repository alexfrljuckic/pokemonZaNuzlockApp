// @vitest-environment happy-dom
import { describe, expect, it } from 'vitest';
import { act } from 'react';
import { createRoot } from 'react-dom/client';
import type { ClassifiedEncounter } from '@nuzlocke/engine';
import { EncounterForm } from './EncounterForm';

(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;

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

const avail = (species: string): ClassifiedEncounter => ({
  slot: { species, methods: ['walk'], rate: 40 },
  available: true,
});
const dimmed = (species: string): ClassifiedEncounter => ({
  slot: { species, methods: ['walk'], rate: 40 },
  available: false,
  reason: 'dupes-clause',
});

const slotFor = (container: HTMLElement, species: string) =>
  [...container.querySelectorAll('button.encounter-slot')].find(
    (b) => b.querySelector('.encounter-slot-name')?.textContent === species,
  ) as HTMLButtonElement | undefined;

describe('EncounterForm dupes-dimmed species', () => {
  it('renders a dupes-excluded species as a dimmed, disabled card with a reason', async () => {
    const { container } = await render(
      <EncounterForm pool={[avail('weedle'), dimmed('caterpie')]} scope="evolution-line" onResolve={() => {}} />,
    );
    const dimmedBtn = slotFor(container, 'caterpie')!;
    const availBtn = slotFor(container, 'weedle')!;

    // dimmed card: disabled, flagged unavailable, reason in tag + title + aria
    expect(dimmedBtn.disabled).toBe(true);
    expect(dimmedBtn.classList.contains('encounter-slot-unavailable')).toBe(true);
    const tag = dimmedBtn.querySelector('.encounter-slot-unavailable-tag');
    expect(tag?.textContent).toContain('evolution line');
    expect(dimmedBtn.getAttribute('title')).toContain('evolution line');
    expect(dimmedBtn.getAttribute('aria-label')).toContain('evolution line');

    // available card: interactive, not disabled
    expect(availBtn.disabled).toBe(false);
    expect(availBtn.classList.contains('encounter-slot-unavailable')).toBe(false);
  });

  it('does not select a dimmed species on click (non-selectable)', async () => {
    const { container, click } = await render(
      <EncounterForm pool={[avail('weedle'), dimmed('caterpie')]} scope="evolution-line" onResolve={() => {}} />,
    );
    const dimmedBtn = slotFor(container, 'caterpie')!;
    await click(dimmedBtn);
    // still not the selected slot (disabled buttons don't fire, and no onClick)
    expect(dimmedBtn.classList.contains('selected')).toBe(false);
  });

  it('worded for species scope reads "Already caught this species"', async () => {
    const { container } = await render(
      <EncounterForm pool={[avail('weedle'), dimmed('caterpie')]} scope="species" onResolve={() => {}} />,
    );
    const tag = slotFor(container, 'caterpie')!.querySelector('.encounter-slot-unavailable-tag');
    expect(tag?.textContent).toContain('species');
  });

  it('an all-dimmed area still shows the species and offers a skip affordance', async () => {
    let skipped = false;
    const { container } = await render(
      <EncounterForm
        pool={[dimmed('caterpie'), dimmed('weedle')]}
        scope="evolution-line"
        onResolve={() => {}}
        onSkip={() => {
          skipped = true;
        }}
      />,
    );
    // both species still rendered (player sees what lives here)
    expect(slotFor(container, 'caterpie')).toBeTruthy();
    expect(slotFor(container, 'weedle')).toBeTruthy();
    // no catch action; a skip button is present and reachable
    expect(container.querySelector('.encounter-actions')).toBeNull();
    const skip = container.querySelector('.encounter-all-dimmed button') as HTMLButtonElement;
    expect(skip).toBeTruthy();
    skip.click();
    expect(skipped).toBe(true);
  });
});
