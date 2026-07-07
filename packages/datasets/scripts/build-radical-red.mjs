// Builds games/radical-red.json's areas + specials from the community
// base-Radical-Red obtainability spreadsheet (a public Google Sheet exported
// per-tab as CSV). Radical Red has NO PokeAPI version group, so encounter data
// cannot be derived from PokeAPI — this Sheet is the source of truth (see
// docs/RADICAL-RED-RESEARCH.md).
//
// Scope (RR1): wild encounters (Grass & Caves, Fishing & Surfing, Safari Zone)
// → areas[].encounters[]; fixed obtains (Statics, Gifts, Trades) → specials[].
// Raids / Mystery Gifts / fossils-prose are deferred (RR3).
//
// Milestones (boss rosters + level caps) come from a DIFFERENT source (the
// Showdown-format trainer gists) and are merged in by build-radical-red-bosses
// — this script preserves any existing milestones/mechanics/versions block in
// the output file and only rewrites areas + specials.
//
//   node packages/datasets/scripts/build-radical-red.mjs
//
// Responses are cached under .cache/radical-red/ so re-runs are offline; delete
// that dir to re-pull the Sheet. Unmapped species names are reported to stderr
// (they'd fail validate:datasets / the species-data build otherwise).

import { mkdirSync, readFileSync, writeFileSync, existsSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { normalizeSpecies } from './rr-species-map.mjs';

const root = dirname(dirname(fileURLToPath(import.meta.url)));
const cacheDir = join(root, '.cache/radical-red');
mkdirSync(cacheDir, { recursive: true });

const SHEET_ID = '15mUFUcN8250hRL7iUOJPX0s1rMcgVuJPuHANioL4o2o';
// gid per tab (enumerated from the Sheet's htmlview bootstrap).
const TABS = {
  grass: '0', // Grass & Caves
  fishsurf: '955089917', // Fishing & Surfing
  safari: '2109178889', // Safari Zone
  statics: '241244610', // Statics & Special Pokémon
  gifts: '1585451773', // Gifts
  trades: '952974556', // Trades
};

async function fetchCsv(tab, gid) {
  const file = join(cacheDir, `${tab}.csv`);
  if (existsSync(file)) return readFileSync(file, 'utf8');
  const url = `https://docs.google.com/spreadsheets/d/${SHEET_ID}/export?format=csv&gid=${gid}`;
  const res = await fetch(url);
  if (!res.ok) throw new Error(`${res.status} ${res.statusText} for ${tab}`);
  const text = await res.text();
  writeFileSync(file, text);
  return text;
}

// --- CSV (RFC4180-ish, handles quoted fields with commas/quotes) ---
function parseCSV(text) {
  const rows = [];
  let row = [], field = '', q = false;
  for (let i = 0; i < text.length; i++) {
    const c = text[i];
    if (q) {
      if (c === '"') { if (text[i + 1] === '"') { field += '"'; i++; } else q = false; }
      else field += c;
    } else if (c === '"') q = true;
    else if (c === ',') { row.push(field); field = ''; }
    else if (c === '\n') { row.push(field); rows.push(row); row = []; field = ''; }
    else if (c !== '\r') field += c;
  }
  if (field.length || row.length) { row.push(field); rows.push(row); }
  return rows;
}
const cell = (r, i) => ((r && r[i]) || '').trim();
const isPokeHeader = (v) => /^pok[eé]mon$/i.test((v || '').trim());

const unmapped = new Set();
const approx = new Set();
function slug(name) {
  const r = normalizeSpecies(name);
  if (!r || (!r.slug && !r.skip)) { unmapped.add(name); return null; }
  if (r.skip) return null;
  if (r.approx) approx.add(`${name} → ${r.slug}`);
  return r.slug;
}

// slugify a location label into an area id, aligning shared Kanto locations to
// the LGPE Kanto map's node ids (so they land on the reused map).
const AREA_ID_ALIAS = { 'vermillion-city': 'vermilion-city' };
function areaId(label) {
  const id = label
    .toLowerCase()
    .replace(/&/g, 'and')
    .replace(/[.'()]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
  return AREA_ID_ALIAS[id] ?? id;
}

// A "matrix" tab lays locations across stride-N column blocks, with a header
// row whose "Pokémon" cells mark each block; the species value sits one column
// right of that header (the header spans two columns), rarity one left, level
// two right. `methodOf(location, headerContext)` decides the method tag.
function parseMatrix(rows, method) {
  let hr = -1, best = 0;
  rows.forEach((r, i) => {
    const n = (r || []).filter(isPokeHeader).length;
    if (n > best) { best = n; hr = i; }
  });
  if (hr < 1) return [];
  const locRow = rows[hr - 1] || [];
  const out = [];
  rows[hr].forEach((c, P) => {
    if (!isPokeHeader(c)) return;
    const label = cell(locRow, P) || cell(locRow, P - 1) || cell(locRow, P + 1);
    if (!label) return;
    const encs = [];
    for (let r = hr + 1; r < rows.length; r++) {
      const sp = cell(rows[r], P + 1);
      if (!sp) continue;
      encs.push({ species: sp, level: cell(rows[r], P + 2), rarity: cell(rows[r], P - 1) });
    }
    if (encs.length) out.push({ label, method, encs });
  });
  return out;
}

// Accumulate area -> Set<species-slug> keyed by method so re-listing the same
// species (day/night sub-tables, dupes) collapses, and multiple methods merge.
const areas = new Map(); // areaId -> { name, methods: Map<slug, Set<method>> }
function addEncounter(label, sp, method) {
  const s = slug(sp);
  if (!s) return;
  const id = areaId(label);
  if (!areas.has(id)) areas.set(id, { name: label, methods: new Map() });
  const m = areas.get(id).methods;
  if (!m.has(s)) m.set(s, new Set());
  m.get(s).add(method);
}

function ingestGrass(rows) {
  // Grass & Caves: every block is a land encounter (grass or cave). Tag "grass".
  for (const b of parseMatrix(rows, 'grass'))
    for (const e of b.encs) addEncounter(b.label, e.species, 'grass');
}

function ingestFishSurf(rows) {
  // Fishing & Surfing: stacked bands (OLD ROD / GOOD ROD / SUPER ROD / SURFING),
  // each band a matrix row-section. The band label sits in the block's leftmost
  // column on the header row; map it to a method.
  const bandMethod = (txt) => {
    const t = (txt || '').toUpperCase();
    if (t.includes('SURF')) return 'surf';
    if (t.includes('ROD')) return 'fish';
    return null;
  };
  // Find every header row (rows with Pokémon cells); its band label is the
  // nearest cell to the left of the first block on that same row.
  rows.forEach((r, i) => {
    if (!(r || []).some(isPokeHeader)) return;
    const firstP = r.findIndex(isPokeHeader);
    // band label: first non-empty cell left of firstP on this header row
    let band = '';
    for (let c = firstP - 1; c >= 0; c--) { if (cell(r, c)) { band = cell(r, c); break; } }
    const method = bandMethod(band) || bandMethod(cell(rows[i - 1] || [], firstP)) || 'fish';
    const locRow = rows[i - 1] || [];
    r.forEach((h, P) => {
      if (!isPokeHeader(h)) return;
      const label = cell(locRow, P) || cell(locRow, P + 1);
      if (!label || bandMethod(label) === method) return;
      for (let rr = i + 1; rr < rows.length; rr++) {
        if ((rows[rr] || []).some(isPokeHeader)) break; // next band
        const sp = cell(rows[rr], P + 1);
        if (sp) addEncounter(label, sp, method);
      }
    });
  });
}

function ingestSafari(rows) {
  // Safari Zone: per-zone sections; methods are column headers
  // (DAY TIME / NIGHT TIME / OLD ROD / GOOD ROD / SUPER ROD / SURFING).
  // Treat the whole Safari Zone as one area but tag methods.
  const methodOf = (h) => {
    const t = (h || '').toUpperCase();
    if (t.includes('SURF')) return 'surf';
    if (t.includes('ROD')) return 'fish';
    if (t.includes('TIME')) return 'grass';
    return null;
  };
  let zone = 'Safari Zone';
  for (let i = 0; i < rows.length; i++) {
    const r = rows[i] || [];
    const first = cell(r, 2);
    if (/ZONE/i.test(first) || /CENTER/i.test(first)) zone = first;
    if (!r.some(isPokeHeader)) continue;
    const hdr = rows[i - 1] || []; // the method labels row
    r.forEach((h, P) => {
      if (!isPokeHeader(h)) return;
      const method = methodOf(cell(hdr, P)) || methodOf(cell(hdr, P - 1)) || 'grass';
      for (let rr = i + 1; rr < rows.length; rr++) {
        if ((rows[rr] || []).some(isPokeHeader)) break;
        if (/ZONE/i.test(cell(rows[rr], 2))) break;
        const sp = cell(rows[rr], P + 1) || cell(rows[rr], P);
        if (sp && !isPokeHeader(sp)) addEncounter(`Safari Zone (${zone})`, sp, method);
      }
    });
  }
}

// --- specials (statics / gifts / trades) ---
const specials = [];
const seenSpecial = new Set();
function addSpecial(type, sp, area) {
  const s = slug(sp);
  if (!s) return;
  let id = `${type}-${s}`;
  let n = 2;
  while (seenSpecial.has(id)) id = `${type}-${s}-${n++}`;
  seenSpecial.add(id);
  specials.push({ id, type, species: s, area: area || 'Unknown' });
}

function ingestStatics(rows) {
  // Two-column list: POKEMON | LOCATION (free text). Header cells are merged, so
  // the species value sits ONE column right of the "POKEMON" header.
  let pcol = -1, lcol = -1, hdrRow = -1;
  rows.forEach((r, i) => {
    r.forEach((c, j) => {
      const t = (c || '').trim().toLowerCase();
      if (t === 'pokemon') { pcol = j; hdrRow = i; }
      if (t === 'location') lcol = j;
    });
  });
  if (pcol < 0) return;
  for (let i = hdrRow + 1; i < rows.length; i++) {
    const sp = cell(rows[i], pcol + 1);
    if (!sp || /^pokemon$/i.test(sp)) continue;
    const loc = lcol >= 0 ? cell(rows[i], lcol) : '';
    // "Lv. 70 - Seafoam Islands B4F." → area "Seafoam Islands B4F"
    const m = loc.match(/-\s*(.+)/);
    const areaName = (m ? m[1] : loc).split(/[,.]/)[0].trim() || 'Static';
    addSpecial('static', sp, areaName);
  }
}

function ingestGifts(rows) {
  // Grouped by location header rows (col 2 only); each entry is
  // POKEMON | REQUIREMENTS | INFO with the species ONE column right of the
  // merged "POKEMON" header.
  let pcol = -1, area = 'Gift';
  for (const r of rows) {
    const idx = r.findIndex((c) => /^pokemon$/i.test((c || '').trim()));
    if (idx >= 0) { pcol = idx; continue; }
    const c2 = cell(r, 2);
    if (pcol < 0) { if (c2 && !/^-/.test(c2)) area = c2; continue; }
    const sp = cell(r, pcol + 1);
    if (sp) addSpecial('gift', sp, area);
    else if (c2 && !/^-/.test(c2)) { area = c2; pcol = -1; } // next location header
  }
}

function ingestTrades(rows) {
  // "Looking for... | Reward" pairs by location. The REWARD (one column right of
  // the merged "Reward" header) is what you obtain.
  for (let i = 0; i < rows.length; i++) {
    (rows[i] || []).forEach((c, j) => {
      if (/^reward$/i.test((c || '').trim())) {
        const sp = cell(rows[i + 1], j + 1);
        if (sp) addSpecial('trade', sp, 'In-game Trade');
      }
    });
  }
}

async function main() {
  ingestGrass(parseCSV(await fetchCsv('grass', TABS.grass)));
  ingestFishSurf(parseCSV(await fetchCsv('fishsurf', TABS.fishsurf)));
  ingestSafari(parseCSV(await fetchCsv('safari', TABS.safari)));
  ingestStatics(parseCSV(await fetchCsv('statics', TABS.statics)));
  ingestGifts(parseCSV(await fetchCsv('gifts', TABS.gifts)));
  ingestTrades(parseCSV(await fetchCsv('trades', TABS.trades)));

  // Build areas[]: sorted by first appearance is impossible without progression,
  // so keep Sheet order (insertion order of the Map ≈ Kanto progression).
  const areaList = [...areas.entries()].map(([id, a]) => ({
    id,
    name: a.name,
    unlockAfter: null,
    tags: [],
    encounters: [...a.methods.entries()]
      .sort((x, y) => x[0].localeCompare(y[0]))
      .map(([species, methods]) => ({ species, methods: [...methods].sort() })),
  }));

  const outPath = join(root, 'games/radical-red.json');
  let doc;
  if (existsSync(outPath)) {
    doc = JSON.parse(readFileSync(outPath, 'utf8'));
  } else {
    doc = {
      schemaVersion: 1,
      gameId: 'radical-red',
      name: 'Pokémon Radical Red',
      versions: ['radical-red'],
      pokeapiVersionGroups: [],
      rostersRequired: false,
      areas: [],
      specials: [],
      milestones: [],
      mechanics: {
        heldItems: true,
        wildBattles: true,
        setModeOption: true,
        raids: true,
        overworldAggro: false,
      },
    };
  }
  doc.areas = areaList;
  doc.specials = specials.sort((a, b) => a.id.localeCompare(b.id));
  writeFileSync(outPath, JSON.stringify(doc, null, 2) + '\n');

  const nSpecies = new Set(areaList.flatMap((a) => a.encounters.map((e) => e.species))).size;
  console.log(`radical-red.json: ${areaList.length} areas, ${nSpecies} distinct wild species, ${specials.length} specials`);
  if (approx.size) console.warn(`\n${approx.size} approximate mappings (RR-custom forms → base species):\n  ` + [...approx].sort().join('\n  '));
  if (unmapped.size) {
    console.error(`\n!! ${unmapped.size} UNMAPPED names (add to rr-species-map.mjs):\n  ` + [...unmapped].sort().join('\n  '));
    process.exitCode = 1;
  }
}

main();
