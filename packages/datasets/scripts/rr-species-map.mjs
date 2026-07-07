// Maps Radical Red spreadsheet display names to PokeAPI slugs (the identity our
// datasets + species-data build use). Returns { slug, approx } or null when a
// name can't be resolved (the caller reports those so they never silently ship).
//
// `approx: true` flags RR-custom forms with no PokeAPI equivalent (the "-Sevii"
// regional variants, RR-only cosmetic formes) that we map to their base species
// for RR1 — RR2 (the Showdown-mod species overrides) can supply the real data.
//
// Verify slugs by re-running build-species-data.mjs: a wrong slug 404s PokeAPI.

// Names that resolve to a specific PokeAPI default-variety slug (PokeAPI keys
// battle-only / default formes under a suffixed slug, not the bare species).
const DEFAULT_VARIETY = {
  aegislash: 'aegislash-shield',
  basculin: 'basculin-red-striped',
  basculegion: 'basculegion-male',
  darmanitan: 'darmanitan-standard',
  'darmanitan-galar': 'darmanitan-galar-standard',
  deoxys: 'deoxys-normal',
  eiscue: 'eiscue-ice',
  enamorus: 'enamorus-incarnate',
  frillish: 'frillish-male',
  giratina: 'giratina-altered',
  indeedee: 'indeedee-male',
  jellicent: 'jellicent-male',
  keldeo: 'keldeo-ordinary',
  lycanroc: 'lycanroc-midday',
  maushold: 'maushold-family-of-four',
  meloetta: 'meloetta-aria',
  meowstic: 'meowstic-male',
  mimikyu: 'mimikyu-disguised',
  minior: 'minior-red-meteor',
  morpeko: 'morpeko-full-belly',
  oinkologne: 'oinkologne-male',
  oricorio: 'oricorio-baile',
  palafin: 'palafin-zero',
  pumpkaboo: 'pumpkaboo-average',
  pyroar: 'pyroar-male',
  dudunsparce: 'dudunsparce-two-segment',
  shaymin: 'shaymin-land',
  squawkabilly: 'squawkabilly-green-plumage',
  tatsugiri: 'tatsugiri-curly',
  toxtricity: 'toxtricity-amped',
  tornadus: 'tornadus-incarnate',
  thundurus: 'thundurus-incarnate',
  landorus: 'landorus-incarnate',
  urshifu: 'urshifu-single-strike',
  wishiwashi: 'wishiwashi-solo',
  wormadam: 'wormadam-plant',
  zygarde: 'zygarde-50',
  'mr-mime': 'mr-mime',
  'mime-jr': 'mime-jr',
};

// RR/legendary shorthand form suffixes → PokeAPI variety slug. Applied to the
// normalized slug (after gender/base normalization).
const FORM_ABBREV = {
  'basculin-blue': 'basculin-blue-striped',
  'basculin-white': 'basculin-white-striped',
  'basculin-red': 'basculin-red-striped',
  'deoxys-a': 'deoxys-attack',
  'deoxys-d': 'deoxys-defense',
  'deoxys-s': 'deoxys-speed',
  'giratina-o': 'giratina-origin',
  'shaymin-s': 'shaymin-sky',
  'landorus-i': 'landorus-incarnate',
  'landorus-t': 'landorus-therian',
  'tornadus-i': 'tornadus-incarnate',
  'tornadus-t': 'tornadus-therian',
  'thundurus-i': 'thundurus-incarnate',
  'thundurus-t': 'thundurus-therian',
  'enamorus-i': 'enamorus-incarnate',
  'enamorus-t': 'enamorus-therian',
  'kyurem-w': 'kyurem-white',
  'kyurem-b': 'kyurem-black',
  'necrozma-dm': 'necrozma-dusk',
  'necrozma-dw': 'necrozma-dawn',
  'hoopa-u': 'hoopa-unbound',
  'urshifu-single': 'urshifu-single-strike',
  'urshifu-rapid': 'urshifu-rapid-strike',
  'tauros-combat': 'tauros-paldea-combat-breed',
  'tauros-blaze': 'tauros-paldea-blaze-breed',
  'tauros-aqua': 'tauros-paldea-aqua-breed',
  'ogerpon-wellspring': 'ogerpon-wellspring-mask',
  'ogerpon-hearthflame': 'ogerpon-hearthflame-mask',
  'ogerpon-cornerstone': 'ogerpon-cornerstone-mask',
};

