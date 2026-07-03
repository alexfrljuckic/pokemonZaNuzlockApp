import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';

const here = dirname(fileURLToPath(import.meta.url));
const lines = JSON.parse(
  readFileSync(join(here, '../../datasets/generated/species-lines.json'), 'utf8'),
) as Record<string, string>;

// v1 hyperspace-hole pools were never fully specified; the port keeps their
// placeholder entries. The dupes clause falls back to the raw slug for these.
const PLACEHOLDER_SLUGS = new Set(['etc', 'rare-encounters']);

describe('generated species-lines map', () => {
  it('covers every species used by the shipped datasets', () => {
    for (const game of ['bdsp', 'plza']) {
      const dataset = JSON.parse(
        readFileSync(join(here, `../../datasets/games/${game}.json`), 'utf8'),
      );
      const slugs = new Set<string>();
      for (const area of dataset.areas) for (const e of area.encounters) slugs.add(e.species);
      for (const s of dataset.specials ?? []) if (s.species) slugs.add(s.species);
      const missing = [...slugs].filter((s) => !(s in lines) && !PLACEHOLDER_SLUGS.has(s));
      expect(missing, `${game} species missing from species-lines.json`).toEqual([]);
    }
  });

  it('groups evolution families under one line id', () => {
    expect(lines['bunnelby']).toBe(lines['diggersby']);
    expect(lines['starly']).toBe(lines['staravia']);
    expect(lines['floatzel']).toBe(lines['buizel']);
    expect(lines['bunnelby']).not.toBe(lines['mareep']);
  });

  it('maps regional forms and their exclusive evolutions where PokeAPI says so', () => {
    // Varieties share their species' chain.
    expect(lines['stunfisk-galar']).toBe(lines['stunfisk']);
    expect(lines['floette-eternal']).toBe(lines['floette']);
    // Cross-form evolutions stay in the family chain: catching a Galarian
    // Meowth locks the whole Meowth line under the dupes clause.
    expect(lines['meowth-galar']).toBe(lines['meowth']);
    expect(lines['perrserker']).toBe(lines['meowth']);
    expect(lines['sirfetchd']).toBe(lines['farfetchd']);
  });
});
