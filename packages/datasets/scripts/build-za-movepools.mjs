// Builds generated/za-movepools.json — the per-species Legends: Z-A (gameId
// `plza`) movepools that PokeAPI does NOT expose. PokeAPI has machine-level data
// for legends-za (that's why machines-by-game.json has plza) but ZERO per-species
// learnset moves for the legends-za / mega-dimension version groups, so
// build-species-data.mjs cannot produce movesByGame.plza / levelUpMovesByGame.plza.
//
// Source: Serebii's SV Pokédex, which integrates Z-A. Each species page
//   https://www.serebii.net/pokedex-sv/<slug>/
// carries a "Legends: Z-A" section with a "Standard Level Up" table (move + level)
// and a "Legends: Z-A Technical Machine Attacks" TM table. We parse both.
//
// Output shape (merged into species-data.json by build-species-data.mjs, which
// reads this file if present):
//   {
//     "movesByGame":        { "<slug>": ["move-slug", ...] },        // level-up ∪ TM pool
//     "levelUpMovesByGame": { "<slug>": [["move-slug", level], ...] } // sorted by level
//   }
// Every emitted move slug is validated against the canonical move universe
// (moveTypes keys in the existing species-data.json); anything that doesn't map
// is logged and DROPPED — we never emit an invalid slug (would fail validate:datasets).
//
// Species scope = every species reachable in a plza run: those referenced in
// games/plza.json (encounters, specials, milestone rosters) PLUS their full
// evolution lines (via generated/species-lines.json), so evolved mons get a pool.
//
// Serebii pages are keyed by the BASE species name (forms/megas share the page),
// so all form slugs of a base inherit that base's parsed Z-A pool. Bases whose
// page has no Z-A section (not in the Z-A dex — e.g. line-only relatives, some
// legendaries) are SKIPPED and reported; we never invent moves.
//
// Regenerate:
//   node packages/datasets/scripts/build-za-movepools.mjs
//   node packages/datasets/scripts/build-species-data.mjs   # merges it in
//
// Raw HTML is cached under .cache/serebii/ so re-runs are cheap. Fetches are
// SEQUENTIAL with a small delay — be polite to Serebii. Delete the cache dir to
// force a refresh.
import { mkdirSync, readFileSync, writeFileSync, existsSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = dirname(dirname(fileURLToPath(import.meta.url)));
const cacheDir = join(root, '.cache/serebii');
const gamesDir = join(root, 'games');
const outDir = join(root, 'generated');
mkdirSync(cacheDir, { recursive: true });

const DELAY_MS = 300; // polite gap between live fetches
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

// --- Serebii slug for a base species name. Most bases are just the lowercase
// name; these need the site's punctuation quirks. Anything not listed uses the
// name verbatim (and skips gracefully if the page 404s / has no Z-A section). ---
const SEREBII_SLUG = {
  'mr-mime': 'mr.mime',
  'mr-rime': 'mr.rime',
  'mime-jr': 'mimejr.',
  farfetchd: "farfetch'd",
  sirfetchd: "sirfetch'd",
};

// Form suffixes to peel to reach the base species (Serebii keys pages by base).
// Longest-first so "mega-x" is stripped before "mega". Applied repeatedly.
const FORM_SUFFIXES = [
  'power-construct', 'mega-x', 'mega-y', 'mega-z', 'mega', 'gmax', 'alola',
  'galar', 'hisui', 'paldea', 'starter', 'totem', 'ash', 'battle-bond',
  'resolute', 'original-cap', 'partner-cap', 'kalos-cap', 'alola-cap',
  'hoenn-cap', 'sinnoh-cap', 'unova-cap', 'world-cap', 'cosplay', 'rock-star',
  'belle', 'pop-star', 'phd', 'libre', 'male', 'female', 'average', 'small',
  'large', 'super', 'shield', 'blade', 'disguised', 'busted', 'amped',
  'low-key', 'incarnate', 'therian', 'ordinary', 'eternal', 'curly', 'droopy',
  'stretchy', 'fan', 'frost', 'heat', 'mow', 'wash', 'complete', '50', '10',
];
function baseName(slug) {
  let s = slug;
  let changed = true;
  while (changed) {
    changed = false;
    for (const suf of FORM_SUFFIXES) {
      if (s.endsWith(`-${suf}`) && s.length > suf.length + 1) {
        s = s.slice(0, -(suf.length + 1));
        changed = true;
        break;
      }
    }
  }
  return s;
}

async function fetchHtml(slug) {
  const file = join(cacheDir, `${encodeURIComponent(slug)}.html`);
  if (existsSync(file)) return readFileSync(file, 'utf8');
  const url = `https://www.serebii.net/pokedex-sv/${slug}/`;
  // per-request timeout — `fetch` has none, so a single stalled connection would
  // hang the whole sequential run (this is what wedged the first attempt).
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 15000);
  let res;
  try {
    res = await fetch(url, { signal: controller.signal });
  } finally {
    clearTimeout(timer);
  }
  if (res.status === 404) {
    writeFileSync(file, ''); // cache the miss so we don't refetch
    await sleep(DELAY_MS);
    return '';
  }
  if (!res.ok) throw new Error(`${res.status} ${res.statusText} for ${url}`);
  const html = await res.text();
  writeFileSync(file, html);
  await sleep(DELAY_MS);
  return html;
}

