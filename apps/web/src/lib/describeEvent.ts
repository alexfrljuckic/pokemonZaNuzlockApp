import type { EngineContext, PokemonInstance, RunEvent } from '@nuzlocke/engine';
import { trainerKeyFromMilestone, trainerSpriteKeyFor } from './sprites';

export interface DescribedEvent {
  key: string;
  text: string;
  species?: string;
  /** Showdown trainer-sprite key, for trainer/boss events. */
  trainerKey?: string;
  tone: 'catch' | 'faint' | 'milestone' | 'trainer' | 'wipe' | 'neutral';
}

/** "Nickname the Species", or just the species when it's unnamed or the
 * nickname is the species. */
const displayName = (nickname: string | undefined, species: string): string =>
  nickname && nickname !== species ? `${nickname} the ${species}` : species;

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
      const name = displayName(event.payload.nickname, event.payload.species);
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
      const name = displayName(event.payload.nickname, event.payload.species);
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
      const who = p ? displayName(p.nickname, p.species) : 'A Pokémon';
      return {
        key: `${event.seq}`,
        text: `${who} fainted${milestone ? ` to ${milestone.name}` : event.payload.killer ? ` to ${event.payload.killer}` : ''}`,
        species: p?.species,
        tone: 'faint',
      };
    }
    case 'pokemon_imported': {
      const name = displayName(event.payload.nickname, event.payload.species);
      return {
        key: `${event.seq}`,
        text: event.payload.retiredSpecies
          ? `${name} joined the campaign (legacy pick for the retired ${event.payload.retiredSpecies})`
          : `${name} graduated in from a previous run`,
        species: event.payload.species,
        tone: 'catch',
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
    // pokemon_evolution_reverted: intentionally NOT described — an un-evolve
    // is a correction, not history. visibleEvents() below nets the reverted
    // evolution out too, so the pair leaves no trace in any history view.
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
        trainerKey: t ? trainerSpriteKeyFor(t) : undefined,
        // route trainers are NOT bosses — their own tone keeps them out of the
        // "Bosses" filter (which means milestone_cleared) and into "Trainers".
        tone: 'trainer',
      };
    }
    case 'house_rules_changed': {
      const n = event.payload.after.length;
      return {
        key: `${event.seq}`,
        text: `House rules updated (${n} rule${n === 1 ? '' : 's'})`,
        tone: 'neutral',
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

/** History prefilter: an un-evolve CANCELS the evolution it reverts — the
 * pair vanishes from every history view (timeline, summary strip, feed),
 * as if it never happened. The event LOG keeps both (append-only is a core
 * architecture invariant and sync depends on it); this is purely display.
 * Pairing is per-Pokémon, latest-unmatched-first, in seq order. */
export function visibleEvents(events: RunEvent[]): RunEvent[] {
  const sorted = [...events].sort((a, b) => a.seq - b.seq);
  const dropped = new Set<number>(); // seq of hidden events
  const openEvolves = new Map<string, number[]>(); // pokemonId -> seq stack
  for (const ev of sorted) {
    if (ev.type === 'pokemon_evolved') {
      const stack = openEvolves.get(ev.payload.pokemonId) ?? [];
      stack.push(ev.seq);
      openEvolves.set(ev.payload.pokemonId, stack);
    } else if (ev.type === 'pokemon_evolution_reverted') {
      dropped.add(ev.seq); // the revert itself never shows
      const undone = openEvolves.get(ev.payload.pokemonId)?.pop();
      if (undone != null) dropped.add(undone);
    }
  }
  return events.filter((ev) => !dropped.has(ev.seq));
}
