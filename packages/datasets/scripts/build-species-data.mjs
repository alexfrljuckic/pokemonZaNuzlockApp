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

// 1. Collect the species slug set across every dataset.
const species = new Set();
for (const f of readdirSync(gamesDir).filter((n) => n.endsWith('.json'))) {
  const game = JSON.parse(readFileSync(join(gamesDir, f), 'utf8'));
  for (const area of game.areas ?? []) for (const e of area.encounters ?? []) species.add(e.species);
  for (const s of game.specials ?? []) species.add(s.species);
  for (const m of game.milestones ?? []) {
    for (const p of m.roster ?? []) species.add(p.species);
    for (const variant of Object.values(m.rosterByStarter ?? {})) for (const p of variant) species.add(p.species);
  }
}
const slugs = [...species].sort();
console.log(`${slugs.length} species referenced across datasets`);

// 2. Per species: base stats + types + movepool (unique move slugs, any method/version).
const stats = {};
const types = {};
const moves = {};
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
  try {
    const sp = await fetchJson(mon.species.url);
    chainUrlBySpecies[slug] = { chain: sp.evolution_chain?.url, base: sp.name };
  } catch {
    /* form without its own species entry — skip evo */
  }
});
if (missing.length) console.warn(`no /pokemon for: ${missing.join(', ')}`);

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

// 4. Move types: fetch /move for each distinct move → its type.
const allMoves = [...new Set(Object.values(moves).flat())].sort();
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

const sortObj = (o) => Object.fromEntries(Object.entries(o).sort(([a], [b]) => a.localeCompare(b)));
const out = {
  stats: sortObj(stats),
  types: sortObj(types),
  moves: sortObj(moves),
  moveTypes: sortObj(moveTypes),
  evolutions: sortObj(evolutions),
  heldItems,
};
const outFile = join(outDir, 'species-data.json');
writeFileSync(outFile, JSON.stringify(out) + '\n');
console.log(`wrote ${slugs.length} species to ${outFile}`);
