import { useEffect, useState } from 'react';
import { trainerSpriteUrl } from '../lib/sprites';

/** Neutral trainer silhouette shown when the real Showdown sprite can't be
 * resolved or fails to load. Inline + themeable (uses currentColor) so it
 * always renders — no remote fetch, works offline and under a strict CSP. */
function GenericTrainerSprite({ size, className }: { size: number; className?: string }) {
  return (
    <svg
      className={className}
      height={size}
      width={size}
      viewBox="0 0 24 24"
      role="img"
      aria-hidden="true"
      style={{ opacity: 0.55, color: 'currentColor' }}
    >
      {/* head */}
      <circle cx="12" cy="7.5" r="4" fill="currentColor" />
      {/* shoulders / torso */}
      <path
        d="M4 22c0-4.42 3.58-8 8-8s8 3.58 8 8z"
        fill="currentColor"
      />
    </svg>
  );
}

/** Trainer sprite from Showdown's community CDN. On a load failure it falls
 * back to a bundled generic silhouette rather than rendering nothing, so every
 * trainer shows something. The fallback is local (no second network hit that
 * could also 404) and can't re-trigger onError, so there's no error loop. */
export function TrainerSprite({ trainerKey, size = 56, className }: { trainerKey: string; size?: number; className?: string }) {
  const [failed, setFailed] = useState(false);

  // Reset when the key changes so a new trainer gets a fresh attempt.
  useEffect(() => setFailed(false), [trainerKey]);

  if (failed || !trainerKey) {
    return <GenericTrainerSprite size={size} className={className} />;
  }

  return (
    <img
      className={className}
      src={trainerSpriteUrl(trainerKey)}
      alt=""
      height={size}
      loading="lazy"
      onError={() => setFailed(true)}
      style={{ imageRendering: 'pixelated', width: 'auto' }}
    />
  );
}