// --- move-name -> PokeAPI slug. Normalize the Serebii DISPLAY name, then a few
// explicit aliases for names our normalization can't derive. Validated against
// the canonical move set before anything is emitted. ---
const MOVE_ALIASES = {
  "forest's curse": 'forests-curse',
  "land's wrath": 'lands-wrath',
  "nature's madness": 'natures-madness',
};
function moveSlug(name) {
  const key = name.toLowerCase().trim();
  if (MOVE_ALIASES[key]) return MOVE_ALIASES[key];
  return key
    .replace(/[’']/g, '') // strip apostrophes
    .replace(/[.:]/g, '') // strip periods/colons
    .replace(/\s+/g, '-'); // spaces -> hyphens (hyphens in names like "u-turn" already match)
}

// Decode the handful of HTML entities Serebii uses in move/level cells.
const decode = (s) =>
  s
    .replace(/&#8212;/g, '—')
    .replace(/&eacute;/g, 'é')
    .replace(/&amp;/g, '&')
    .replace(/&#39;/g, "'");

// --- Parse the two Z-A tables out of a species page. Returns
// { levelUp: Map<displayName, level>, tm: Set<displayName> } or null if the page
// has no Z-A section at all. ---
function parseZA(html) {
  if (!html) return null;
  // The Z-A tables render FIRST (default tab). The Z-A TM table's header is a
  // reliable Z-A marker; its absence means the page has no Z-A learnset.
  const zaTmHeader = 'Legends: Z-A Technical Machine Attacks';
  const tmIdx = html.indexOf(zaTmHeader);
  if (tmIdx === -1) return null;

  // Z-A "Standard Level Up" is the FIRST "Standard Level Up" on the page
  // (SV's copy comes later). It sits before the Z-A TM table.
  const luHeaderIdx = html.indexOf('Standard Level Up');
  const levelUp = new Map();
  if (luHeaderIdx !== -1 && luHeaderIdx < tmIdx) {
    parseAttackTable(html.slice(luHeaderIdx, tmIdx), true, levelUp);
  }

  // Z-A TM table runs from its header to the next dextable that starts an SV
  // section — the next "Standard Level Up" (SV) or end of doc, whichever first.
  const svLuIdx = html.indexOf('Standard Level Up', tmIdx);
  const tmEnd = svLuIdx === -1 ? html.length : svLuIdx;
  const tm = new Map();
  parseAttackTable(html.slice(tmIdx, tmEnd), false, tm);

  return { levelUp, tm: new Set(tm.keys()) };
}

// Walk the move rows of an attack table. Each move row has, as its first two
// fooinfo cells: (level | TM#) and the move link. We key off the move link
// `/attackdex-sv/<x>.shtml` and, when `wantLevel`, the level cell that precedes
// it. Level "—" (— starter / level 0) is recorded as 1.
function parseAttackTable(segment, wantLevel, out) {
  const linkRe = /<a href="\/attackdex-sv\/[^"]+\.shtml">([^<]+)<\/a>/g;
  let m;
  while ((m = linkRe.exec(segment)) !== null) {
    const name = decode(m[1]).trim();
    if (!name) continue;
    let level = 1;
    if (wantLevel) {
      // The level lives in the fooinfo cell just before this move link.
      const before = segment.slice(Math.max(0, m.index - 300), m.index);
      const cells = [...before.matchAll(/<td[^>]*class="fooinfo"[^>]*>([\s\S]*?)(?=<\/td>|<a href)/g)];
      const lvlCellRaw = cells.length ? cells[cells.length - 1][1] : '';
      // strip the trailing <i>NN</i> Plus-Move value and any imgs, then read the
      // FIRST number. A bare em-dash (—, level 0/starter) -> level 1.
      const lvlText = decode(lvlCellRaw).replace(/<i>[\s\S]*?<\/i>/g, '').replace(/<[^>]+>/g, '');
      const numMatch = lvlText.match(/\d+/);
      if (numMatch) level = parseInt(numMatch[0], 10);
      else level = 1; // em-dash / no number
    }
    const prev = out.get(name);
    if (prev == null || level < prev) out.set(name, level);
  }
}

async function main() {
  // 1. species scope = plza references + full evolution lines
  const game = JSON.parse(readFileSync(join(gamesDir, 'plza.json'), 'utf8'));
  const direct = new Set();
  const add = (s) => s && direct.add(s);
  for (const a of game.areas ?? []) {
    for (const e of a.encounters ?? []) add(e.species);
    for (const t of a.trainers ?? []) for (const p of t.team) add(p.species);
  }
  for (const s of game.specials ?? []) add(s.species);
  for (const mst of game.milestones ?? []) {
    for (const p of mst.roster ?? []) add(p.species);
    for (const v of Object.values(mst.rosterByStarter ?? {})) for (const p of v) add(p.species);
  }
  const lines = JSON.parse(readFileSync(join(outDir, 'species-lines.json'), 'utf8'));
  const byChain = {};
  for (const [slug, cid] of Object.entries(lines)) (byChain[cid] ??= []).push(slug);
  const scope = new Set(direct);
  for (const s of direct) {
    const cid = lines[s];
    if (cid) for (const member of byChain[cid]) scope.add(member);
  }
  const slugs = [...scope].sort();
  console.log(`${direct.size} plza species; ${slugs.length} after evolution-line expansion`);

  // canonical move universe (validate every emitted slug against it)
  const speciesData = JSON.parse(readFileSync(join(outDir, 'species-data.json'), 'utf8'));
  const knownMoves = new Set(Object.keys(speciesData.moveTypes ?? {}));

  // 2. group slugs by Serebii base page so we fetch each page once
  const byBase = new Map(); // base -> [slug,...]
  for (const slug of slugs) {
    const b = baseName(slug);
    if (!byBase.has(b)) byBase.set(b, []);
    byBase.get(b).push(slug);
  }
  console.log(`${byBase.size} distinct Serebii base pages to fetch`);

  const movesByGame = {};
  const levelUpMovesByGame = {};
  const skippedNoZA = []; // base pages with no Z-A section
  const skipped404 = []; // base pages that 404'd
  const unmappedMoves = new Map(); // display name -> count (dropped)

  let done = 0;
  for (const [base, memberSlugs] of byBase) {
    const serebiiSlug = SEREBII_SLUG[base] ?? base;
    let html;
    try {
      html = await fetchHtml(serebiiSlug);
    } catch (e) {
      console.warn(`  fetch error ${base} (${serebiiSlug}): ${e.message}`);
      skipped404.push(base);
      continue;
    }
    if (!html) {
      skipped404.push(base);
      continue;
    }
    const parsed = parseZA(html);
    if (!parsed) {
      skippedNoZA.push(base);
      continue;
    }

    // resolve display names -> validated PokeAPI slugs
    const luPairs = []; // [slug, level]
    const poolSlugs = new Set();
    const resolve = (name) => {
      const slug = moveSlug(name);
      if (knownMoves.has(slug)) return slug;
      unmappedMoves.set(name, (unmappedMoves.get(name) ?? 0) + 1);
      return null;
    };
    for (const [name, level] of parsed.levelUp) {
      const s = resolve(name);
      if (s) {
        luPairs.push([s, level]);
        poolSlugs.add(s);
      }
    }
    for (const name of parsed.tm) {
      const s = resolve(name);
      if (s) poolSlugs.add(s);
    }
    if (poolSlugs.size === 0) {
      skippedNoZA.push(base);
      continue;
    }

    // collapse duplicate level-up slugs keeping min level
    const luMap = new Map();
    for (const [s, lvl] of luPairs) {
      const prev = luMap.get(s);
      if (prev == null || lvl < prev) luMap.set(s, lvl);
    }
    const sortedLu = [...luMap.entries()].sort((a, b) => a[1] - b[1] || a[0].localeCompare(b[0]));
    const sortedPool = [...poolSlugs].sort();

    // every member slug of this base inherits the parsed Z-A data
    for (const slug of memberSlugs) {
      movesByGame[slug] = sortedPool;
      if (sortedLu.length) levelUpMovesByGame[slug] = sortedLu;
    }
    if (++done % 25 === 0) console.log(`  parsed ${done}/${byBase.size} base pages`);
  }

  const sortObj = (o) => Object.fromEntries(Object.entries(o).sort(([a], [b]) => a.localeCompare(b)));
  const out = {
    _source: 'https://www.serebii.net/pokedex-sv/<slug>/ (Legends: Z-A section)',
    _generatedBy: 'packages/datasets/scripts/build-za-movepools.mjs',
    movesByGame: sortObj(movesByGame),
    levelUpMovesByGame: sortObj(levelUpMovesByGame),
  };
  const outFile = join(outDir, 'za-movepools.json');
  writeFileSync(outFile, JSON.stringify(out) + '\n');

  const coveredSlugs = Object.keys(movesByGame).length;
  console.log('\n=== Z-A movepool coverage ===');
  console.log(`species with a Z-A pool: ${coveredSlugs}/${slugs.length}`);
  console.log(`base pages parsed: ${done}/${byBase.size}`);
  if (skipped404.length)
    console.log(`skipped (no Serebii page / 404): ${skipped404.sort().join(', ')}`);
  if (skippedNoZA.length)
    console.log(`skipped (page has no Z-A section): ${skippedNoZA.sort().join(', ')}`);
  if (unmappedMoves.size) {
    console.log(`\nunmapped move names (DROPPED — add an alias if legit):`);
    for (const [name, n] of [...unmappedMoves.entries()].sort()) console.log(`  "${name}" x${n}`);
  }
  console.log(`\nwrote ${outFile}`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
