import type { EngineContext, RunEvent, RunState } from './types.js';

/**
 * Derive run state by folding the append-only event log.
 * Pure function: same events + same dataset => same state. This is what makes
 * undo, sync-merge, timelines, and stats all "free".
 */
export function deriveState(events: RunEvent[], ctx: EngineContext): RunState {
  const state: RunState = {
    gameId: ctx.dataset.gameId,
    version: '',
    ruleset: { presetId: 'standard', rules: {}, houseRules: [] },
    status: 'active',
    pokemon: {},
    encounterOutcomes: {},
    milestonesCleared: [],
    nextBossId: null,
    trainersBattled: [],
    itemsPicked: [],
    reviveTokens: 0,
    wipes: [],
    ruleChanges: [],
  };

  const sorted = [...events].sort((a, b) => a.seq - b.seq);

  for (const ev of sorted) {
    switch (ev.type) {
      case 'run_started': {
        state.version = ev.payload.version;
        state.ruleset = structuredClone(ev.payload.ruleset);
        break;
      }
      case 'encounter_resolved': {
        state.encounterOutcomes[ev.payload.areaId] = ev.payload.outcome;
        if (ev.payload.outcome === 'caught' && ev.payload.pokemonId) {
          state.pokemon[ev.payload.pokemonId] = {
            id: ev.payload.pokemonId,
            species: ev.payload.species,
            nickname: ev.payload.nickname ?? ev.payload.species,
            level: ev.payload.level ?? 1,
            status: 'party',
            origin: { areaId: ev.payload.areaId },
            ...(ev.payload.shiny ? { shiny: true } : {}),
          };
        }
        break;
      }
      case 'encounter_reset': {
        // Undo a route's encounter: clear its outcome (making it selectable
        // again) and cascade-remove any Pokémon it produced — from party, box
        // or graveyard. Downstream events referencing a removed id no-op, since
        // every handler guards on the Pokémon still existing.
        delete state.encounterOutcomes[ev.payload.areaId];
        for (const [id, p] of Object.entries(state.pokemon)) {
          if (p.origin?.areaId === ev.payload.areaId) delete state.pokemon[id];
        }
        break;
      }
      case 'special_claimed': {
        // A gift/starter/fossil/static is claimed → creates a Pokémon tagged
        // with its specialId. A special counts as "claimed" iff a Pokémon with
        // that origin.specialId exists (derive from state, no separate field).
        state.pokemon[ev.payload.pokemonId] = {
          id: ev.payload.pokemonId,
          species: ev.payload.species,
          nickname: ev.payload.nickname ?? ev.payload.species,
          level: ev.payload.level ?? 5,
          status: 'party',
          origin: { specialId: ev.payload.specialId },
          ...(ev.payload.shiny ? { shiny: true } : {}),
        };
        break;
      }
      case 'special_reset': {
        // Undo a claimed special — remove the Pokémon it produced.
        for (const [id, p] of Object.entries(state.pokemon)) {
          if (p.origin?.specialId === ev.payload.specialId) delete state.pokemon[id];
        }
        break;
      }
      case 'level_up': {
        const p = state.pokemon[ev.payload.pokemonId];
        if (p) p.level = ev.payload.level;
        break;
      }
      case 'moved': {
        const p = state.pokemon[ev.payload.pokemonId];
        if (p && p.status !== 'dead') p.status = ev.payload.to;
        break;
      }
      case 'pokemon_updated': {
        const p = state.pokemon[ev.payload.pokemonId];
        if (p) {
          if (ev.payload.nickname !== undefined) p.nickname = ev.payload.nickname;
          if (ev.payload.level !== undefined) p.level = ev.payload.level;
          // null clears an optional field; undefined leaves it untouched
          if (ev.payload.heldItem !== undefined) p.heldItem = ev.payload.heldItem ?? undefined;
          if (ev.payload.moves !== undefined) p.moves = ev.payload.moves;
          if (ev.payload.nature !== undefined) p.nature = ev.payload.nature ?? undefined;
        }
        break;
      }
      case 'pokemon_evolved': {
        const p = state.pokemon[ev.payload.pokemonId];
        if (p) {
          // remember what we were, so un-evolve can restore the species
          p.preEvolutions = [...(p.preEvolutions ?? []), p.species];
          // a default nickname (== the species slug) follows the evolution;
          // a real nickname stays put
          if (p.nickname === p.species) p.nickname = ev.payload.toSpecies;
          p.species = ev.payload.toSpecies;
          // evolving at the requirement level bumps the mon to it (UI sends
          // the max of current level and the evolution's minLevel)
          if (ev.payload.level != null) p.level = ev.payload.level;
        }
        break;
      }
      case 'pokemon_evolution_reverted': {
        // Un-evolve (misclick / wrong branch): pop the latest pre-evolution
        // species; no-op when there's nothing to revert. The LEVEL stays —
        // un-evolving corrects the species pick, the mon's actual level in
        // the game never went down.
        const p = state.pokemon[ev.payload.pokemonId];
        const prev = p?.preEvolutions?.pop();
        if (p && prev) {
          if (p.nickname === p.species) p.nickname = prev;
          p.species = prev;
          if (p.preEvolutions!.length === 0) delete p.preEvolutions;
        }
        break;
      }
      case 'faint': {
        const p = state.pokemon[ev.payload.pokemonId];
        if (p) {
          p.status = 'dead';
          p.death = { at: ev.at, cause: ev.payload.cause, killer: ev.payload.killer, milestoneId: ev.payload.milestoneId };
        }
        // Wipe detection: no living pokemon left at all.
        const anyAlive = Object.values(state.pokemon).some((q) => q.status !== 'dead');
        if (!anyAlive && Object.keys(state.pokemon).length > 0) {
          state.wipes.push({ at: ev.at });
        }
        break;
      }
      case 'revive': {
        const p = state.pokemon[ev.payload.pokemonId];
        if (p && p.status === 'dead' && state.reviveTokens > 0) {
          p.status = 'box';
          delete p.death;
          state.reviveTokens -= 1;
        }
        break;
      }
      case 'milestone_cleared': {
        if (!state.milestonesCleared.includes(ev.payload.milestoneId)) {
          state.milestonesCleared.push(ev.payload.milestoneId);
          const m = ctx.dataset.milestones.find((x) => x.id === ev.payload.milestoneId);
          if (m?.grants?.reviveTokens) state.reviveTokens += m.grants.reviveTokens;
        }
        break;
      }
      case 'next_boss_set': {
        state.nextBossId = ev.payload.milestoneId;
        break;
      }
      case 'trainer_battled': {
        const key = `${ev.payload.areaId}#${ev.payload.trainerIndex}`;
        if (!state.trainersBattled.includes(key)) state.trainersBattled.push(key);
        break;
      }
      case 'trainer_reset': {
        const key = `${ev.payload.areaId}#${ev.payload.trainerIndex}`;
        state.trainersBattled = state.trainersBattled.filter((k) => k !== key);
        break;
      }
      case 'item_picked': {
        const key = `${ev.payload.areaId}#${ev.payload.itemIndex}`;
        if (!state.itemsPicked.includes(key)) state.itemsPicked.push(key);
        break;
      }
      case 'item_reset': {
        const key = `${ev.payload.areaId}#${ev.payload.itemIndex}`;
        state.itemsPicked = state.itemsPicked.filter((k) => k !== key);
        break;
      }
      case 'rule_changed': {
        state.ruleset.rules[ev.payload.ruleId] = structuredClone(ev.payload.after);
        state.ruleChanges.push({
          at: ev.at,
          ruleId: ev.payload.ruleId,
          before: ev.payload.before,
          after: ev.payload.after,
          note: ev.payload.note,
        });
        break;
      }
      case 'wipe_decision': {
        // 'reset' is handled by the app starting a fresh run; 'continue' flags this one honestly.
        if (ev.payload.decision === 'continue') state.status = 'wiped-continuing';
        break;
      }
      case 'run_ended': {
        state.status = ev.payload.result === 'victory' ? 'victory' : 'abandoned';
        break;
      }
      case 'note':
        break;
    }
  }

  return state;
}
