import { useMemo, useState } from 'react';
import type { EngineContext, PokemonInstance, RunEvent } from '@nuzlocke/engine';
import { describeEvent, visibleEvents, type DescribedEvent } from '../lib/describeEvent';
import { SpriteImg } from './SpriteImg';
import { TrainerSprite } from './TrainerSprite';

/** Newest-first readable history: every "major" event per describeEvent,
 * paired with its raw event for timestamps. Pure — exported for tests. */
export function buildTimeline(
  events: RunEvent[],
  ctx: EngineContext,
  pokemon?: Record<string, PokemonInstance>,
): { ev: RunEvent; item: DescribedEvent }[] {
  return visibleEvents(events)
    .sort((a, b) => b.seq - a.seq)
    .map((ev) => ({ ev, item: describeEvent(ev, ctx, pokemon) }))
    .filter((x): x is { ev: RunEvent; item: DescribedEvent } => x.item != null);
}

// Filter chips over DescribedEvent.tone. "Bosses" = milestone_cleared only;
// route trainers get their own "Trainers" chip. "Misc" = wipes, run endings,
// evolutions, next-boss picks — everything that isn't a catch/death/boss/trainer.
const FILTERS: { id: string; label: string; tones: DescribedEvent['tone'][] }[] = [
  { id: 'all', label: 'All', tones: [] },
  { id: 'catch', label: 'Catches', tones: ['catch'] },
  { id: 'faint', label: 'Deaths', tones: ['faint'] },
  { id: 'milestone', label: 'Bosses', tones: ['milestone'] },
  { id: 'trainer', label: 'Trainers', tones: ['trainer'] },
  { id: 'misc', label: 'Misc', tones: ['wipe', 'neutral'] },
];

/** The run's readable, filterable history — shared by the owner's Stats tab
 * and the spectator view so both read the same language (C2 parity). */
export function RunTimeline({
  events,
  ctx,
  pokemon,
}: {
  events: RunEvent[];
  ctx: EngineContext;
  pokemon?: Record<string, PokemonInstance>;
}) {
  const [filter, setFilter] = useState('all');
  const timeline = useMemo(() => buildTimeline(events, ctx, pokemon), [events, ctx, pokemon]);
  const active = FILTERS.find((f) => f.id === filter) ?? FILTERS[0];
  const shown = active.tones.length === 0 ? timeline : timeline.filter(({ item }) => active.tones.includes(item.tone));

  return (
    <>
      <div className="tl-filters" role="tablist" aria-label="Timeline filters">
        {FILTERS.map((f) => {
          const count =
            f.tones.length === 0
              ? timeline.length
              : timeline.filter(({ item }) => f.tones.includes(item.tone)).length;
          return (
            <button
              key={f.id}
              type="button"
              role="tab"
              aria-selected={filter === f.id}
              className={`zone-chip${filter === f.id ? ' selected' : ''}`}
              onClick={() => setFilter(f.id)}
            >
              {f.label} <span className="muted">{count}</span>
            </button>
          );
        })}
      </div>
      {shown.length === 0 && <p className="muted">Nothing here yet.</p>}
      <ul className="summary-list">
        {shown.map(({ ev, item }) => (
          <li key={item.key} className={`summary-item summary-${item.tone}`}>
            {item.species && <SpriteImg species={item.species} size={28} />}
            {!item.species && item.trainerKey && <TrainerSprite trainerKey={item.trainerKey} size={28} />}
            <span>{item.text}</span>
            <span className="muted timeline-when">{new Date(ev.at).toLocaleString()}</span>
          </li>
        ))}
      </ul>
    </>
  );
}
