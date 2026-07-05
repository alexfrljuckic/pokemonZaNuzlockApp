import { useEffect, useState } from 'react';
import type { Session } from '@supabase/supabase-js';
import { DATASETS, speciesToLine } from '../lib/datasets';
import { describeEvent, type DescribedEvent } from '../lib/describeEvent';
import { SYNC_ENABLED } from '../lib/env';
import { fetchFeed, type FeedItem } from '../lib/profiles';
import { SpriteImg } from './SpriteImg';
import { TrainerSprite } from './TrainerSprite';

/** A feed item described in the run's own language. Pure — exported for
 * tests. Falls back to the raw type for games without a local dataset. */
export function describeFeedItem(item: FeedItem): DescribedEvent | null {
  const dataset = DATASETS[item.gameId];
  if (!dataset) return null;
  return describeEvent(item.event, { dataset, speciesToLine });
}

/** "From people you follow": big beats from followed users' shared runs.
 * Polled once on mount (never realtime — COSTS.md); renders nothing when
 * sync is off, signed out, or the feed is empty. */
export function FollowFeed({ session }: { session: Session | null }) {
  const [items, setItems] = useState<{ item: FeedItem; desc: DescribedEvent }[] | null>(null);

  useEffect(() => {
    let cancelled = false;
    if (!session || !SYNC_ENABLED) return;
    fetchFeed().then((rows) => {
      if (cancelled) return;
      setItems(
        rows
          .map((item) => ({ item, desc: describeFeedItem(item) }))
          .filter((x): x is { item: FeedItem; desc: DescribedEvent } => x.desc != null),
      );
    });
    return () => {
      cancelled = true;
    };
  }, [session]);

  if (!SYNC_ENABLED || !session || !items || items.length === 0) return null;

  return (
    <div className="follow-feed">
      <h3 className="route-offmap-title">From people you follow</h3>
      <ul className="summary-list">
        {items.map(({ item, desc }) => (
          <li key={`${item.token}-${desc.key}`} className={`summary-item summary-${desc.tone}`}>
            {desc.species && <SpriteImg species={desc.species} size={28} />}
            {!desc.species && desc.trainerKey && <TrainerSprite trainerKey={desc.trainerKey} size={28} />}
            <span>
              <a href={`#share/${item.token}`}>{item.displayName || `@${item.handle}`}</a>: {desc.text}
            </span>
            <span className="muted timeline-when">{new Date(item.event.at).toLocaleString()}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}
