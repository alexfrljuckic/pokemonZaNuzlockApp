import { describe, expect, it } from 'vitest';
import { evoItemHint, tradeHint } from './evolutionHints';

// Smoke tests over the curated where-to-find data — full accuracy lives with
// the cited sources; these pin the load-bearing game differences.
describe('evolution item hints', () => {
  it('covers the classic stones per game', () => {
    expect(evoItemHint('fire-stone', 'bdsp')).toMatch(/Grand Underground/);
    expect(evoItemHint('fire-stone', 'lgpe')).toMatch(/Celadon/);
    expect(evoItemHint('fire-stone', 'swsh')).toMatch(/Lake of Outrage/);
    expect(evoItemHint('fire-stone', 'sv')).toMatch(/Delibird/);
  });

  it('knows the Legends games differ on trading', () => {
    expect(tradeHint('pla')).toMatch(/Linking Cord/i); // no trading needed
    expect(tradeHint('plza')).toMatch(/no Linking Cord/i); // real trades only
    expect(tradeHint('bdsp')).toMatch(/trade/i);
  });

  it('degrades to null for unknown items/games', () => {
    expect(evoItemHint('unknown-item', 'bdsp')).toBeNull();
    expect(evoItemHint('fire-stone', 'not-a-game')).toBeNull();
    expect(evoItemHint(null, 'bdsp')).toBeNull();
    expect(tradeHint('not-a-game')).toBeNull();
  });
});
