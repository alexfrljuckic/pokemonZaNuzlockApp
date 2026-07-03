/* Pokémon sprites from Pokémon Showdown's community-standard sprite CDN,
   addressable by name (PokeAPI's own sprite repo is keyed by dex number,
   which our datasets don't carry). Most PokeAPI slugs map directly; base
   species whose slug contains a hyphen (mr-mime, ho-oh, ...) need it
   stripped, while regional forms (stunfisk-galar) keep theirs — the <img>
   onError fallback in SpriteImg tries the stripped variant automatically. */

const BASE = 'https://play.pokemonshowdown.com/sprites/gen5';

export function spriteUrl(species: string): string {
  return `${BASE}/${species}.png`;
}

export function spriteFallbackUrl(species: string): string {
  return `${BASE}/${species.replace(/-/g, '')}.png`;
}

export const NATURES = [
  'adamant', 'bashful', 'bold', 'brave', 'calm', 'careful', 'docile', 'gentle',
  'hardy', 'hasty', 'impish', 'jolly', 'lax', 'lonely', 'mild', 'modest',
  'naive', 'naughty', 'quiet', 'quirky', 'rash', 'relaxed', 'sassy', 'serious', 'timid',
] as const;
