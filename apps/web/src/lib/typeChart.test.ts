import { describe, expect, it } from 'vitest';
import { effectiveness, immunities, resistances, weaknesses } from './typeChart';

describe('typeChart', () => {
  it('multiplies dual-type effectiveness (rock vs fire/flying = ×4)', () => {
    expect(effectiveness('rock', ['fire', 'flying'])).toBe(4);
    expect(effectiveness('electric', ['water', 'flying'])).toBe(4);
  });

  it('immunities zero the multiplier regardless of the other type', () => {
    expect(effectiveness('ground', ['electric', 'flying'])).toBe(0);
    expect(effectiveness('normal', ['ghost'])).toBe(0);
  });

  it('unknown/absent matchups are neutral ×1', () => {
    expect(effectiveness('fire', ['normal'])).toBe(1);
    expect(effectiveness('not-a-type', ['fire'])).toBe(1);
  });

  it('weaknesses returns only >1 multipliers, strongest first', () => {
    const weak = weaknesses(['grass', 'poison']); // e.g. bulbasaur
    const types = weak.map((w) => w.type);
    expect(types).toContain('fire');
    expect(types).toContain('psychic');
    expect(types).not.toContain('water'); // resisted
    // sorted: any ×4 entries come before ×2
    const xs = weak.map((w) => w.x);
    expect([...xs].sort((a, b) => b - a)).toEqual(xs);
    expect(weaknesses([])).toEqual([]);
  });

  it('resistances returns only <1 (but >0) multipliers, strongest resistance first', () => {
    const resist = resistances(['steel']); // steel resists a great many types
    const types = resist.map((r) => r.type);
    // steel resists normal, grass, ice, flying, psychic, bug, rock, dragon, steel, fairy, ...
    expect(types).toContain('grass');
    expect(types).toContain('fairy');
    // it does NOT list its weaknesses or its immunity (poison → steel = 0×)
    expect(types).not.toContain('fire'); // steel is weak to fire
    expect(types).not.toContain('poison'); // immunity, not a resistance
    // sorted strongest-resistance first (¼ before ½)
    const xs = resist.map((r) => r.x);
    expect([...xs].sort((a, b) => a - b)).toEqual(xs);
    expect(resistances([])).toEqual([]);
  });

  it('surfaces a ¼× quad-resistance for a doubly-resistant dual type', () => {
    // bug + steel resists grass ×¼ (bug ½ × steel ½)
    const resist = resistances(['bug', 'steel']);
    const grass = resist.find((r) => r.type === 'grass');
    expect(grass?.x).toBe(0.25);
  });

  it('immunities returns the ×0 types, and are absent from resistances', () => {
    // flying is immune to ground; ghost is immune to normal + fighting
    expect(immunities(['flying']).map((i) => i.type)).toContain('ground');
    const ghost = immunities(['ghost']).map((i) => i.type);
    expect(ghost).toContain('normal');
    expect(ghost).toContain('fighting');
    // an immunity is never double-counted as a resistance
    expect(resistances(['flying']).map((i) => i.type)).not.toContain('ground');
    expect(immunities([])).toEqual([]);
  });
});
