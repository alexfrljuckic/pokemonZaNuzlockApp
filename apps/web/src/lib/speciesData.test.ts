import { describe, expect, it } from 'vitest';
import { evolutionOptionsFor, expectedMovesAt, learnLevel, levelUpMovesFor, machineType, movesFor, resolveEvolutionTarget, typesFor } from './speciesData';

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

describe('evolutionOptionsFor (MonCard evolve panel)', () => {
  it('labels level, item and trade requirements', () => {
    const [grotle] = evolutionOptionsFor('turtwig', 5);
    expect(grotle.to).toBe('grotle');
    expect(grotle.requirement).toBe('Lv 18');
    expect(grotle.ready).toBe(false); // Lv 5 < 18
    expect(evolutionOptionsFor('turtwig', 18)[0].ready).toBe(true);

    const scyther = evolutionOptionsFor('scyther', 30);
    expect(scyther.find((o) => o.to === 'scizor')!.requirement).toBe('Trade holding Metal Coat');
    expect(scyther.find((o) => o.to === 'kleavor')!.requirement).toBe('Use Black Augurite');
    expect(evolutionOptionsFor('kadabra', 30)[0].requirement).toBe('Trade');
  });

  it('offers every branch of a branching family', () => {
    const eevee = evolutionOptionsFor('eevee', 20).map((o) => o.to);
    expect(eevee).toContain('vaporeon');
    expect(eevee).toContain('sylveon');
    expect(eevee.length).toBeGreaterThanOrEqual(8);
  });

  it('resolves regional-form targets when the suffixed species exists', () => {
    expect(resolveEvolutionTarget('growlithe-hisui', 'arcanine')).toBe('arcanine-hisui');
    expect(evolutionOptionsFor('growlithe-hisui', 30)[0].to).toBe('arcanine-hisui');
    // no persian-galar exists — Galarian Meowth's persian branch falls back to base
    expect(resolveEvolutionTarget('meowth-galar', 'persian')).toBe('persian');
  });
});

describe('special-condition requirement labels', () => {
  const req = (species: string, to: string, level = 50, gameId?: string) =>
    evolutionOptionsFor(species, level, gameId).find((o) => o.to === to)?.requirement;

  it('feebas → milotic names the real condition, never the generic fallback', () => {
    const general = req('feebas', 'milotic');
    expect(general).toBeDefined();
    expect(general).not.toBe('Level up (special condition)');
    expect(general).toMatch(/Prism Scale/i);
    // BDSP raises it by Beauty
    expect(req('feebas', 'milotic', 50, 'bdsp')).toMatch(/Beauty/i);
  });

  it('sylveon shows the fairy-move + friendship condition', () => {
    const label = req('eevee', 'sylveon', 20);
    expect(label).not.toBe('Level up (special condition)');
    expect(label).toMatch(/Fairy/i);
    expect(label).toMatch(/friendship/i);
  });

  it('tyrogue splits by the Atk/Def branch', () => {
    expect(req('tyrogue', 'hitmonlee', 20)).toBe('Lv 20 with Attack > Defense');
    expect(req('tyrogue', 'hitmonchan', 20)).toBe('Lv 20 with Attack < Defense');
    expect(req('tyrogue', 'hitmontop', 20)).toBe('Lv 20 with Attack = Defense');
  });

  it('covers the other curated specials that lack expressible data', () => {
    expect(req('inkay', 'malamar', 30)).toMatch(/upside down/i);
    expect(req('mantyke', 'mantine')).toMatch(/Remoraid/i);
    expect(req('milcery', 'alcremie')).toMatch(/Spin/i);
    expect(req('karrablast', 'escavalier')).toMatch(/Trade for a Shelmet/i);
    expect(req('sliggoo-hisui', 'goodra-hisui')).toMatch(/rain or fog/i);
    // ugly slug-cased triggers no longer leak through pretty()
    expect(req('bisharp', 'kingambit')).not.toMatch(/Three Defeated/);
    expect(req('stantler', 'wyrdeer')).not.toMatch(/Agile Style Move/);
  });

  it('renders friendship and known-move evolutions from the data fields', () => {
    // Riolu: minHappiness (day) — data-derived, no curated entry needed
    expect(req('riolu', 'lucario', 20)).toBe('Level up with high friendship during the day');
    // Farfetch'd → Sirfetch'd is a curated 3-crit special
    expect(req('farfetchd', 'sirfetchd')).toMatch(/critical hits/i);
  });

  it('does not regress plain level and item evolutions', () => {
    expect(req('turtwig', 'grotle', 18)).toBe('Lv 18');
    expect(evolutionOptionsFor('eevee', 20).find((o) => o.to === 'vaporeon')!.requirement).toBe('Use Water Stone');
    expect(evolutionOptionsFor('scyther', 30).find((o) => o.to === 'scizor')!.requirement).toBe('Trade holding Metal Coat');
    expect(evolutionOptionsFor('kadabra', 30)[0].requirement).toBe('Trade');
    // time-of-day level evolutions keep their level and read naturally
    expect(evolutionOptionsFor('sneasel', 40).find((o) => o.to === 'weavile')!.requirement).toMatch(/Razor Claw/i);
  });
});

