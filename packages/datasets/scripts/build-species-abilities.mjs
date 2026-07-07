// Builds generated/species-abilities.json — per-species ability names (PokeAPI
// slugs, in slot order incl. hidden). The /pokemon response is already the
// source for stats/types in build-species-data.mjs; this fetches the same
// endpoint (cached in .cache/pokeapi/) and extracts `abilities`, then merges an
// `abilities` map into generated/species-data.json ADDITIVELY (every other
// section untouched, CRLF + 2-space formatting preserved). build-species-data
// also folds species-abilities.json in on a full regen, so the two stay in sync.
import { mkdirSync, readFileSync, writeFileSync, existsSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = dirname(dirname(fileURLToPath(import.meta.url)));
const cacheDir = join(root, '.cache/pokeapi');
mkdirSync(cacheDir, { recursive: true });
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

async function fetchJson(url) {
  const file = join(cacheDir, createHash('sha1').update(url).digest('hex') + '.json');
  if (existsSync(file)) return JSON.parse(readFileSync(file, 'utf8'));
  for (let attempt = 0; attempt < 4; attempt++) {
    try {
      const res = await fetch(url);
      if (res.status === 404) return null;
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const json = await res.json();
      writeFileSync(file, JSON.stringify(json));
      await sleep(60);
      return json;
    } catch (e) {
      if (attempt === 3) throw e;
      await sleep(500 * (attempt + 1));
    }
  }
}

const sdPath = join(root, 'generated/species-data.json');
const raw = readFileSync(sdPath, 'utf8');
const sd = JSON.parse(raw);
const slugs = Object.keys(sd.stats);
console.error(`fetching abilities for ${slugs.length} species…`);

const abilities = {};
let done = 0;
const missing = [];
for (const slug of slugs) {
  const mon = await fetchJson(`https://pokeapi.co/api/v2/pokemon/${slug}`);
  if (!mon) { missing.push(slug); continue; }
  abilities[slug] = mon.abilities
    .sort((a, b) => a.slot - b.slot)
    .map((a) => a.ability.name);
  if (++done % 100 === 0) console.error(`  …${done}/${slugs.length}`);
}
if (missing.length) console.error(`WARN: ${missing.length} slugs 404’d on PokeAPI: ${missing.join(', ')}`);

// standalone generated artifact (build-species-data folds this in on full regen)
writeFileSync(join(root, 'generated/species-abilities.json'), JSON.stringify(abilities) + '\n');

// additive merge into species-data.json — same minified format as build-species-data
sd.abilities = abilities;
writeFileSync(sdPath, JSON.stringify(sd) + '\n');
console.error(`done: ${Object.keys(abilities).length} species; species-data.json abilities key added.`);
