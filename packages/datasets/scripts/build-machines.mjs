// Builds generated/bdsp-machines.json: { "<move-slug>": "TM" | "HM", ... } for
// every move that is a TM/HM in Brilliant Diamond / Shining Pearl and appears in
// some species' movepool. Powers the TM/HM tags in the move picker.
//
// Move set = the moves already collected in generated/species-data.json, so we
// only classify moves that can actually show up in a picker. For each, PokeAPI
// /move tells us whether it has a BDSP machine, and the machine's item slug
// (tmNN / hmNN) tells TM vs HM. Cached in .cache/pokeapi/ like the other builds.
import { mkdirSync, readFileSync, writeFileSync, existsSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = dirname(dirname(fileURLToPath(import.meta.url)));
const cacheDir = join(root, '.cache/pokeapi');
const outDir = join(root, 'generated');
mkdirSync(cacheDir, { recursive: true });
mkdirSync(outDir, { recursive: true });

// PokeAPI has no machine data under a BDSP version group, but BDSP is a 1:1
// remake of Diamond/Pearl with the same TM01-92 / HM01-08 list, so diamond-pearl
// is an accurate proxy for BDSP's machine moves.
const VERSION_GROUP = 'diamond-pearl';
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

const speciesData = JSON.parse(readFileSync(join(outDir, 'species-data.json'), 'utf8'));
const moves = [...new Set(Object.values(speciesData.moves).flat())].sort();
console.log(`${moves.length} distinct moves to classify`);

const machines = {};
let checked = 0;
await mapPool(moves, async (move) => {
  let data;
  try {
    data = await fetchJson(`https://pokeapi.co/api/v2/move/${move}`);
  } catch {
    return;
  }
  const entry = data.machines?.find((m) => m.version_group.name === VERSION_GROUP);
  if (entry) {
    const machine = await fetchJson(entry.machine.url);
    const item = machine.item?.name ?? '';
    machines[move] = item.startsWith('hm') ? 'HM' : 'TM';
  }
  if (++checked % 100 === 0) console.log(`  ${checked}/${moves.length}`);
});

const sorted = Object.fromEntries(Object.entries(machines).sort(([a], [b]) => a.localeCompare(b)));
const outFile = join(outDir, 'bdsp-machines.json');
writeFileSync(outFile, JSON.stringify(sorted) + '\n');
console.log(`wrote ${Object.keys(sorted).length} TM/HM moves to ${outFile}`);
