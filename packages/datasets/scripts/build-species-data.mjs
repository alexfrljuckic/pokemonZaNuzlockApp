// Builds generated/species-data.json — per-species movepools, base stats and
// evolution info for every species referenced across the game datasets, plus
// the global holdable-item list. Powers the move/held-item picklists,
// evolution previews and milestone base-stats in the web app.
//
// Species scope = union of every slug in areas.encounters, specials and
// milestones.roster across games/*.json (no point fetching the full dex).
// Responses cached in .cache/pokeapi/ so re-runs don't hammer PokeAPI. Delete
// the cache dir to force a refresh.
import { mkdirSync, readFileSync, writeFileSync, existsSync, readdirSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = dirname(dirname(fileURLToPath(import.meta.url)));
const cacheDir = join(root, '.cache/pokeapi');
const gamesDir = join(root, 'games');
const outDir = join(root, 'generated');
mkdirSync(cacheDir, { recursive: true });
mkdirSync(outDir, { recursive: true });

const CONCURRENCY = 16;

async function fetchJson(url) {
  const key = createHash('sha1').update(url).digest('hex');
  const file = join(cacheDir, `${key}.json`);
  if (existsSync(file)) return JSON.parse(readFileSync(file, 'utf8'));
  const res = await fetch(url);
  if (!res.ok) throw new Error(`${res.status} ${res.statusText} for ${url}`);
  const data = await res.json();
  writeFileSync(file, JSON.stringify(data));
  return data;
}

async function mapPool(items, fn) {
  const results = new Array(items.length);
  let next = 0;
  await Promise.all(
    Array.from({ length: Math.min(CONCURRENCY, items.length) }, async () => {
      while (next < items.length) {
        const i = next++;
        results[i] = await fn(items[i]);
      }
    }),
  );
  return results;
}

// 1. Collect the species slug set across every dataset — both the global
// union and per-game sets (per-game movepools are scoped to each game's own
// referenced species, so the file doesn't carry every game's pool for every
// species). Also record each game's PokeAPI version groups.
const species = new Set();
const speciesByGame = {}; // gameId -> Set<slug>
const versionGroupsByGame = {}; // gameId -> string[]
// Moves used on trainer rosters — folded into the move-type fetch below so the
// UI can type-dot every roster move, and so the validator's roster-move guard
// only flags true typos (a real move slug resolves; a fake one 404s). Some
// roster moves (e.g. SV's Starmobile "Torque" moves) exist in no movepool, so
// they'd otherwise be missing from moveTypes.
const rosterMoves = new Set();
for (const f of readdirSync(gamesDir).filter((n) => n.endsWith('.json'))) {
  const game = JSON.parse(readFileSync(join(gamesDir, f), 'utf8'));
  const gameSet = (speciesByGame[game.gameId] = new Set());
  versionGroupsByGame[game.gameId] = game.pokeapiVersionGroups ?? [];
  const add = (slug) => {
    species.add(slug);
    gameSet.add(slug);
  };
  const addMon = (p) => {
    add(p.species);
    for (const mv of p.moves ?? []) rosterMoves.add(mv);
  };
  for (const area of game.areas ?? []) {
    for (const e of area.encounters ?? []) add(e.species);
    for (const t of area.trainers ?? []) for (const p of t.team) addMon(p);
  }
  for (const s of game.specials ?? []) add(s.species);
  for (const m of game.milestones ?? []) {
    for (const p of m.roster ?? []) addMon(p);
    for (const variant of Object.values(m.rosterByStarter ?? {})) for (const p of variant) addMon(p);
  }
}
const slugs = [...species].sort();
console.log(`${slugs.length} species referenced across datasets`);

// 2. Per species: base stats + types + movepool. `moves` stays the all-games
// union (the fallback pool); `movesByVersionGroup` keeps the per-version-group
// breakdown so step 2b can slice per game.
const stats = {};
const types = {};
const moves = {};
const movesByVersionGroup = {}; // slug -> { versionGroup -> Set<move> }
const levelUpByVersionGroup = {}; // slug -> { versionGroup -> Map<move, level> }
const chainUrlBySpecies = {};
const missing = [];
await mapPool(slugs, async (slug) => {
  let mon;
  try {
    mon = await fetchJson(`https://pokeapi.co/api/v2/pokemon/${slug}`);
  } catch {
    missing.push(slug);
    return;
  }
  stats[slug] = Object.fromEntries(mon.stats.map((s) => [s.stat.name, s.base_stat]));
  types[slug] = mon.types.sort((a, b) => a.slot - b.slot).map((t) => t.type.name);
  moves[slug] = [...new Set(mon.moves.map((m) => m.move.name))].sort();
  const byVg = (movesByVersionGroup[slug] = {});
  const luByVg = (levelUpByVersionGroup[slug] = {});
  for (const m of mon.moves) {
    for (const vgd of m.version_group_details) {
      (byVg[vgd.version_group.name] ??= new Set()).add(m.move.name);
      if (vgd.move_learn_method?.name === 'level-up' && vgd.level_learned_at > 0) {
        const lu = (luByVg[vgd.version_group.name] ??= new Map());
        // keep the lowest learn level if a move repeats (reminder relearns)
        const prev = lu.get(m.move.name);
        if (prev == null || vgd.level_learned_at < prev) lu.set(m.move.name, vgd.level_learned_at);
      }
    }
  }
  try {
    const sp = await fetchJson(mon.species.url);
    chainUrlBySpecies[slug] = { chain: sp.evolution_chain?.url, base: sp.name };
  } catch {
    /* form without its own species entry — skip evo */
  }
});
if (missing.length) console.warn(`no /pokemon for: ${missing.join(', ')}`);

// 2b. Per-game movepools: for each game, each of its referenced species gets
// the union of moves across that game's version groups (base + DLC). Species
// with no moves in those groups are omitted — the app falls back to the
// all-games union pool for them (this is also the whole-game behavior for
// Legends Z-A, whose PokeAPI version groups exist but carry no move data).
const movesByGame = {};
for (const [gameId, vgs] of Object.entries(versionGroupsByGame)) {
  if (vgs.length === 0) continue;
  const perGame = {};
  for (const slug of speciesByGame[gameId]) {
    const byVg = movesByVersionGroup[slug];
    if (!byVg) continue;
    const pool = new Set();
    for (const vg of vgs) for (const mv of byVg[vg] ?? []) pool.add(mv);
    if (pool.size > 0) perGame[slug] = [...pool].sort();
  }
  if (Object.keys(perGame).length > 0) movesByGame[gameId] = perGame;
  console.log(
    `${gameId}: per-game moves for ${Object.keys(perGame).length}/${speciesByGame[gameId].size} species (groups: ${vgs.join(', ')})`,
  );
}

// 2c. Per-game level-up learnsets with learn levels ([move, level] pairs
// sorted by level). Powers the learn-level badges in the move picker, the
// per-mon "level-up moves" section, and the computed "expected moves" for
// trainer mons whose movesets aren't documented (games give unspecified
// trainer mons their last four level-up moves). For a move present in more
// than one of a game's version groups, the FIRST group in the game's list
// (the base game) wins.
const levelUpMovesByGame = {};
for (const [gameId, vgs] of Object.entries(versionGroupsByGame)) {
  if (vgs.length === 0) continue;
  const perGame = {};
  for (const slug of speciesByGame[gameId]) {
    const luByVg = levelUpByVersionGroup[slug];
    if (!luByVg) continue;
    const merged = new Map();
    for (const vg of vgs) {
      for (const [mv, lvl] of luByVg[vg] ?? []) {
        if (!merged.has(mv)) merged.set(mv, lvl);
      }
    }
    if (merged.size > 0) {
      perGame[slug] = [...merged.entries()].sort((a, b) => a[1] - b[1] || a[0].localeCompare(b[0]));
    }
  }
  if (Object.keys(perGame).length > 0) levelUpMovesByGame[gameId] = perGame;
  console.log(`${gameId}: level-up learnsets for ${Object.keys(perGame).length}/${speciesByGame[gameId].size} species`);
}

// 3. Evolution info: for each species, what it evolves into and how.
function walk(node, out) {
  for (const evo of node.evolves_to) {
    const d = evo.evolution_details?.[0] ?? {};
    out[node.species.name] = out[node.species.name] ?? [];
    out[node.species.name].push({
      to: evo.species.name,
      trigger: d.trigger?.name ?? null,
      minLevel: d.min_level ?? null,
      item: d.item?.name ?? d.held_item?.name ?? null,
      // extra condition detail for the evolve-panel requirement labels;
      // omitted when absent to keep the JSON lean
      ...(d.min_happiness != null ? { minHappiness: d.min_happiness } : {}),
      ...(d.time_of_day ? { timeOfDay: d.time_of_day } : {}),
      ...(d.known_move?.name ? { knownMove: d.known_move.name } : {}),
      ...(d.location?.name ? { location: d.location.name } : {}),
    });
    walk(evo, out);
  }
}
const evolutions = {};
const chainUrls = [...new Set(Object.values(chainUrlBySpecies).map((c) => c.chain).filter(Boolean))];
const evoByBase = {};
await mapPool(chainUrls, async (url) => {
  const chain = await fetchJson(url);
  walk(chain.chain, evoByBase);
});
// map back to every referenced slug (forms inherit their base species' evo)
for (const slug of slugs) {
  const base = chainUrlBySpecies[slug]?.base;
  if (base && evoByBase[base]) evolutions[slug] = evoByBase[base];
}
console.log(`${Object.keys(evolutions).length} species with evolutions`);

// 4. Move types: fetch /move for each distinct move → its type. Includes both
// species movepools and trainer-roster moves (some roster moves are in no
// movepool, e.g. Starmobile Torque moves).
const allMoves = [...new Set([...Object.values(moves).flat(), ...rosterMoves])].sort();
const moveTypes = {};
await mapPool(allMoves, async (move) => {
  try {
    const data = await fetchJson(`https://pokeapi.co/api/v2/move/${move}`);
    if (data.type?.name) moveTypes[move] = data.type.name;
  } catch {
    /* leave untyped */
  }
});
console.log(`${Object.keys(moveTypes).length}/${allMoves.length} move types`);

// 5. Global holdable-item list (for the held-item picklist).
const holdable = await fetchJson('https://pokeapi.co/api/v2/item-attribute/holdable');
const heldItems = holdable.items.map((i) => i.name).sort();
console.log(`${heldItems.length} holdable items`);

// Merge the hand-scraped Legends: Z-A movepools (PokeAPI has no plza learnsets;
// see build-za-movepools.mjs). Its maps are keyed by species — slot them under
// the 'plza' game so movesFor/levelUpMovesFor use them instead of the union.
const zaFile = join(outDir, 'za-movepools.json');
if (existsSync(zaFile)) {
  const za = JSON.parse(readFileSync(zaFile, 'utf8'));
  if (za.movesByGame && Object.keys(za.movesByGame).length) movesByGame.plza = za.movesByGame;
  if (za.levelUpMovesByGame && Object.keys(za.levelUpMovesByGame).length)
    levelUpMovesByGame.plza = za.levelUpMovesByGame;
  console.log(`merged Z-A movepools for ${Object.keys(za.movesByGame ?? {}).length} species`);
}

const sortObj = (o) => Object.fromEntries(Object.entries(o).sort(([a], [b]) => a.localeCompare(b)));
const out = {
  stats: sortObj(stats),
  types: sortObj(types),
  moves: sortObj(moves),
  movesByGame: sortObj(Object.fromEntries(Object.entries(movesByGame).map(([g, m]) => [g, sortObj(m)]))),
  levelUpMovesByGame: sortObj(
    Object.fromEntries(Object.entries(levelUpMovesByGame).map(([g, m]) => [g, sortObj(m)])),
  ),
  moveTypes: sortObj(moveTypes),
  evolutions: sortObj(evolutions),
  heldItems,
};
const outFile = join(outDir, 'species-data.json');
writeFileSync(outFile, JSON.stringify(out) + '\n');
console.log(`wrote ${slugs.length} species to ${outFile}`);
