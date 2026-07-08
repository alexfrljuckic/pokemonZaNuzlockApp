/* Pokémon sprites from Pokémon Showdown's community-standard sprite CDN,
   addressable by name (PokeAPI's own sprite repo is keyed by dex number,
   which our datasets don't carry). Most PokeAPI slugs map directly; base
   species whose slug contains a hyphen (mr-mime, ho-oh, ...) need it
   stripped, while regional forms (stunfisk-galar) keep theirs — the <img>
   onError fallback in SpriteImg tries the stripped variant automatically. */

// Showdown keeps shiny sprites in a sibling dir (gen5-shiny), not a subfolder.
const BASE = 'https://play.pokemonshowdown.com/sprites/gen5';
const BASE_SHINY = 'https://play.pokemonshowdown.com/sprites/gen5-shiny';
const TRAINERS = 'https://play.pokemonshowdown.com/sprites/trainers';

// PokeAPI slugs whose Showdown sprite lives under a different key — datasets
// carry the canonical PokeAPI slug (often a default-variety suffix PokeAPI
// requires), sprites remap here. The onError hyphen-stripping fallback in
// SpriteImg covers most other forms; these are the ones it can't reach.
const SPECIES_SPRITE_ALIAS: Record<string, string> = {
  'giratina-altered': 'giratina',
  'darmanitan-galar-standard': 'darmanitan-galar',
  'frillish-male': 'frillish',
  'jellicent-male': 'jellicent',
  'morpeko-full-belly': 'morpeko',
  'wishiwashi-solo': 'wishiwashi',
  'mimikyu-disguised': 'mimikyu',
  'eiscue-ice': 'eiscue',
  'toxtricity-amped': 'toxtricity',
  'toxtricity-low-key': 'toxtricity-lowkey',
  'indeedee-male': 'indeedee',
  'indeedee-female': 'indeedee-f',
  'oinkologne-male': 'oinkologne',
  'oinkologne-female': 'oinkologne-f',
  'dudunsparce-two-segment': 'dudunsparce',
  'squawkabilly-green-plumage': 'squawkabilly',
  'basculin-red-striped': 'basculin',
  'basculin-blue-striped': 'basculin-bluestriped',
  'basculin-white-striped': 'basculin-whitestriped',
  'tauros-paldea-combat-breed': 'tauros-paldeacombat',
  'tauros-paldea-blaze-breed': 'tauros-paldeablaze',
  'tauros-paldea-aqua-breed': 'tauros-paldeaaqua',
};

export function spriteUrl(species: string, shiny = false): string {
  const key = SPECIES_SPRITE_ALIAS[species] ?? species;
  return `${shiny ? BASE_SHINY : BASE}/${key}.png`;
}

export function spriteFallbackUrl(species: string, shiny = false): string {
  const key = SPECIES_SPRITE_ALIAS[species] ?? species;
  return `${shiny ? BASE_SHINY : BASE}/${key.replace(/-/g, '')}.png`;
}

/** Trainer sprite from Showdown's community CDN — same source as the Pokémon
 * sprites. Key is a lowercased, punctuation-stripped trainer name. */
export function trainerSpriteUrl(key: string): string {
  return `${TRAINERS}/${key}.png`;
}

// Held-item icons from Showdown's itemicons CDN (24×24). Our held-item slugs
// (choice-band, life-orb, …) match Showdown's item ids directly, so no remap.
const ITEMICONS = 'https://play.pokemonshowdown.com/sprites/itemicons';
export function itemSpriteUrl(item: string): string {
  return `${ITEMICONS}/${item}.png`;
}

// Showdown trainer-sprite keys that don't match the milestone id's trailer.
const TRAINER_ALIAS: Record<string, string> = {
  wake: 'crasherwake',
  // Radical Red (Kanto/FireRed) uses bare Kanto E4 + Lt. Surge ids; Showdown
  // files them under different keys (gen-1 variants / the "lt" prefix).
  surge: 'ltsurge',
  lorelei: 'lorelei-gen1',
  agatha: 'agatha-gen1',
};