// Cosmetic/seasonal formes PokeAPI folds into the base /pokemon slug → map to
// base, flagged approx (the RR form is real in-game; its stats == base here).
const FOLD_TO_BASE = {
  'burmy-sandy': 'burmy', 'burmy-trash': 'burmy',
  'deerling-summer': 'deerling', 'deerling-autumn': 'deerling', 'deerling-winter': 'deerling',
  'sawsbuck-summer': 'sawsbuck', 'sawsbuck-autumn': 'sawsbuck', 'sawsbuck-winter': 'sawsbuck',
  'shellos-east': 'shellos', 'gastrodon-east': 'gastrodon',
};

// Explicit whole-name aliases (RR display → PokeAPI slug), applied to the
// pre-normalized display name (case-insensitive, trimmed).
const ALIASES = {
  'type: null': 'type-null',
  "farfetch'd": 'farfetchd',
  "sirfetch'd": 'sirfetchd',
  'mr. mime': 'mr-mime',
  'mr. mime-galar': 'mr-mime-galar',
  'mime jr.': 'mime-jr',
  'mr. rime': 'mr-rime',
  'flabébé': 'flabebe',
  'nidoran-f': 'nidoran-f',
  'nidoran-m': 'nidoran-m',
  'indeedee-f': 'indeedee-female',
  'indeedee-m': 'indeedee-male',
  // RR shorthand formes → PokeAPI slug
  'pumpkaboo-la': 'pumpkaboo-large',
  'pumpkaboo-sm': 'pumpkaboo-small',
  'pumpkaboo-su': 'pumpkaboo-super',
  'gourgeist-la': 'gourgeist-large',
  'gourgeist-sm': 'gourgeist-small',
  'gourgeist-su': 'gourgeist-super',
  'squawkabilly-g': 'squawkabilly-green-plumage',
  'squawkabilly-w': 'squawkabilly-white-plumage',
  'squawkabilly-b': 'squawkabilly-blue-plumage',
  'squawkabilly-y': 'squawkabilly-yellow-plumage',
  'ursaluna-bm': 'ursaluna-bloodmoon',
  'alcremie-strbrry': 'alcremie',
  'pikachu-popstar': 'pikachu',
  'tauros-paldea': 'tauros-paldea-combat-breed',
  'toxtricity-lowkey': 'toxtricity-low-key',
};

// RR-custom regional/cosmetic form suffixes with NO PokeAPI equivalent → map to
// base species, flagged approx. "-Sevii" is RR's own regional variant line.
const APPROX_SUFFIXES = ['-sevii'];

function baseNormalize(name) {
  return name
    .trim()
    .toLowerCase()
    .replace(/♀/g, '-f')
    .replace(/♂/g, '-m')
    .replace(/[’']/g, '')
    .replace(/[:.]/g, '')
    .replace(/é/g, 'e')
    .replace(/\s+/g, '-')
    .replace(/-{2,}/g, '-')
    .replace(/^-+|-+$/g, '');
}

// Sheet placeholders for a hidden/undecided obtain — skip silently, not an error.
const SKIP = new Set(['???', '?', 'tbd', 'random', 'varies', 'n/a', '-']);

export function normalizeSpecies(rawName) {
  if (!rawName) return null;
  const disp = rawName.trim().toLowerCase();
  if (SKIP.has(disp)) return { slug: null, skip: true };
  if (ALIASES[disp]) return { slug: ALIASES[disp], approx: false };

  // strip " - M" / " - F" gender markers (spaced), not the Nidoran/Indeedee
  // hyphen-forms handled above.
  let name = rawName.replace(/\s*-\s*[MF]\s*$/i, '').replace(/\s*\((?:M|F)\)\s*$/i, '');

  let approx = false;
  let slug = baseNormalize(name);

  // check aliases again after gender strip
  if (ALIASES[slug]) return { slug: ALIASES[slug], approx: false };

  for (const suf of APPROX_SUFFIXES) {
    if (slug.endsWith(suf)) { slug = slug.slice(0, -suf.length); approx = true; }
  }

  if (FOLD_TO_BASE[slug]) { slug = FOLD_TO_BASE[slug]; approx = true; }
  else if (FORM_ABBREV[slug]) slug = FORM_ABBREV[slug];
  else if (DEFAULT_VARIETY[slug]) slug = DEFAULT_VARIETY[slug];

  return { slug, approx };
}
