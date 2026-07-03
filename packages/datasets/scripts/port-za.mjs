/**
 * Port the v1 pokemonZaNuzlockApp data.js into the game dataset schema.
 * Usage: node scripts/port-za.mjs /path/to/za-app/js/data.js
 * Writes games/plza.json. Re-runnable whenever the source data updates.
 */
import { writeFileSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const src = process.argv[2];
if (!src) {
  console.error('usage: node scripts/port-za.mjs <path to v1 data.js>');
  process.exit(1);
}
const { ZD, BD } = await import(pathToFileURL(resolve(src)).href);

// ---- species name -> PokeAPI-style slug ----
const SPECIAL_SLUGS = {
  'floette (eternal)': 'floette-eternal',
  'galarian stunfisk': 'stunfisk-galar',
  'shiny mareep': 'mareep', // shininess is a property, not a species
  'kommo-o': 'kommo-o',
  'porygon-z': 'porygon-z',
  'rotom forms': 'rotom',
};
// v1 randomizer-list typos, corrected where they appear in spawn tables
const TYPO_FIXES = { deilbird: 'delibird', frostlass: 'froslass', yvetal: 'yveltal', dralak: 'drakloak' };
const JUNK = new Set(['etc.)', 'fossil pokemon', 'rare encounters)']);

function slug(name) {
  let n = name.toLowerCase().trim();
  if (SPECIAL_SLUGS[n]) return SPECIAL_SLUGS[n];
  n = n.replace(/^various \(/, '').replace(/^legendary encounters \(/, '').replace(/\)$/, '');
  if (JUNK.has(n)) return null;
  if (SPECIAL_SLUGS[n]) return SPECIAL_SLUGS[n];
  if (TYPO_FIXES[n]) return TYPO_FIXES[n];
  return n.replace(/[.'’]/g, '').replace(/\s+/g, '-');
}

const tagFromUnlock = (u) => 'unlock:' + u.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');

// ---- areas ----
const areas = [];
for (const z of ZD) {
  if (z.cat === 'special') continue; // specials handled below
  const isHyper = z.cat === 'hyper';
  const id = isHyper
    ? 'hyperspace-' + String(z.id)
    : z.n.toLowerCase().replace(/[^a-z0-9]+/g, '-');
  const encounters = [];
  const seen = new Set();
  for (const p of z.p ?? []) {
    const s = slug(p.n);
    if (!s || seen.has(s + ':spawn')) continue;
    seen.add(s + ':spawn');
    encounters.push({ species: s, methods: [isHyper ? 'hyperspace' : 'overworld'] });
  }
  for (const a of z.alphas ?? []) {
    const s = slug(a.n);
    if (!s || seen.has(s + ':alpha')) continue;
    seen.add(s + ':alpha');
    encounters.push({ species: s, methods: ['alpha'] });
  }
  const tags = isHyper ? ['wild-zone', 'dlc:mega-dimension', 'session-randomized'] : ['wild-zone'];
  if (z.u) tags.push(tagFromUnlock(z.u));
  areas.push({ id, name: z.n, unlockAfter: null, tags, encounters });
}

// ---- specials (gift/static from v1 'special' + rogue-mega catch targets h1-h5) ----
const specials = [];
for (const z of ZD.filter((z) => z.cat === 'special')) {
  const entries = z.p.map((p) => slug(p.n)).filter(Boolean);
  const type =
    /gift|starter|az's|floette/i.test(z.n) ? 'gift' : 'static';
  for (const s of entries) {
    specials.push({ id: `${String(z.id)}-${s}`, type, species: s, area: 'lumiose-city' });
  }
}
for (const z of ZD.filter((z) => z.cat === 'hyper' && /Zone: /.test(z.n))) {
  const s = slug(z.p[0].n);
  if (s) specials.push({ id: `rogue-catch-${s}`, type: 'static', species: s, area: 'hyperspace-' + String(z.id) });
}
// drop hyper rogue single-target zones from areas (they're specials, not pools)
const rogueZoneIds = new Set(ZD.filter((z) => z.cat === 'hyper' && /Zone: /.test(z.n)).map((z) => 'hyperspace-' + String(z.id)));
const finalAreas = areas.filter((a) => !rogueZoneIds.has(a.id));

// ---- milestones (promotion matches + rogue megas grant revive tokens) ----
const TYPE_BY_CAT = {
  'Promotion Matches': 'promotion',
  'Rogue Mega Battles': 'rogue-mega',
  'Rival Battles': 'rival',
  'Key Story': 'story',
};
const sorted = [...BD].sort((a, b) => (a.ms - b.ms) || BD.indexOf(a) - BD.indexOf(b));
const milestones = sorted.map((b, i) => {
  const m = {
    id: b.id.toLowerCase().replace(/[^a-z0-9]+/g, '-'),
    name: b.n,
    type: TYPE_BY_CAT[b.cat] ?? 'story',
    order: i + 1,
    aceLevel: Number.isFinite(b.ace) ? b.ace : null,
  };
  if (b.cat === 'Promotion Matches' || b.cat === 'Rogue Mega Battles') {
    m.grants = { reviveTokens: 1 };
  }
  return m;
});

const dataset = {
  schemaVersion: 1,
  gameId: 'plza',
  name: 'Pokémon Legends: Z-A',
  versions: ['legends-z-a'],
  areas: finalAreas,
  specials,
  milestones,
  mechanics: {
    heldItems: true,
    wildBattles: true,
    setModeOption: false,
    raids: false,
    overworldAggro: true,
  },
};

const out = join(dirname(dirname(fileURLToPath(import.meta.url))), 'games/plza.json');
writeFileSync(out, JSON.stringify(dataset, null, 2) + '\n');
console.log(
  `wrote plza.json: ${dataset.areas.length} areas, ${dataset.specials.length} specials, ${dataset.milestones.length} milestones`,
);
