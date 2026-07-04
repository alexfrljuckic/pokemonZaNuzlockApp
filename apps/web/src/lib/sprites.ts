/* Pokémon sprites from Pokémon Showdown's community-standard sprite CDN,
   addressable by name (PokeAPI's own sprite repo is keyed by dex number,
   which our datasets don't carry). Most PokeAPI slugs map directly; base
   species whose slug contains a hyphen (mr-mime, ho-oh, ...) need it
   stripped, while regional forms (stunfisk-galar) keep theirs — the <img>
   onError fallback in SpriteImg tries the stripped variant automatically. */

const BASE = 'https://play.pokemonshowdown.com/sprites/gen5';
const TRAINERS = 'https://play.pokemonshowdown.com/sprites/trainers';

export function spriteUrl(species: string, shiny = false): string {
  return `${BASE}${shiny ? '/shiny' : ''}/${species}.png`;
}

export function spriteFallbackUrl(species: string, shiny = false): string {
  return `${BASE}${shiny ? '/shiny' : ''}/${species.replace(/-/g, '')}.png`;
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

export const NATURES = [
  'adamant', 'bashful', 'bold', 'brave', 'calm', 'careful', 'docile', 'gentle',
  'hardy', 'hasty', 'impish', 'jolly', 'lax', 'lonely', 'mild', 'modest',
  'naive', 'naughty', 'quiet', 'quirky', 'rash', 'relaxed', 'sassy', 'serious', 'timid',
] as const;
