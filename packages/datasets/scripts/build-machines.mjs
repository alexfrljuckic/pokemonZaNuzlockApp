// Builds generated/machines-by-game.json:
//   { "<gameId>": { "<move-slug>": "TM" | "HM" | "TR", ... }, ... }
// classifying every move in some species' movepool (from species-data.json) as
// a TM/HM/TR in each supported game. Powers the per-game TM/HM/TR tags in the
// move picker (machineType(move, gameId)).
//
// PokeAPI's /move tells us which version groups make a move a machine; the
// machine's item slug (tmNN / hmNN / trNN) tells the category. Cached in
// .cache/pokeapi/ like the other builds. Delete the cache dir to refresh.
import { mkdirSync, readFileSync, writeFileSync, existsSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = dirname(dirname(fileURLToPath(import.meta.url)));
const cacheDir = join(root, '.cache/pokeapi');
const outDir = join(root, 'generated');
mkdirSync(cacheDir, { recursive: true });
mkdirSync(outDir, { recursive: true });

// gameId -> the PokeAPI version group whose machine list represents that game.
// BDSP has only partial machine data under its own group, but it's a 1:1 remake
// of Diamond/Pearl with the same TM01-92 / HM01-08 list, so diamond-pearl is an
// accurate, complete proxy. LGPE, SwSh and Z-A have direct machine data (SwSh
// uses TRs alongside TMs). Legends Arceus is intentionally absent — it has no
// TMs at all (moves are bought/learned via the move shop), so it gets no tags.
const MACHINE_SOURCE = {
  bdsp: 'diamond-pearl',
  lgpe: 'lets-go-pikachu-lets-go-eevee',
  swsh: 'sword-shield',
  plza: 'legends-za',
};
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
  let next = 0;
  await Promise.all(
    Array.from({ length: Math.min(CONCURRENCY, items.length) }, async () => {
      while (next < items.length) {
        const i = next++;
        await fn(items[i]);
      }
    }),
  );
}

function classify(itemName) {
  if (itemName.startsWith('hm')) return 'HM';
  if (itemName.startsWith('tr')) return 'TR';
  return 'TM';
}

const speciesData = JSON.parse(readFileSync(join(outDir, 'species-data.json'), 'utf8'));
const moves = [...new Set(Object.values(speciesData.moves).flat())].sort();
console.log(`${moves.length} distinct moves to classify across ${Object.keys(MACHINE_SOURCE).length} games`);

const sourceByVg = Object.fromEntries(Object.entries(MACHINE_SOURCE).map(([g, vg]) => [vg, g]));
const machinesByGame = Object.fromEntries(Object.keys(MACHINE_SOURCE).map((g) => [g, {}]));
let checked = 0;
await mapPool(moves, async (move) => {
  let data;
  try {
    data = await fetchJson(`https://pokeapi.co/api/v2/move/${move}`);
  } catch {
    return;
  }
  for (const entry of data.machines ?? []) {
    const gameId = sourceByVg[entry.version_group.name];
    if (!gameId) continue;
    const machine = await fetchJson(entry.machine.url);
    const item = machine.item?.name ?? '';
    if (item) machinesByGame[gameId][move] = classify(item);
  }
  if (++checked % 100 === 0) console.log(`  ${checked}/${moves.length}`);
});

const out = Object.fromEntries(
  Object.entries(machinesByGame).map(([g, m]) => [
    g,
    Object.fromEntries(Object.entries(m).sort(([a], [b]) => a.localeCompare(b))),
  ]),
);
const outFile = join(outDir, 'machines-by-game.json');
writeFileSync(outFile, JSON.stringify(out) + '\n');
for (const [g, m] of Object.entries(out)) console.log(`  ${g}: ${Object.keys(m).length} machine moves`);
console.log(`wrote ${outFile}`);
