import { describe, expect, it } from 'vitest';
import { abilitiesFor, evolutionOptionsFor, expectedMovesAt, learnLevel, levelUpMovesFor, machineType, movesFor, resolveEvolutionTarget, resolveTrainerMoves, statsFor, typesFor } from './speciesData';

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

  it('uses the scraped Z-A pool when present, else the union fallback', () => {
    // PokeAPI has no legends-za learnsets; plza pools are hand-scraped from
    // Serebii (build-za-movepools.mjs) for species in the Z-A dex.
    const pika = movesFor('pikachu', 'plza');
    expect(pika.length).toBeGreaterThan(0);
    expect(pika).not.toEqual(movesFor('pikachu')); // a real Z-A pool, not the union
    // a species outside the Z-A dex has no scraped pool → union fallback.
    expect(movesFor('aerodactyl', 'plza')).toEqual(movesFor('aerodactyl'));
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

  it('has real Z-A learnsets for dex species (Serebii-scraped), null for the gaps', () => {
    const lu = levelUpMovesFor('pikachu', 'plza');
    expect(lu.length).toBeGreaterThan(0);
    for (let i = 1; i < lu.length; i++) expect(lu[i].level).toBeGreaterThanOrEqual(lu[i - 1].level);
    expect(expectedMovesAt('pikachu', 20, 'plza')).not.toBeNull();
    // a species outside the Z-A dex still has no learnset
    expect(levelUpMovesFor('aerodactyl', 'plza')).toEqual([]);
    expect(expectedMovesAt('aerodactyl', 20, 'plza')).toBeNull();
  });
});

