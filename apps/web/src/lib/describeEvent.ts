import type { EngineContext, PokemonInstance, RunEvent } from '@nuzlocke/engine';
import { trainerKeyFromClass, trainerKeyFromMilestone } from './sprites';

export interface DescribedEvent {
  key: string;
  text: string;
  species?: string;
  /** Showdown trainer-sprite key, for trainer/boss events. */
  trainerKey?: string;
  tone: 'catch' | 'faint' | 'milestone' | 'wipe' | 'neutral';
}

/** Plain-language, sprite-annotated description of a "major" event; null for
 * minor bookkeeping events. Shared by the owner's summary strip and the
 * spectator timeline so both read the same language. Pass the derived
 * state's pokemon map to name faint victims (the event only carries an id;
 * the graveyard keeps dead mons, so the lookup works even later). */
export function describeEvent(
  event: RunEvent,
  ctx: EngineContext,
  pokemon?: Record<string, PokemonInstance>,
): DescribedEvent | null {
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
      const p = pokemon?.[event.payload.pokemonId];
      const who = p
        ? p.nickname && p.nickname !== p.species
          ? `${p.nickname} the ${p.species}`
          : p.species
        : 'A Pokémon';
      return {
        key: `${event.seq}`,
        text: `${who} fainted${milestone ? ` to ${milestone.name}` : event.payload.killer ? ` to ${event.payload.killer}` : ''}`,
        species: p?.species,
        tone: 'faint',
      };
    }
    case 'pokemon_evolved': {
      const p = pokemon?.[event.payload.pokemonId];
      // the state map holds the POST-evolution species; the event carries the target
      const who = p && p.nickname !== p.species ? `${p.nickname}` : 'A Pokémon';
      return {
        key: `${event.seq}`,
        text: `${who === 'A Pokémon' ? 'Evolved into' : `${who} evolved into`} ${event.payload.toSpecies}`,
        species: event.payload.toSpecies,
        // neutral, not 'catch': the Catches timeline filter must mean actual
        // catches, and evolutions land under Misc
        tone: 'neutral',
      };
    }
    case 'pokemon_evolution_reverted': {
      const p = pokemon?.[event.payload.pokemonId];
      return {
        key: `${event.seq}`,
        text: p
          ? `${p.nickname !== p.species ? p.nickname : 'A Pokémon'} un-evolved (back to ${p.species})`
          : 'A Pokémon un-evolved',
        species: p?.species,
        tone: 'neutral',
      };
    }
    case 'milestone_cleared': {
      const milestone = ctx.dataset?.milestones.find((m) => m.id === event.payload.milestoneId);
      return {
        key: `${event.seq}`,
        text: `Cleared: ${milestone?.name ?? event.payload.milestoneId}`,
        trainerKey: milestone?.trainerSprite ?? trainerKeyFromMilestone(event.payload.milestoneId),
        tone: 'milestone',
      };
    }
    case 'next_boss_set': {
      const milestone = event.payload.milestoneId
        ? ctx.dataset?.milestones.find((m) => m.id === event.payload.milestoneId)
        : null;
      return {
        key: `${event.seq}`,
        text: event.payload.milestoneId
          ? `Next boss: ${milestone?.name ?? event.payload.milestoneId}`
          : 'Next boss: back to suggested order',
        trainerKey: milestone
          ? milestone.trainerSprite ?? trainerKeyFromMilestone(milestone.id)
          : undefined,
        tone: 'neutral',
      };
    }
    case 'trainer_battled': {
      const area = ctx.dataset?.areas.find((a) => a.id === event.payload.areaId);
      const t = area?.trainers?.[event.payload.trainerIndex];
      const label = t ? `${t.class ? `${t.class} ` : ''}${t.name}` : event.payload.name ?? 'a trainer';
      return {
        key: `${event.seq}`,
        text: `Defeated ${label}${area ? ` on ${area.name}` : ''}`,
        trainerKey: t?.class ? trainerKeyFromClass(t.class) : undefined,
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