/** Best-effort Showdown trainer key from a milestone id (e.g. `gym-1-roark`
 * → `roark`, `gym-4-wake` → `crasherwake`). The sprite hides itself on a miss. */
export function trainerKeyFromMilestone(id: string): string {
  const tail = id.split('-').pop() ?? id;
  return TRAINER_ALIAS[tail] ?? tail;
}

// Trainer classes whose squashed name doesn't match a real Showdown sprite
// filename, remapped to the closest sprite that exists. Every value here was
// verified to return 200 on the Showdown trainers CDN. Classes with no
// reasonable Showdown match (Commander, Galactic Boss, Engineer, Tamer, Gamer,
// Model, Colleagues, Music Crew, Medical Team, PI, Rail Staff, ...) are
// deliberately omitted so they fall through to the generic TrainerSprite fallback.
const TRAINER_CLASS_ALIAS: Record<string, string> = {
  coachtrainer: 'acetrainer', // SwSh generic trainer class → generic ace sprite
  gymtrainer: 'acetrainer',
  student: 'schoolkid',
  fisher: 'fisherman',
  rocker: 'guitarist',
  ranchers: 'rancher',
  policeofficer: 'policeman',
  daringcouple: 'youngcouple',
  medicalteam: 'doctor',
  // Team grunts: datasets prefix "Team", Showdown files don't.
  teamgalacticgrunt: 'galacticgrunt',
  teamrocketgrunt: 'rocketgrunt',
  teamyellgrunt: 'yellgrunt',
  teamyellgrunts: 'yellgrunt',
  teamyellgruntgymtrainer: 'yellgrunt',
};

/** Best-effort Showdown trainer key from a trainer class ("Ace Trainer" →
 * `acetrainer`, "Pokéfan" → `pokefan`). Showdown keys class sprites by the
 * squashed class name; classes whose squashed name has no Showdown file are
 * remapped via TRAINER_CLASS_ALIAS. Any remaining miss renders the generic
 * fallback sprite (see TrainerSprite), never nothing. */
export function trainerKeyFromClass(cls: string): string {
  const squashed = cls
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '') // é → e (Pokéfan, Pokémon Ranger)
    .toLowerCase()
    .replace(/[^a-z0-9]/g, '');
  return TRAINER_CLASS_ALIAS[squashed] ?? squashed;
}

// Named story bosses whose Showdown sprite is keyed by CHARACTER name, not
// their generic trainer class — Commander / Galactic Boss have no class sprite,
// but mars/jupiter/saturn/cyrus.png all exist. Verified 200 on the CDN.
const TRAINER_NAME_SPRITE: Record<string, string> = {
  mars: 'mars',
  jupiter: 'jupiter',
  saturn: 'saturn',
  cyrus: 'cyrus',
};

/** Character-name key: drop any "(w/ Barry)" parenthetical, then squash like a
 * class name. "Mars (w/ Barry)" → "mars". */
function trainerNameKey(name: string): string {
  return name
    .split('(')[0]
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]/g, '');
}

/** Best Showdown trainer-sprite key for a dataset trainer: a named story boss
 * (Mars/Jupiter/Saturn/Cyrus) gets their own character sprite; everyone else
 * falls back to their class sprite. undefined only when neither resolves. */
export function trainerSpriteKeyFor(t: { name?: string; class?: string }): string | undefined {
  if (t.name) {
    const named = TRAINER_NAME_SPRITE[trainerNameKey(t.name)];
    if (named) return named;
  }
  return t.class ? trainerKeyFromClass(t.class) : undefined;
}

export const NATURES = [
  'adamant', 'bashful', 'bold', 'brave', 'calm', 'careful', 'docile', 'gentle',
  'hardy', 'hasty', 'impish', 'jolly', 'lax', 'lonely', 'mild', 'modest',
  'naive', 'naughty', 'quiet', 'quirky', 'rash', 'relaxed', 'sassy', 'serious', 'timid',
] as const;
