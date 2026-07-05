import { describe, expect, it } from 'vitest';
import { expectedMovesAt, learnLevel, levelUpMovesFor, machineType, movesFor, typesFor } from './speciesData';

// These run against the real generated species-data / machines-by-game
// artifacts, locking the per-game → union fallback semantics the pickers
// depend on (docs/CONSOLIDATION.md C7).

describe('movesFor', () => {
  it('scopes the movepool per game where PokeAPI documents it', () => {
    const lgpe = movesFor('pikachu', 'lgpe');
    const bdsp = movesFor('pikachu', 'bdsp');
    const union = movesFor('pikachu');
    expect(lgpe.length).toBeGreaterThan(0);
    expect(bdsp.length).toBeGreaterThan(0);
    expect(lgpe.length).not.toBe(bdsp.length); // genuinely different pools
    expect(union.length).toBeGreaterThanOrEqual(Math.max(lgpe.length, bdsp.length));
    // every per-game move is in the union
    for (const m of lgpe) expect(union).toContain(m);
  });

  it('falls back to the union pool when a game has no per-game data (Z-A)', () => {
    // PokeAPI has zero move-learn data for legends-za/mega-dimension.
    expect(movesFor('pikachu', 'plza')).toEqual(movesFor('pikachu'));
  });

  it('returns [] for unknown species instead of throwing', () => {
    expect(movesFor('not-a-species', 'bdsp')).toEqual([]);
    expect(typesFor('not-a-species')).toEqual([]);
  });
});

describe('level-up learnsets', () => {
  it('returns per-game learnsets sorted by level', () => {
    const set = levelUpMovesFor('starly', 'bdsp');
    expect(set.length).toBeGreaterThan(3);
    for (let i = 1; i < set.length; i++) expect(set[i].level).toBeGreaterThanOrEqual(set[i - 1].level);
  });

  it('learnLevel answers for level-up moves and null otherwise', () => {
    const set = levelUpMovesFor('starly', 'bdsp');
    const first = set[0];
    expect(learnLevel(first.move, 'starly', 'bdsp')).toBe(first.level);
    expect(learnLevel('thunderbolt', 'starly', 'bdsp')).toBeNull(); // not a starly level-up move
    expect(learnLevel('tackle', 'starly')).toBeNull(); // no game, no answer
  });

  it('expectedMovesAt gives the last four level-up moves at a level', () => {
    const expected = expectedMovesAt('starly', 15, 'bdsp');
    expect(expected).not.toBeNull();
    expect(expected!.length).toBeLessThanOrEqual(4);
    for (const m of expected!) expect(learnLevel(m, 'starly', 'bdsp')!).toBeLessThanOrEqual(15);
  });

  it('returns unknown (null / empty) for Z-A, which has no PokeAPI move data', () => {
    expect(levelUpMovesFor('pikachu', 'plza')).toEqual([]);
    expect(expectedMovesAt('pikachu', 20, 'plza')).toBeNull();
  });
});

describe('machineType (per-game TM/HM/TR tags)', () => {
  it('classifies per game: thunderbolt is a TR in SwSh but a TM in BDSP', () => {
    expect(machineType('thunderbolt', 'swsh')).toBe('TR');
    expect(machineType('thunderbolt', 'bdsp')).toBe('TM');
  });

  it('PLA has no machines at all (move shop)', () => {
    expect(machineType('thunderbolt', 'pla')).toBeNull();
    expect(machineType('earthquake', 'pla')).toBeNull();
  });

  it('non-machine moves and unknown games return null', () => {
    expect(machineType('tackle', 'bdsp')).toBeNull();
    expect(machineType('thunderbolt', 'not-a-game')).toBeNull();
  });
});
