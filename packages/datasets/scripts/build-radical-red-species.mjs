// Builds generated/radical-red-species.json — the per-species Radical Red
// (gameId `radical-red`) STAT / TYPE / MOVEPOOL overrides. Radical Red is a
// ROMhack that rebalances base stats, retypes some species and gives custom
// learnsets, so the PokeAPI-derived values in species-data.json are wrong for
// an RR run. This script pulls the authoritative deltas straight from the
// RadicalRedShowdown Pokémon Showdown mod and emits per-game overrides that
// build-species-data.mjs slots under `statsByGame['radical-red']`,
// `typesByGame['radical-red']`, `movesByGame['radical-red']` and
// `levelUpMovesByGame['radical-red']`.
//
// Source (Showdown TS modules on the `master` branch):
//   data/mods/gen9rr4.0/pokedex.ts   — species deltas (baseStats, types, ...)
//   data/mods/gen9rr4.0/learnsets.ts — per-species learnsets (Showdown codes)
// Each is `export const X: TYPE = { ... };` where the value is plain JS
// (strings/numbers/arrays/objects). We strip the `export const X: TYPE =`
// prefix + trailing `;` and evaluate the object literal in a sandbox via
// `new Function('return ' + literal)()` — NO TypeScript type-checking.
//
// `inherit: true` on a species means "start from the BASE species data and
// apply ONLY these deltas". We resolve that against the CURRENT base data in
// species-data.json (stats/types). Full new entries with no `inherit` are RR
// megas / new formes — OUT OF SCOPE (skipped, reported).
//
// Showdown keys are ids (lowercase, punctuation-stripped: `venusaur`,
// `mrmime`, `nidoranf`). Our datasets use PokeAPI slugs (`mr-mime`,
// `nidoran-f`). We map Showdown id -> slug by building a reverse index from
// the slug set in species-data.json (`data.stats` keys): a slug matches when
// its id-normalization (strip hyphens/punctuation, lowercase) equals the
// Showdown id, plus a few explicit aliases. Anything that can't be confidently
// mapped is SKIPPED and reported — never guessed.
//
// Learnset move codes: `9L<n>` = level-up at level n; `9M` = TM/HM machine;
// `9T` = tutor; `9E` = egg; `9R`/`9S` = reminder/special. The movepool is the
// union of every move id; level-up moves keep their `9L<n>` level. Every move
// id is mapped to a PokeAPI move slug (reverse index off `moveTypes` keys) and
// validated — an unmappable move is DROPPED and reported (never emitted, would
// fail validate:datasets).
//
// Abilities: RR retweaks many species' ability sets. Showdown stores them as
// `abilities: {0: "Intimidate", 1: "Moxie", H: "Compound Eyes"}` (0/1 regular
// slots, H hidden). Even on an `inherit:true` entry an `abilities` field is a
// FULL REPLACEMENT (not a partial delta), so we emit an override only for
// species that actually carry one. Each name is normalized to a PokeAPI ability
// slug (lowercase, spaces->hyphens, apostrophes/periods stripped:
// "Compound Eyes" -> "compound-eyes", "Lightning Rod" -> "lightning-rod").
// RR-custom abilities with no PokeAPI equivalent are kept as their normalized
// slug (the picker is a free-text combobox; abilities aren't referentially
// validated) and reported so they can be eyeballed.
//
// Output (merged into species-data.json by build-species-data.mjs):
//   {
//     statsByGame:        { "<slug>": {hp,attack,defense,special-attack,special-defense,speed} },
//     typesByGame:        { "<slug>": ["type", ...] },
//     abilities:          { "<slug>": ["ability-slug", ...] },    // slot order incl. hidden
//     movesByGame:        { "<slug>": ["move-slug", ...] },       // full pool
//     levelUpMovesByGame: { "<slug>": [["move-slug", level], ...] } // sorted by level
//   }
//
// The raw fetched TS is cached under .cache/radical-red/ so re-runs are cheap
// (delete the dir to refresh). The emitted JSON is committed so CI needs no
// network — exactly like generated/za-movepools.json.
//
// Regenerate:
//   node packages/datasets/scripts/build-radical-red-species.mjs
//   node packages/datasets/scripts/build-species-data.mjs   # merges it in
import { mkdirSync, readFileSync, writeFileSync, existsSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = dirname(dirname(fileURLToPath(import.meta.url)));
const cacheDir = join(root, '.cache/radical-red');
const outDir = join(root, 'generated');
mkdirSync(cacheDir, { recursive: true });
mkdirSync(outDir, { recursive: true });

const RAW_BASE =
  'https://raw.githubusercontent.com/RadicalRedShowdown/pokemon-showdown/master/data/mods/gen9rr4.0';

const STAT_KEYS = { hp: 'hp', atk: 'attack', def: 'defense', spa: 'special-attack', spd: 'special-defense', spe: 'speed' };

// --- fetch a mod TS file (cached) ------------------------------------------
async function fetchTs(name) {
  const file = join(cacheDir, name);
  if (existsSync(file)) return readFileSync(file, 'utf8');
  const url = `${RAW_BASE}/${name}`;
  const res = await fetch(url, { headers: { 'User-Agent': 'Mozilla/5.0' } });
  if (!res.ok) throw new Error(`${res.status} ${res.statusText} for ${url}`);
  const text = await res.text();
  writeFileSync(file, text);
  return text;
}

// --- Parse a Showdown `export const X: TYPE = { ... };` module into its
// object literal. Strip the leading declaration up to the first `=` that
// precedes the opening brace, and the trailing `;`, then evaluate the literal
// in a sandbox. The values are plain JS, so `new Function` is sufficient (and
// tolerant of TS-flavoured object keys like numeric/`H` ability slots). ---
function parseShowdownModule(src) {
  const braceStart = src.indexOf('{', src.indexOf('='));
  const braceEnd = src.lastIndexOf('}');
  if (braceStart === -1 || braceEnd === -1 || braceEnd < braceStart) {
    throw new Error('could not locate the object literal braces');
  }
  const literal = src.slice(braceStart, braceEnd + 1);
  // eslint-disable-next-line no-new-func
  return new Function(`return (${literal});`)();
}

// --- Showdown-id normalizer: lowercase, strip everything that isn't a-z0-9.
// This is how Showdown derives its ids from names, so applying it to a PokeAPI
// slug yields the Showdown id it should match (mr-mime -> mrmime,
// nidoran-f -> nidoranf, farfetchd -> farfetchd, ho-oh -> hooh). ---
const toId = (s) => s.toLowerCase().replace(/[^a-z0-9]/g, '');

// --- Ability-name -> PokeAPI ability slug. PokeAPI slugs are the lowercased
// name with spaces -> hyphens and apostrophes/periods stripped
// ("Compound Eyes" -> "compound-eyes", "Lightning Rod" -> "lightning-rod").
// Any other punctuation collapses to a hyphen too, and repeated/edge hyphens
// are trimmed. RR-custom abilities with no PokeAPI equivalent still normalize
// cleanly and are kept as-is (the picker is free-text). ---
const toAbilitySlug = (name) =>
  name
    .toLowerCase()
    .replace(/['.]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');

async function main() {
  const speciesData = JSON.parse(readFileSync(join(outDir, 'species-data.json'), 'utf8'));
  const baseStats = speciesData.stats;
  const baseTypes = speciesData.types;
  const knownSlugs = Object.keys(baseStats);
  const knownMoves = new Set(Object.keys(speciesData.moveTypes ?? {}));

  // reverse index: Showdown id -> PokeAPI slug. Built from OUR slug set so a
  // mapping only exists for species we actually carry. A handful of slugs
  // normalize to the same id (forms); keep the shortest (base) slug, but never
  // let a form clobber an exact base match.
  const idToSlug = new Map();
  for (const slug of knownSlugs) {
    const id = toId(slug);
    const prev = idToSlug.get(id);
    if (prev == null || slug.length < prev.length) idToSlug.set(id, slug);
  }
  // reverse index for moves: Showdown move id -> PokeAPI move slug.
  const idToMove = new Map();
  for (const mv of knownMoves) {
    const id = toId(mv);
    const prev = idToMove.get(id);
    if (prev == null || mv.length < prev.length) idToMove.set(id, mv);
  }
  // Explicit move aliases: Showdown id -> PokeAPI slug where id-normalization
  // misses (Showdown renamed the move). Only wired if the target exists in our
  // move universe; otherwise the move is dropped like any other miss.
  // `visegrip` is PokeAPI's `vice-grip` (Showdown renamed Vice Grip -> Vise
  // Grip in gen 8). The rest of RR's dropped move ids (bouncybubble, sappyseed,
  // freezyfrost, sparklyswirl, zippyzap, spiritshackle, darkhole, dracobarrage,
  // aquafang, soulrobbery, forbiddenspell, sonicslash) are RR-custom or
  // Let's-Go partner moves that don't exist as slugs in our dex — dropped.
  const MOVE_ALIAS = { visegrip: 'vice-grip' };
  for (const [id, slug] of Object.entries(MOVE_ALIAS)) {
    if (knownMoves.has(slug)) idToMove.set(id, slug);
  }
  // Explicit aliases for Showdown ids whose id-normalization does NOT land on
  // our slug (default-variety forms, punctuation quirks). Only add entries
  // whose target slug actually exists in our dex.
  const SPECIES_ALIAS = {
    typenull: 'type-null',
    mimejr: 'mime-jr',
    // Showdown default-forme ids that our dex stores with a suffix:
    // (add here if a base RR entry keys a form we store suffixed)
  };
  for (const [id, slug] of Object.entries(SPECIES_ALIAS)) {
    if (baseStats[slug]) idToSlug.set(id, slug);
  }

  const [pokedexSrc, learnsetsSrc] = await Promise.all([
    fetchTs('pokedex.ts'),
    fetchTs('learnsets.ts'),
  ]);
  const pokedex = parseShowdownModule(pokedexSrc);
  const learnsets = parseShowdownModule(learnsetsSrc);

  // Set of known PokeAPI ability slugs — the union of every ability across the
  // base `abilities` dex in species-data.json. Used only to flag RR abilities
  // that DON'T correspond to a real PokeAPI ability (likely RR-custom) so the
  // PR can call them out; they're still emitted (free-text picker).
  const knownAbilities = new Set(Object.values(speciesData.abilities ?? {}).flat());

  const statsByGame = {};
  const typesByGame = {};
  const abilities = {};
  const movesByGame = {};
  const levelUpMovesByGame = {};

  const skippedNoInherit = []; // RR megas / new formes (no inherit) — out of scope
  const skippedUnmapped = []; // Showdown id we couldn't map to a slug
  const unmappedMoves = new Map(); // Showdown move id -> count (dropped)
  const customAbilities = new Map(); // ability slug not in PokeAPI -> count (kept, flagged)
  let statOverrides = 0;
  let typeOverrides = 0;
  let abilityOverrides = 0;

  // 1. Species deltas: baseStats + types. Resolve `inherit:true` against base.
  for (const [id, entry] of Object.entries(pokedex)) {
    if (!entry.inherit) {
      // full new entry = RR mega / new forme — out of scope
      skippedNoInherit.push(id);
      continue;
    }
    const slug = idToSlug.get(id) ?? SPECIES_ALIAS[id];
    if (!slug || !baseStats[slug]) {
      // an inherit entry we can't map to a dex slug (or a form our dex lacks)
      if (!baseStats[slug ?? '']) skippedUnmapped.push(id);
      continue;
    }
    if (entry.baseStats) {
      const st = {};
      for (const [k, dest] of Object.entries(STAT_KEYS)) st[dest] = entry.baseStats[k];
      statsByGame[slug] = st;
      statOverrides++;
    }
    if (entry.types) {
      typesByGame[slug] = entry.types.map((t) => t.toLowerCase());
      typeOverrides++;
    }
    if (entry.abilities) {
      // Showdown ability slots: numeric keys (0, 1) are regular, "H" is hidden,
      // "S" is a special/event slot. Emit in slot order (0, 1, then H, then S),
      // deduped. `abilities` is a FULL replacement, not a delta.
      const order = ['0', '1', '2', 'H', 'S'];
      const slots = Object.keys(entry.abilities)
        .filter((k) => entry.abilities[k])
        .sort((a, b) => {
          const ia = order.indexOf(a);
          const ib = order.indexOf(b);
          return (ia === -1 ? order.length : ia) - (ib === -1 ? order.length : ib);
        });
      const list = [];
      for (const k of slots) {
        const ab = toAbilitySlug(entry.abilities[k]);
        if (!ab || list.includes(ab)) continue;
        list.push(ab);
        if (!knownAbilities.has(ab)) customAbilities.set(ab, (customAbilities.get(ab) ?? 0) + 1);
      }
      if (list.length) {
        abilities[slug] = list;
        abilityOverrides++;
      }
    }
  }

  // 2. Learnsets: movepool (union of every code) + level-up levels (9L<n>).
  for (const [id, entry] of Object.entries(learnsets)) {
    const ls = entry.learnset;
    if (!ls) continue;
    const slug = idToSlug.get(id) ?? SPECIES_ALIAS[id];
    if (!slug || !baseStats[slug]) continue; // unmapped / new forme — silently skip (species pass already reported unmapped)

    const pool = new Set();
    const levelUp = new Map(); // move slug -> min level
    for (const [moveId, codes] of Object.entries(ls)) {
      const moveSlug = idToMove.get(toId(moveId));
      if (!moveSlug) {
        unmappedMoves.set(moveId, (unmappedMoves.get(moveId) ?? 0) + 1);
        continue;
      }
      pool.add(moveSlug);
      for (const code of codes) {
        const m = /^\d+L(\d+)$/.exec(code); // 9L27 -> level 27 (9L1 = level 1)
        if (m) {
          const lvl = parseInt(m[1], 10) || 1;
          const prev = levelUp.get(moveSlug);
          if (prev == null || lvl < prev) levelUp.set(moveSlug, lvl);
        }
      }
    }
    if (pool.size === 0) continue;
    movesByGame[slug] = [...pool].sort();
    if (levelUp.size > 0) {
      levelUpMovesByGame[slug] = [...levelUp.entries()].sort((a, b) => a[1] - b[1] || a[0].localeCompare(b[0]));
    }
  }

  const sortObj = (o) => Object.fromEntries(Object.entries(o).sort(([a], [b]) => a.localeCompare(b)));
  const out = {
    _source: `${RAW_BASE}/{pokedex,learnsets}.ts (RadicalRedShowdown gen9rr4.0)`,
    _generatedBy: 'packages/datasets/scripts/build-radical-red-species.mjs',
    statsByGame: sortObj(statsByGame),
    typesByGame: sortObj(typesByGame),
    abilities: sortObj(abilities),
    movesByGame: sortObj(movesByGame),
    levelUpMovesByGame: sortObj(levelUpMovesByGame),
  };
  const outFile = join(outDir, 'radical-red-species.json');
  writeFileSync(outFile, JSON.stringify(out) + '\n');

  console.log('=== Radical Red species overrides ===');
  console.log(`stat overrides:      ${statOverrides}`);
  console.log(`type overrides:      ${typeOverrides}`);
  console.log(`ability overrides:   ${abilityOverrides}`);
  console.log(`movepool overrides:  ${Object.keys(movesByGame).length}`);
  console.log(`level-up overrides:  ${Object.keys(levelUpMovesByGame).length}`);
  console.log(`skipped (RR mega / new forme, no inherit): ${skippedNoInherit.length}`);
  if (skippedUnmapped.length)
    console.log(`skipped (Showdown id not in our dex): ${[...new Set(skippedUnmapped)].sort().join(', ')}`);
  if (unmappedMoves.size) {
    console.log(`\nunmapped move ids (DROPPED — add an alias if legit):`);
    for (const [id, n] of [...unmappedMoves.entries()].sort()) console.log(`  "${id}" x${n}`);
  }
  if (customAbilities.size) {
    console.log(`\nRR abilities with no PokeAPI equivalent (KEPT as normalized slug — likely RR-custom):`);
    for (const [ab, n] of [...customAbilities.entries()].sort()) console.log(`  "${ab}" x${n}`);
  }
  console.log(`\nwrote ${outFile}`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
