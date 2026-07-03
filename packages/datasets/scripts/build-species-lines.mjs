// Builds generated/species-lines.json: { "<pokeapi slug>": "chain-<id>", ... }
// for the dupes clause (evolution-line scope). Covers every species in every
// PokeAPI evolution chain, plus every pokemon variety (regional forms, megas,
// cosmetic forms) mapped to its species' chain — so `stunfisk-galar` and
// `stunfisk` share a line, and `perrserker` lands in meowth's chain because
// that's where PokeAPI puts it.
//
// Responses are cached in .cache/pokeapi/ so re-runs don't hammer the API
// (PokeAPI fair-use policy). Delete the cache dir to force a full refresh.
import { mkdirSync, readFileSync, writeFileSync, existsSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = dirname(dirname(fileURLToPath(import.meta.url)));
const cacheDir = join(root, '.cache/pokeapi');
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

function chainSpecies(node, acc = []) {
  acc.push(node.species.name);
  for (const evo of node.evolves_to) chainSpecies(evo, acc);
  return acc;
}

// 1. Every evolution chain -> its species.
const chainList = await fetchJson('https://pokeapi.co/api/v2/evolution-chain?limit=2000');
console.log(`${chainList.results.length} evolution chains`);
const lines = {};
await mapPool(chainList.results, async ({ url }) => {
  const chain = await fetchJson(url);
  const lineId = `chain-${chain.id}`;
  for (const species of chainSpecies(chain.chain)) lines[species] = lineId;
});
console.log(`${Object.keys(lines).length} species mapped from chains`);

// 2. Every pokemon variety not already covered (forms: -galar, -mega, ...)
//    inherits its species' chain.
const pokemonList = await fetchJson('https://pokeapi.co/api/v2/pokemon?limit=100000');
const unmapped = pokemonList.results.filter((p) => !(p.name in lines));
console.log(`${pokemonList.results.length} pokemon varieties, ${unmapped.length} need species lookup`);
const misses = [];
await mapPool(unmapped, async ({ name, url }) => {
  const pokemon = await fetchJson(url);
  const line = lines[pokemon.species.name];
  if (line) lines[name] = line;
  else misses.push(name);
});
if (misses.length) console.warn(`no chain for: ${misses.join(', ')}`);

const sorted = Object.fromEntries(Object.entries(lines).sort(([a], [b]) => a.localeCompare(b)));
const outFile = join(outDir, 'species-lines.json');
writeFileSync(outFile, JSON.stringify(sorted, null, 2) + '\n');
console.log(`wrote ${Object.keys(sorted).length} entries to ${outFile}`);
