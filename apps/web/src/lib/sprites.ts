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

export function spriteUrl(species: string, shiny = false): string {
  return `${shiny ? BASE_SHINY : BASE}/${species}.png`;
}

export function spriteFallbackUrl(species: string, shiny = false): string {
  return `${shiny ? BASE_SHINY : BASE}/${species.replace(/-/g, '')}.png`;
}

/** Trainer sprite from Showdown's community CDN — same source as the Pokémon
 * sprites. Key is a lowercased, punctuation-stripped trainer name. */
export function trainerSpriteUrl(key: string): string {
  return `${TRAINERS}/${key}.png`;
}

// Showdown trainer-sprite keys that don't match the milestone id's trailer.
const TRAINER_ALIAS: Record<string, string> = {
  wake: 'crasherwake',
};

/** Best-effort Showdown trainer key from a milestone id (e.g. `gym-1-roark`
 * → `roark`, `gym-4-wake` → `crasherwake`). The sprite hides itself on a miss. */
export function trainerKeyFromMilestone(id: string): string {
  const tail = id.split('-').pop() ?? id;
  return TRAINER_ALIAS[tail] ?? tail;
}

/** Best-effort Showdown trainer key from a trainer class ("Ace Trainer" →
 * `acetrainer`, "Pokéfan" → `pokefan`). Showdown keys class sprites by the
 * squashed class name; the sprite hides itself on a miss, so a wrong guess
 * just renders spriteless. */
export function trainerKeyFromClass(cls: string): string {
  return cls
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '') // é → e (Pokéfan, Pokémon Ranger)
    .toLowerCase()
    .replace(/[^a-z0-9]/g, '');
}

export const NATURES = [
  'adamant', 'bashful', 'bold', 'brave', 'calm', 'careful', 'docile', 'gentle',
  'hardy', 'hasty', 'impish', 'jolly', 'lax', 'lonely', 'mild', 'modest',
  'naive', 'naughty', 'quiet', 'quirky', 'rash', 'relaxed', 'sassy', 'serious', 'timid',
] as const;
