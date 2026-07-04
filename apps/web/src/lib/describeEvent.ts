import type { EngineContext, RunEvent } from '@nuzlocke/engine';

export interface DescribedEvent {
  key: string;
  text: string;
  species?: string;
  tone: 'catch' | 'faint' | 'milestone' | 'wipe' | 'neutral';
}

/** Plain-language, sprite-annotated description of a "major" event; null for
 * minor bookkeeping events. Shared by the owner's summary strip and the
 * spectator timeline so both read the same language. */
export function describeEvent(event: RunEvent, ctx: EngineContext): DescribedEvent | null {
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
    case 'special_claimed': {
      const special = ctx.dataset?.specials?.find((s) => s.id === event.payload.specialId);
      const isStarter = special?.id.startsWith('starter-') ?? false;
      const name = event.payload.nickname && event.payload.nickname !== event.payload.species
        ? `${event.payload.nickname} the ${event.payload.species}`
        : event.payload.species;
      return {
        key: `${event.seq}`,
        text: isStarter ? `Chose ${name} as starter` : `Claimed ${name}${special ? ` (${special.type})` : ''}`,
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
