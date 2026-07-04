import type { EngineContext, RunEvent } from '@nuzlocke/engine';
import { SpriteImg } from './SpriteImg';

interface SummaryItem {
  key: string;
  text: string;
  species?: string;
  tone: 'catch' | 'faint' | 'milestone' | 'wipe' | 'neutral';
}

/** Turns the last ~5 "major" events into a plain-language, sprite-annotated line. */
function describe(event: RunEvent, ctx: EngineContext): SummaryItem | null {
  switch (event.type) {
    case 'encounter_resolved': {
      if (event.payload.outcome !== 'caught') return null;
      const area = ctx.dataset?.areas.find((a) => a.id === event.payload.areaId);
      const name = event.payload.nickname && event.payload.nickname !== event.payload.species
        ? `${event.payload.nickname} the ${event.payload.species}`
        : event.payload.species;
      return {
        key: `${event.seq}`,
        text: `Caught ${name}${area ? ` on ${area.name}` : ''}`,
        species: event.payload.species,
        tone: 'catch',
      };
    }
    case 'faint': {
      const milestone = event.payload.milestoneId
        ? ctx.dataset?.milestones.find((m) => m.id === event.payload.milestoneId)
        : null;
      return {
        key: `${event.seq}`,
        text: `A Pokémon fainted${milestone ? ` to ${milestone.name}` : event.payload.killer ? ` to ${event.payload.killer}` : ''}`,
        tone: 'faint',
      };
    }
    case 'milestone_cleared': {
      const milestone = ctx.dataset?.milestones.find((m) => m.id === event.payload.milestoneId);
      return {
        key: `${event.seq}`,
        text: `Cleared: ${milestone?.name ?? event.payload.milestoneId}`,
        tone: 'milestone',
      };
    }
    case 'wipe_decision': {
      return {
        key: `${event.seq}`,
        text: event.payload.decision === 'reset' ? 'Run wiped — starting over' : 'Wiped, but continuing',
        tone: 'wipe',
      };
    }
    case 'run_ended': {
      return {
        key: `${event.seq}`,
        text: event.payload.result === 'victory' ? 'Victory!' : 'Run abandoned',
        tone: event.payload.result === 'victory' ? 'milestone' : 'neutral',
      };
    }
    default:
      return null;
  }
}

export function RunSummaryStrip({ events, ctx, limit = 5 }: { events: RunEvent[]; ctx: EngineContext; limit?: number }) {
  const items: SummaryItem[] = [];
  for (let i = events.length - 1; i >= 0 && items.length < limit; i--) {
    const item = describe(events[i], ctx);
    if (item) items.push(item);
  }

  if (items.length === 0) return null;

  return (
    <section className="summary-strip">
      <h2>Recent events</h2>
      <ul className="summary-list">
        {items.map((item) => (
          <li key={item.key} className={`summary-item summary-${item.tone}`}>
            {item.species && <SpriteImg species={item.species} size={28} />}
            <span>{item.text}</span>
          </li>
        ))}
      </ul>
    </section>
  );
}