describe('resolveTrainerMoves (trainer card moveset resolution)', () => {
  it('a normal trainer mon with level-up data yields expected (not confirmed) moves', () => {
    // Youngster Tristan's Starly on BDSP Route 202 — no documented moveset,
    // so the card shows the last four level-up moves at its level, labelled.
    const r = resolveTrainerMoves({ species: 'starly', level: 5 }, 'bdsp');
    expect(r.source).toBe('expected'); // labelled expected, NEVER confirmed
    expect(r.moves).not.toBeNull();
    expect(r.moves!.length).toBeGreaterThan(0);
    expect(r.moves!.length).toBeLessThanOrEqual(4);
    for (const m of r.moves!) expect(learnLevel(m, 'starly', 'bdsp')!).toBeLessThanOrEqual(5);
    // matches the raw fallback the note describes
    expect(r.moves).toEqual(expectedMovesAt('starly', 5, 'bdsp'));
  });

  it('documented moves are reported as confirmed and rendered as-is', () => {
    const moves = ['thunderbolt', 'quick-attack'];
    const r = resolveTrainerMoves({ species: 'pikachu', level: 30, moves }, 'bdsp');
    expect(r.source).toBe('confirmed');
    expect(r.moves).toBe(moves);
  });

  it('an empty explicit moves array is treated as undocumented, not blank-confirmed', () => {
    // Latent bug guard: [] must fall through to the expected fallback so a
    // note never renders without chips.
    const r = resolveTrainerMoves({ species: 'starly', level: 15, moves: [] }, 'bdsp');
    expect(r.source).toBe('expected');
    expect(r.moves).toEqual(expectedMovesAt('starly', 15, 'bdsp'));
  });

  it('resolves Z-A dex species to expected moves, gaps to unknown', () => {
    // pikachu now has a Serebii-scraped Z-A learnset → expected (labelled).
    const known = resolveTrainerMoves({ species: 'pikachu', level: 20 }, 'plza');
    expect(known.source).toBe('expected');
    expect(known.moves?.length).toBeGreaterThan(0);
    // a species outside the Z-A dex has no learnset → unknown, nothing invented.
    const gap = resolveTrainerMoves({ species: 'aerodactyl', level: 20 }, 'plza');
    expect(gap.source).toBe('unknown');
    expect(gap.moves).toBeNull();
  });

  it('reports unknown for an unrecognised species instead of throwing', () => {
    const r = resolveTrainerMoves({ species: 'not-a-species', level: 20 }, 'bdsp');
    expect(r.source).toBe('unknown');
    expect(r.moves).toBeNull();
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

  it('held-item evolutions with a time-of-day append the qualifier', () => {
    // Sneasel → Weavile: Razor Claw AT NIGHT (the time was being dropped).
    expect(evolutionOptionsFor('sneasel', 40).find((o) => o.to === 'weavile')!.requirement).toBe(
      'Level up holding Razor Claw at night',
    );
    // Hisuian Sneasel → Sneasler: same item, DURING THE DAY.
    expect(evolutionOptionsFor('sneasel', 40).find((o) => o.to === 'sneasler')!.requirement).toBe(
      'Level up holding Razor Claw during the day',
    );
    // Gligar → Gliscor: Razor Fang AT NIGHT.
    expect(evolutionOptionsFor('gligar', 40).find((o) => o.to === 'gliscor')!.requirement).toBe(
      'Level up holding Razor Fang at night',
    );
    // Held-item trades with no time condition are unaffected (no trailing time).
    expect(evolutionOptionsFor('onix', 30).find((o) => o.to === 'steelix')!.requirement).toBe(
      'Trade holding Metal Coat',
    );
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

describe('Z-A hyperspace regional-form evolutions', () => {
  const to = (opts: { to: string }[]) => opts.map((o) => o.to);
  const req = (species: string, target: string, level = 60) =>
    evolutionOptionsFor(species, level, 'plza').find((o) => o.to === target)?.requirement;

  it('Galarian Meowth evolves ONLY into Perrserker (no Kanto Persian branch)', () => {
    const opts = to(evolutionOptionsFor('meowth-galar', 30, 'plza'));
    expect(opts).toEqual(['perrserker']);
    expect(opts).not.toContain('persian');
    expect(req('meowth-galar', 'perrserker', 30)).toBe('Lv 28');
  });

  it('Alolan Meowth evolves ONLY into Alolan Persian by friendship', () => {
    const opts = to(evolutionOptionsFor('meowth-alola', 30, 'plza'));
    expect(opts).toEqual(['persian-alola']);
    expect(opts).not.toContain('perrserker');
    expect(req('meowth-alola', 'persian-alola', 30)).toMatch(/friendship/i);
  });

  it('Galarian Yamask evolves ONLY into Runerigus (no Unova Cofagrigus branch)', () => {
    const opts = to(evolutionOptionsFor('yamask-galar', 40, 'plza'));
    expect(opts).toEqual(['runerigus']);
    expect(opts).not.toContain('cofagrigus');
    // curated label from evolutionConditions.ts spells the real method out
    expect(req('yamask-galar', 'runerigus', 40)).toMatch(/damage/i);
  });

  it('Galarian Slowpoke uses the Galarica items, not the Kanto methods', () => {
    expect(to(evolutionOptionsFor('slowpoke-galar', 40, 'plza'))).toEqual(['slowbro-galar', 'slowking-galar']);
    expect(req('slowpoke-galar', 'slowbro-galar', 40)).toBe('Use Galarica Cuff');
    expect(req('slowpoke-galar', 'slowking-galar', 40)).toBe('Use Galarica Wreath');
  });

  it('hyperspace lines that already resolve correctly get NO override', () => {
    // Mr. Rime (Lv 42), Sirfetch'd (3 crits), Overqwil (Strong-Style ×20) and
    // Hisuian Goodra (rain/fog) resolve via the chain + curated labels — the
    // plza map must not shadow them.
    expect(to(evolutionOptionsFor('mr-mime-galar', 45, 'plza'))).toEqual(['mr-rime']);
    expect(req('mr-mime-galar', 'mr-rime', 45)).toBe('Lv 42');
    expect(to(evolutionOptionsFor('farfetchd-galar', 30, 'plza'))).toEqual(['sirfetchd']);
    expect(req('farfetchd-galar', 'sirfetchd', 30)).toMatch(/critical hits/i);
    expect(to(evolutionOptionsFor('qwilfish-hisui', 30, 'plza'))).toEqual(['overqwil']);
    expect(req('qwilfish-hisui', 'overqwil', 30)).toMatch(/Barb Barrage/i);
    expect(to(evolutionOptionsFor('sliggoo-hisui', 55, 'plza'))).toEqual(['goodra-hisui']);
  });
});

describe('Radical Red per-game stat/type/move overrides', () => {
  // RR is a ROMhack: it rebalances base stats, retypes some species and gives
  // custom learnsets. statsFor/typesFor/movesFor must return the RR value for a
  // 'radical-red' run and the untouched PokeAPI value for every mainline game.
  // Values below are asserted against the RadicalRedShowdown gen9rr4.0 mod
  // (data/mods/gen9rr4.0/pokedex.ts + learnsets.ts), the generator's source.

  it('typesFor returns the RR typing for RR, the global typing otherwise', () => {
    // Arbok: Poison → Poison/Dark in RR.
    expect(typesFor('arbok', 'radical-red')).toEqual(['poison', 'dark']);
    expect(typesFor('arbok')).toEqual(['poison']); // no gameId → global dex
    expect(typesFor('arbok', 'bdsp')).toEqual(['poison']); // mainline unaffected
    // Farfetch'd: Normal/Flying → Fighting/Flying in RR (also proves the
    // farfetchd → farfetchd id mapping resolves).
    expect(typesFor('farfetchd', 'radical-red')).toEqual(['fighting', 'flying']);
    expect(typesFor('farfetchd')).toEqual(['normal', 'flying']);
  });

  it('statsFor returns the RR spread for RR, the global spread otherwise', () => {
    // Butterfree: SpA 90 → 95 in RR (types unchanged).
    expect(statsFor('butterfree', 'radical-red')!['special-attack']).toBe(95);
    expect(statsFor('butterfree')!['special-attack']).toBe(90); // global
    expect(statsFor('butterfree', 'swsh')!['special-attack']).toBe(90); // mainline unaffected
    // Arbok: HP 60 → 75, Def 69 → 75 in RR.
    expect(statsFor('arbok', 'radical-red')).toMatchObject({ hp: 75, defense: 75, attack: 95 });
    expect(statsFor('arbok')).toMatchObject({ hp: 60, defense: 69 });
    // Farfetch'd: HP 52 → 75, Def 55 → 70, SpD 62 → 77 in RR.
    expect(statsFor('farfetchd', 'radical-red')).toMatchObject({ hp: 75, defense: 70, 'special-defense': 77 });
    expect(statsFor('farfetchd')).toMatchObject({ hp: 52, defense: 55, 'special-defense': 62 });
  });

  it('mainline stats/types are byte-for-byte unchanged (no gameId AND for a mainline game)', () => {
    // Guard against the override layer leaking into mainline games. Venusaur is
    // not restatted/retyped by RR, so all three must be identical.
    expect(typesFor('venusaur')).toEqual(['grass', 'poison']);
    expect(typesFor('venusaur', 'radical-red')).toEqual(['grass', 'poison']);
    expect(statsFor('pikachu')).toEqual(statsFor('pikachu', 'lgpe'));
    expect(typesFor('pikachu')).toEqual(typesFor('pikachu', 'bdsp'));
  });

  it('movesFor / levelUpMovesFor use the RR learnset, differing from the union', () => {
    const rr = movesFor('butterfree', 'radical-red');
    const union = movesFor('butterfree');
    expect(rr.length).toBeGreaterThan(0);
    expect(rr).not.toEqual(union); // a real RR pool, not the union
    // RR butterfree learns Poison Powder at Lv 13 (9L13 in the mod).
    expect(learnLevel('poison-powder', 'butterfree', 'radical-red')).toBe(13);
    const lu = levelUpMovesFor('butterfree', 'radical-red');
    expect(lu.length).toBeGreaterThan(0);
    for (let i = 1; i < lu.length; i++) expect(lu[i].level).toBeGreaterThanOrEqual(lu[i - 1].level);
    // Quiver Dance is an RR level-up move (9L58) — in the RR pool.
    expect(rr).toContain('quiver-dance');
  });

  it('a species with no RR override falls back to the global value', () => {
    // Venusaur has an inherit entry in RR but no baseStats/types delta, so it
    // gets no stat/type override — statsFor/typesFor fall back to the global
    // dex for it under 'radical-red'.
    expect(statsFor('venusaur', 'radical-red')).toEqual(statsFor('venusaur'));
    expect(typesFor('venusaur', 'radical-red')).toEqual(typesFor('venusaur'));
  });

  it('abilitiesFor returns the RR ability set for RR, the global set otherwise', () => {
    // RR retweaks each species' ability slots. Concrete before → after
    // (from the gen9rr4.0 pokedex.ts abilities field):
    //   arbok:     unnerve → strong-jaw (hidden slot)
    //   farfetchd: keen-eye/defiant → frisk/sharpness
    //   pidgeot:   keen-eye/tangled-feet/big-pecks → frisk/no-guard
    expect(abilitiesFor('arbok', 'radical-red')).toEqual(['intimidate', 'shed-skin', 'strong-jaw']);
    expect(abilitiesFor('farfetchd', 'radical-red')).toEqual(['frisk', 'inner-focus', 'sharpness']);
    expect(abilitiesFor('pidgeot', 'radical-red')).toEqual(['frisk', 'no-guard']);
    // The RR set genuinely DIFFERS from the mainline/global value…
    expect(abilitiesFor('arbok', 'radical-red')).not.toEqual(abilitiesFor('arbok'));
    expect(abilitiesFor('farfetchd', 'radical-red')).not.toEqual(abilitiesFor('farfetchd'));
    // …and the mainline value is the untouched PokeAPI set.
    expect(abilitiesFor('arbok')).toEqual(['intimidate', 'shed-skin', 'unnerve']);
    expect(abilitiesFor('arbok', 'bdsp')).toEqual(['intimidate', 'shed-skin', 'unnerve']); // other game unaffected
  });

  it('a species RR does not retweak falls back to the global abilities', () => {
    // Butterfree carries no `abilities` field in the RR mod, so there's no
    // 'radical-red' override — abilitiesFor falls back to the global dex.
    expect(abilitiesFor('butterfree', 'radical-red')).toEqual(abilitiesFor('butterfree'));
    expect(abilitiesFor('butterfree', 'radical-red')).toEqual(['compound-eyes', 'tinted-lens']);
    // No gameId also uses the global dex.
    expect(abilitiesFor('pikachu')).toEqual(['static', 'lightning-rod']);
  });

  it('keeps RR-custom abilities (no PokeAPI equivalent) as their normalized slug', () => {
    // Blaziken's RR slot-0 ability is "Striker", an RR-custom ability with no
    // PokeAPI entry — it's kept verbatim as a normalized slug (the picker is a
    // free-text combobox; abilities aren't referentially validated).
    expect(abilitiesFor('blaziken', 'radical-red')).toContain('striker');
  });
});
