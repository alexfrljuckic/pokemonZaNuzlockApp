import { describe, expect, it } from 'vitest';
import { DATASETS, GAMES, gameName } from './index';

// The dataset-guard contract RunView's unsupported-run panel relies on:
// unknown/legacy game ids must look up to undefined (and get caught by the
// guard) rather than reaching deriveState.
describe('dataset registry guard', () => {
  it('resolves every registered game', () => {
    for (const g of GAMES) {
      expect(DATASETS[g.dataset.gameId]).toBe(g.dataset);
    }
  });

  it('is undefined for unknown game ids', () => {
    expect(DATASETS['no-such-game']).toBeUndefined();
  });
});

describe('gameName', () => {
  it('returns the friendly name without the franchise prefix', () => {
    for (const g of GAMES) {
      const name = gameName(g.dataset.gameId);
      expect(name).not.toMatch(/^Pokémon\s/);
      expect(name.length).toBeGreaterThan(0);
    }
  });

  it('falls back to the raw id for unknown games (rows must still render for export/delete)', () => {
    expect(gameName('no-such-game')).toBe('no-such-game');
  });
});
