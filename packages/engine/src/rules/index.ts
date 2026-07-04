import type {
  Area,
  EncounterSlot,
  EngineContext,
  Milestone,
  RuleDef,
  Ruleset,
  RunState,
  SpecialEncounter,
  Violation,
} from '../types.js';

// ---------- Rule definitions (data). UI renders these; engine interprets them. ----------

export const RULES: Record<string, RuleDef> = {
  'first-encounter': {
    id: 'first-encounter',
    name: 'First Encounter Only',
    description: 'You may only attempt to catch the first wild Pokémon encountered in each area.',
    category: 'core',
    appliesTo: 'all',
    enforcement: 'enforced',
    defaultEnabled: true,
    defaultParams: {},
    hooks: ['filterEncounterPool'],
  },
  'dupes-clause': {
    id: 'dupes-clause',
    name: 'Dupes Clause',
    description: 'Skip encounters whose species (or evolution line) you already own.',
    category: 'encounter',
    appliesTo: 'all',
    enforcement: 'enforced',
    defaultEnabled: true,
    defaultParams: { scope: 'evolution-line' }, // or 'species'
    hooks: ['filterEncounterPool'],
  },
  'level-cap': {
    id: 'level-cap',
    name: 'Level Cap',
    description: "Party Pokémon may not exceed the next boss's ace level (plus optional offset).",
    category: 'difficulty',
    appliesTo: 'all',
    enforcement: 'enforced',
    defaultEnabled: false,
    defaultParams: { mode: 'ace', offset: 0 }, // mode: 'ace' | 'off'
    hooks: ['validateTeam'],
  },
  'revive-tokens': {
    id: 'revive-tokens',
    name: 'Revive Tokens',
    description: 'Milestones grant tokens that can revive a fallen Pokémon to the box.',
    category: 'death',
    appliesTo: ['plza'], // conditionally applied; other games can opt in via custom preset
    enforcement: 'enforced',
    defaultEnabled: true,
    defaultParams: {},
    hooks: ['onMilestone', 'onFaint'],
  },
  'no-items-in-battle': {
    id: 'no-items-in-battle',
    name: 'No Items in Battle',
    description: 'No bag items during battle (held items OK). Honor rule — the app cannot see your bag.',
    category: 'honor',
    appliesTo: 'all',
    enforcement: 'honor',
    defaultEnabled: false,
    defaultParams: {},
    hooks: [],
  },
  'set-mode': {
    id: 'set-mode',
    name: 'Set Mode',
    description: 'Battle style set to "Set". Honor rule, shown in shared views.',
    category: 'honor',
    appliesTo: 'all',
    enforcement: 'honor',
    defaultEnabled: false,
    defaultParams: {},
    hooks: [],
  },
  'shiny-clause': {
    id: 'shiny-clause',
    name: 'Shiny Clause',
    description:
      'A shiny wild Pokémon may always be caught and kept, even if another rule (dupes, first-encounter) would skip it. Mark shinies on the encounter screen.',
    category: 'honor',
    appliesTo: 'all',
    enforcement: 'honor',
    defaultEnabled: true,
    defaultParams: {},
    hooks: [],
  },
};

// ---------- Presets ----------

export function buildRuleset(presetId: 'standard' | 'hardcore' | 'casual', gameId: string): Ruleset {
  const rules: Ruleset['rules'] = {};
  for (const def of Object.values(RULES)) {
    const applies = def.appliesTo === 'all' || def.appliesTo.includes(gameId);
    if (!applies) continue;
    rules[def.id] = { enabled: def.defaultEnabled, params: { ...def.defaultParams } };
  }
  if (presetId === 'hardcore') {
    rules['level-cap'] = { enabled: true, params: { mode: 'ace', offset: 0 } };
    rules['no-items-in-battle'] = { enabled: true, params: {} };
    rules['set-mode'] = { enabled: true, params: {} };
  }
  return { presetId, rules, houseRules: [] };
}

// ---------- Enforced hooks ----------