describe('per-game evolution-target overrides', () => {
  const to = (opts: { to: string }[]) => opts.map((o) => o.to);

  it('PLA evolves the starter mid-stages into their Hisuian finals', () => {
    // These mid-stages aren't in any encounter pool, so PokeAPI-derived data
    // has no evolution row at all — the override injects them.
    expect(to(evolutionOptionsFor('dartrix', 36, 'pla'))).toEqual(['decidueye-hisui']);
    expect(to(evolutionOptionsFor('quilava', 36, 'pla'))).toEqual(['typhlosion-hisui']);
    expect(to(evolutionOptionsFor('dewott', 36, 'pla'))).toEqual(['samurott-hisui']);
    // level gate still applies through the override
    expect(evolutionOptionsFor('dartrix', 20, 'pla')[0].ready).toBe(false);
    expect(evolutionOptionsFor('dartrix', 36, 'pla')[0].ready).toBe(true);
  });

  it('PLA redirects suffix-less parents to the Hisuian variety', () => {
    expect(to(evolutionOptionsFor('petilil', 30, 'pla'))).toEqual(['lilligant-hisui']);
    expect(to(evolutionOptionsFor('rufflet', 60, 'pla'))).toEqual(['braviary-hisui']);
    expect(to(evolutionOptionsFor('goomy', 40, 'pla'))).toEqual(['sliggoo-hisui']);
    expect(to(evolutionOptionsFor('bergmite', 37, 'pla'))).toEqual(['avalugg-hisui']);
  });

  it('SwSh evolves Koffing into Galarian Weezing', () => {
    expect(to(evolutionOptionsFor('koffing', 35, 'swsh'))).toEqual(['weezing-galar']);
    // Galarian Darumaka → Galarian Darmanitan (Standard)
    expect(to(evolutionOptionsFor('darumaka-galar', 35, 'swsh'))).toEqual(['darmanitan-galar-standard']);
  });

  it('leaves the vanilla variety alone where no override applies', () => {
    // Koffing in a game without the override plays the PokeAPI-derived line
    // (Kanto Weezing). No non-PLA/SwSh game has Koffing in its pool, but the
    // builder must still yield the base variety when gameId lacks an override.
    expect(to(evolutionOptionsFor('koffing', 35, 'bdsp'))).toEqual(['weezing']);
    expect(to(evolutionOptionsFor('koffing', 35))).toEqual(['weezing']);
    // Petilil in SwSh (has Petilil, no Hisui override) → Kanto/Unova Lilligant
    expect(to(evolutionOptionsFor('petilil', 30, 'swsh'))).toEqual(['lilligant']);
  });

  it('overrides only fire for the matching game', () => {
    // dartrix has no derived row anywhere; outside PLA it yields nothing
    expect(evolutionOptionsFor('dartrix', 36, 'bdsp')).toEqual([]);
    expect(evolutionOptionsFor('dartrix', 36)).toEqual([]);
  });

  it('lines PokeAPI already resolves correctly need no override', () => {
    // New Hisui species and Galar cross-gen evos are their own chain node.
    expect(to(evolutionOptionsFor('scyther', 30, 'pla'))).toContain('kleavor');
    expect(to(evolutionOptionsFor('sliggoo-hisui', 40, 'pla'))).toEqual(['goodra-hisui']);
    expect(to(evolutionOptionsFor('meowth-galar', 30, 'swsh'))).toContain('perrserker');
    expect(to(evolutionOptionsFor('slowpoke-galar', 40, 'swsh'))).toEqual(
      expect.arrayContaining(['slowbro-galar', 'slowking-galar']),
    );
  });
});
