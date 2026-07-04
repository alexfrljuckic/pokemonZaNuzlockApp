import { useState } from 'react';
import { trainerSpriteUrl } from '../lib/sprites';

/** Trainer sprite from Showdown's community CDN. Renders nothing if the key
 * doesn't resolve, so unknown trainers just fall back to a spriteless card. */
export function TrainerSprite({ trainerKey, size = 56, className }: { trainerKey: string; size?: number; className?: string }) {
  const [ok, setOk] = useState(true);
  if (!ok) return null;
  return (
    <img
      className={className}
      src={trainerSpriteUrl(trainerKey)}
      alt=""
      height={size}
      loading="lazy"
      onError={() => setOk(false)}
      style={{ imageRendering: 'pixelated', width: 'auto' }}
    />
  );
}
