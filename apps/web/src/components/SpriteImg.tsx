import { useState } from 'react';
import { spriteFallbackUrl, spriteUrl } from '../lib/sprites';

/** Pokémon sprite with automatic hyphen-stripped fallback, then a pokeball glyph. */
export function SpriteImg({ species, size = 64, className }: { species: string; size?: number; className?: string }) {
  const [stage, setStage] = useState(0); // 0 = primary url, 1 = fallback url, 2 = give up

  if (stage === 2) {
    return (
      <span className={`sprite-missing ${className ?? ''}`} style={{ width: size, height: size }} aria-hidden="true">
        ●
      </span>
    );
  }

  return (
    <img
      className={className}
      src={stage === 0 ? spriteUrl(species) : spriteFallbackUrl(species)}
      alt={species}
      width={size}
      height={size}
      loading="lazy"
      onError={() => setStage(stage + 1)}
      style={{ imageRendering: 'pixelated' }}
    />
  );
}
