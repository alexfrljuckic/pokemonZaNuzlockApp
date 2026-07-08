// @vitest-environment happy-dom
import { describe, expect, it } from 'vitest';
import { act } from 'react';
import { createRoot } from 'react-dom/client';
import type { ClassifiedEncounter } from '@nuzlocke/engine';
import { EncounterForm, timeChip } from './EncounterForm';

describe('timeChip (time-of-day summary)', () => {
  it('flags a time-exclusive spawn with "Only …"', () => {
    expect(timeChip({ night: 10 }, true)).toEqual({ text: 'Only Night 10%', restricted: true });
    expect(timeChip({ morning: 30, night: 30 }, true)).toEqual({ text: 'Only Morning/Night 30%', restricted: true });
  });

  it('shows per-period rates when a species spawns all day but rates vary', () => {
    expect(timeChip({ morning: 30, day: 40, night: 30 }, true)).toEqual({
      text: 'Morning/Night 30% · Day 40%',
      restricted: false,
    });
  });

  it('returns null when there is no time relevance', () => {
    expect(timeChip({}, false)).toBeNull(); // no time condition at all
    expect(timeChip({ morning: 40, day: 40, night: 40 }, true)).toBeNull(); // all day, one rate
  });
});

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
const slot = (species: string, method: string, rate?: number, available = true): ClassifiedEncounter => ({
  slot: { species, methods: [method], rate },
  available,
  ...(available ? {} : { reason: 'dupes-clause' as const }),
});

const slotFor = (container: HTMLElement, species: string) =>
  [...container.querySelectorAll('button.encounter-slot')].find(
    (b) => b.querySelector('.encounter-slot-name')?.textContent === species,
  ) as HTMLButtonElement | undefined;

/** The card for a species inside a named group section (Walking/Surfing/...). */
const slotInGroup = (container: HTMLElement, groupLabel: string, species: string) => {
  const group = [...container.querySelectorAll('.encounter-group')].find(
    (g) => g.querySelector('.encounter-group-label')?.textContent === groupLabel,
  );
  if (!group) return undefined;
  return [...group.querySelectorAll('button.encounter-slot')].find(
    (b) => b.querySelector('.encounter-slot-name')?.textContent === species,
  ) as HTMLButtonElement | undefined;
};

const groupLabels = (container: HTMLElement) =>
  [...container.querySelectorAll('.encounter-group-label')].map((el) => el.textContent);

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

describe('EncounterForm method grouping', () => {
  it('shows a species at its real per-method rate under BOTH groups, not a merged max', async () => {
    // Psyduck: 2% walking + 30% surfing, stored as separate slots.
    const { container } = await render(
      <EncounterForm
        pool={[slot('psyduck', 'walk', 2), slot('psyduck', 'surf', 30)]}
        onResolve={() => {}}
      />,
    );
    const walking = slotInGroup(container, 'Walking', 'psyduck')!;
    const surfing = slotInGroup(container, 'Surfing', 'psyduck')!;
    expect(walking).toBeTruthy();
    expect(surfing).toBeTruthy();
    // Walking card shows 2%, Surfing card shows 30% — no cross-group max.
    expect(walking.querySelector('.encounter-slot-method')?.textContent).toContain('2%');
    expect(surfing.querySelector('.encounter-slot-method')?.textContent).toContain('30%');
    // Neither card shows a merged "walk/surf" label anywhere.
    expect(container.textContent).not.toContain('walk/surf');
  });

  it('orders groups Walking → Surfing → Fishing → Other and omits empty ones', async () => {
    const { container } = await render(
      <EncounterForm
        pool={[
          slot('pidgey', 'static', 100), // Other
          slot('magikarp', 'old-rod', 100), // Fishing
          slot('rattata', 'walk', 50), // Walking
        ]}
        onResolve={() => {}}
      />,
    );
    // Surfing is absent (empty) and omitted; the rest keep canonical order.
    expect(groupLabels(container)).toEqual(['Walking', 'Fishing', 'Other']);
  });

  it('keeps per-sub-method fishing tiers instead of merging them', async () => {
    const { container } = await render(
      <EncounterForm
        pool={[slot('goldeen', 'good-rod', 55), slot('goldeen', 'super-rod', 40)]}
        onResolve={() => {}}
      />,
    );
    const fishing = slotInGroup(container, 'Fishing', 'goldeen')!;
    const label = fishing.querySelector('.encounter-slot-method')?.textContent ?? '';
    // both tiers surface with their own rate, labelled, not collapsed to a max
    expect(label).toContain('good-rod 55%');
    expect(label).toContain('super-rod 40%');
  });

  it('resolves the right species when it appears in two groups', async () => {
    let resolved: string | undefined;
    const { container, click } = await render(
      <EncounterForm
        pool={[slot('psyduck', 'walk', 2), slot('psyduck', 'surf', 30), slot('pidgey', 'walk', 40)]}
        onResolve={(sp) => {
          resolved = sp;
        }}
      />,
    );
    // Select psyduck via its Surfing card, then Caught.
    const surfing = slotInGroup(container, 'Surfing', 'psyduck')!;
    await click(surfing);
    // Both psyduck cards reflect the selection (selection is keyed by species).
    expect(slotInGroup(container, 'Walking', 'psyduck')!.classList.contains('selected')).toBe(true);
    expect(surfing.classList.contains('selected')).toBe(true);
    const caught = [...container.querySelectorAll('.encounter-actions button')].find(
      (b) => b.textContent === 'Caught',
    ) as HTMLButtonElement;
    await click(caught);
    expect(resolved).toBe('psyduck');
  });

  it('keeps a dupes-dimmed species dimmed within its method group (no #217 regression)', async () => {
    const { container } = await render(
      <EncounterForm
        pool={[slot('tentacool', 'surf', 60, false), slot('psyduck', 'surf', 30)]}
        scope="evolution-line"
        onResolve={() => {}}
      />,
    );
    const dimmedBtn = slotInGroup(container, 'Surfing', 'tentacool')!;
    expect(dimmedBtn.disabled).toBe(true);
    expect(dimmedBtn.classList.contains('encounter-slot-unavailable')).toBe(true);
    expect(dimmedBtn.querySelector('.encounter-slot-unavailable-tag')?.textContent).toContain('evolution line');
  });
});
