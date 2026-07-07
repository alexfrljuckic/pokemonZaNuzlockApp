import { useState } from 'react';
import { itemSpriteUrl } from '../lib/sprites';

const pretty = (s: string) => s.replace(/-/g, ' ');

/** Held-item icon (Showdown itemicons). Falls back to "@ name" text if the
 * sprite 404s, so an unknown/custom item still reads. Used in the condensed
 * mon-card meta line. */
export function ItemSprite({ item, size = 28 }: { item: string; size?: number }) {
  const [failed, setFailed] = useState(false);
  if (failed) return <span className="item-sprite-fallback">@ {pretty(item)}</span>;
  return (
    <img
      className="item-sprite"
      src={itemSpriteUrl(item)}
      alt={pretty(item)}
      title={pretty(item)}
      width={size}
      height={size}
      loading="lazy"
      onError={() => setFailed(true)}
    />
  );
}