function ownedLines(state: RunState, ctx: EngineContext): Set<string> {
  const lines = new Set<string>();
  for (const p of Object.values(state.pokemon)) {
    lines.add(ctx.speciesToLine[p.species] ?? p.species);
  }
  return lines;
}

function ownedSpecies(state: RunState): Set<string> {
  return new Set(Object.values(state.pokemon).map((p) => p.species));
}

/**
 * The legal encounter pool for an area under the active ruleset.
 * Returns [] if the area's encounter has already been used (first-encounter rule).
 */
export function filterEncounterPool(state: RunState, area: Area, ctx: EngineContext): EncounterSlot[] {
  const rs = state.ruleset.rules;

  if (rs['first-encounter']?.enabled && state.encounterOutcomes[area.id]) {
    return [];
  }

  let pool = area.encounters.filter(
    (slot) => !slot.conditions?.version || slot.conditions.version.includes(state.version),
  );

  const dupes = rs['dupes-clause'];
  if (dupes?.enabled) {
    if (dupes.params.scope === 'evolution-line') {
      const lines = ownedLines(state, ctx);
      pool = pool.filter((slot) => !lines.has(ctx.speciesToLine[slot.species] ?? slot.species));
    } else {
      const species = ownedSpecies(state);
      pool = pool.filter((slot) => !species.has(slot.species));
    }
  }

  return pool;
}

/**
 * Next uncleared battle milestone that gates the level cap, by order.
 * Milestones with countsForLevelCap === false (e.g. rival battles) are tracked and
 * displayed like any other milestone, but never targeted by the level-cap rule.
 */
export function nextBoss(state: RunState, ctx: EngineContext): Milestone | null {
  return (
    ctx.dataset.milestones
      .filter(
        (m) =>
          m.aceLevel !== null &&
          m.countsForLevelCap !== false &&
          !state.milestonesCleared.includes(m.id),
      )
      .sort((a, b) => a.order - b.order)[0] ?? null
  );
}

/** Whether a special encounter is available for the given version — most
 * specials have no version lock and apply everywhere; a few (e.g. LGPE's
 * partner Pokémon: Pikachu on one version, Eevee on the other) are fixed by
 * which version you're playing, not a real in-game choice. */
export function specialAppliesToVersion(special: SpecialEncounter, version: string): boolean {
  return !special.conditions?.version || special.conditions.version.includes(version);
}

/** The player's chosen starter species (from a claimed `starter-*` special), or null. */
export function chosenStarter(state: RunState): string | null {
  const mon = Object.values(state.pokemon).find((p) => p.origin?.specialId?.startsWith('starter-'));
  return mon?.species ?? null;
}

/** A milestone's effective roster: the per-starter variant matching the chosen
 * starter when present, else the default `roster`. */
export function milestoneRoster(m: Milestone, starter: string | null): Milestone['roster'] {
  if (starter && m.rosterByStarter?.[starter]) return m.rosterByStarter[starter];
  return m.roster;
}

/** Level-cap and future team validators. Empty array = team is legal. */
export function validateTeam(state: RunState, ctx: EngineContext): Violation[] {
  const violations: Violation[] = [];
  const cap = state.ruleset.rules['level-cap'];
  if (cap?.enabled && cap.params.mode !== 'off') {
    const boss = nextBoss(state, ctx);
    if (boss?.aceLevel != null) {
      const limit = boss.aceLevel + Number(cap.params.offset ?? 0);
      for (const p of Object.values(state.pokemon)) {
        if (p.status === 'party' && p.level > limit) {
          violations.push({
            ruleId: 'level-cap',
            message: `${p.nickname} (Lv ${p.level}) exceeds the cap of ${limit} for ${boss.name}.`,
          });
        }
      }
    }
  }
  return violations;
}

/** True when the derived state shows a full wipe with no decision recorded yet. */
export function pendingWipeDecision(state: RunState): boolean {
  return state.wipes.length > 0 && state.status === 'active';
}
