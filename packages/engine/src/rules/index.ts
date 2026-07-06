import type {
  Area,
  EncounterSlot,
  EngineContext,
  GameDataset,
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

  'alphas-count': {
    id: 'alphas-count',
    name: 'Alphas Count as Encounters',
    description:
      'Hard mode: guaranteed (fixed-spawn) Alpha Pokémon count as legal encounters — "first Pokémon counts even if it\'s an Alpha". Off (the community default), fixed Alphas are excluded from the encounter pool: they are massively over-leveled for when you first reach them.',
    category: 'encounter',
    appliesTo: ['pla', 'plza'],
    enforcement: 'enforced',
    defaultEnabled: false,
    defaultParams: {},
    hooks: ['filterEncounterPool'],
  },
  'dlc-content': {
    id: 'dlc-content',
    name: 'Playing the DLC',
    description:
      'Show DLC content in this run: expansion areas, boss fights and one-time legendaries/gifts (SwSh: Isle of Armor + Crown Tundra). Off = base-game run; DLC areas, milestones and specials are hidden and never gate the level cap.',
    category: 'core',
    appliesTo: ['swsh'],
    enforcement: 'enforced',
    defaultEnabled: false,
    defaultParams: {},
    hooks: ['filterEncounterPool', 'validateTeam'],
  },

  // ---- Per-game honor packs (docs/CHALLENGE-MODES.md; sourced community
  // conventions). Honor rules are displayed and acknowledged, never enforced.

  'pla-use-only-first-catch': {
    id: 'pla-use-only-first-catch',
    name: 'Use-Only First Catch',
    description:
      'PLA variant of first-encounter: keep catching Pokémon freely for Grit items and materials income, but only the first catch from each named location may be used on your team.',
    category: 'honor',
    appliesTo: ['pla'],
    enforcement: 'honor',
    defaultEnabled: true,
    defaultParams: {},
    hooks: [],
  },
  'pla-no-crafted-revives': {
    id: 'pla-no-crafted-revives',
    name: 'No Crafted or Bought Revives',
    description:
      'Revives and Max Revives may not be crafted or bought — unrestricted crafting trivializes deaths. Milestone revive tokens are the sanctioned second chance.',
    category: 'honor',
    appliesTo: ['pla'],
    enforcement: 'honor',
    defaultEnabled: true,
    defaultParams: {},
    hooks: [],
  },
  'pla-no-distortions': {
    id: 'pla-no-distortions',
    name: 'No Distortion Encounters',
    description:
      'Space-time distortion spawns are not legal encounters and may not be used on your team (repeatable high-value spawns; the community does not count them).',
    category: 'honor',
    appliesTo: ['pla'],
    enforcement: 'honor',
    defaultEnabled: true,
    defaultParams: {},
    hooks: [],
  },
  'pla-outbreak-shiny-clause': {
    id: 'pla-outbreak-shiny-clause',
    name: 'Outbreak Shinies Not Exempt',
    description:
      'Mass-outbreak shinies do not get the shiny-clause exemption — outbreaks are repeatable with boosted odds, so exempting them means never running out of Pokémon.',
    category: 'honor',
    appliesTo: ['pla'],
    enforcement: 'honor',
    defaultEnabled: true,
    defaultParams: {},
    hooks: [],
  },
  'pla-noble-two-attempts': {
    id: 'pla-noble-two-attempts',
    name: 'Noble Two-Attempt Clause',
    description:
      'Your first loss to a Noble is free — retreat and retry with no deaths counted. From the second attempt on, deaths are permanent.',
    category: 'honor',
    appliesTo: ['pla'],
    enforcement: 'honor',
    defaultEnabled: false,
    defaultParams: {},
    hooks: [],
  },

  'sv-no-raid-encounters': {
    id: 'sv-no-raid-encounters',
    name: 'No Raid Encounters or Rewards',
    description:
      'Tera raids are not legal encounters, and raid rewards (items, XP candy) are banned — raids are repeatable, high-BST fountains.',
    category: 'honor',
    appliesTo: ['sv'],
    enforcement: 'honor',
    defaultEnabled: true,
    defaultParams: {},
    hooks: [],
  },
  'sv-no-picnic-eggs': {
    id: 'sv-no-picnic-eggs',
    name: 'No Picnic Eggs',
    description:
      'Eggs from picnic breeding are not legal encounters — infinite breeding means never running out of Pokémon. Allowed only in egglocke variants.',
    category: 'honor',
    appliesTo: ['sv'],
    enforcement: 'honor',
    defaultEnabled: true,
    defaultParams: {},
    hooks: [],
  },
  'sv-symmetric-tera': {
    id: 'sv-symmetric-tera',
    name: 'Symmetric Terastallization',
    description:
      'Terastallize only in fights where the opponent does (gyms, Elite Four, rivals) — no free Tera in regular battles. Stricter variants (full ban, once per boss) go in house rules.',
    category: 'honor',
    appliesTo: ['sv'],
    enforcement: 'honor',
    defaultEnabled: false,
    defaultParams: {},
    hooks: [],
  },

  'za-symmetric-mega': {
    id: 'za-symmetric-mega',
    name: 'Symmetric Mega Evolution',
    description:
      'Mega Evolve only in fights where the opponent does — the Z-A analog of the SV symmetric-Tera clause (early community convention).',
    category: 'honor',
    appliesTo: ['plza'],
    enforcement: 'honor',
    defaultEnabled: false,
    defaultParams: {},
    hooks: [],
  },
  'za-rogue-caps': {
    id: 'za-rogue-caps',
    name: 'Rogue Battles Gate the Level Cap',
    description:
      'On: Rogue mega-boss milestones count for the level cap like promotion matches. Off: rogues become optional targets and the cap tracks promotion matches only (Nuzlocke University lists rogue caps as optional).',
    category: 'difficulty',
    appliesTo: ['plza'],
    enforcement: 'enforced',
    defaultEnabled: true,
    defaultParams: {},
    hooks: ['validateTeam'],
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
    // "no free Tera on trash fights" is the hardcore norm (docs/CHALLENGE-MODES.md);
    // guard on presence so the bump only lands where the rule applies (SV).
    if (rules['sv-symmetric-tera']) rules['sv-symmetric-tera'] = { enabled: true, params: {} };
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

  // Guaranteed Alphas (method 'alpha') are excluded unless the run opted into
  // the 'alphas-count' hard-mode toggle. ABSENT rule = included — runs started
  // before the rule existed keep the pools they already had (absent ≠ off).
  const alphas = rs['alphas-count'];
  if (alphas != null && !alphas.enabled) {
    pool = pool.filter((slot) => !slot.methods.includes('alpha'));
  }

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
 * Next uncleared battle milestone that gates the level cap.
 * Milestones with countsForLevelCap === false (e.g. rival battles) are tracked and
 * displayed like any other milestone, but never targeted by the level-cap rule.
 *
 * Open-order games (SV): the user can designate any uncleared gating milestone
 * as their next boss (`next_boss_set` event) and the cap keys off it. Once that
 * milestone clears — or if the id never matches a gating milestone — we fall
 * back to dataset order, so a stale choice can never wedge the cap.
 *
 * Z-A: the 'za-rogue-caps' rule, when present and switched OFF, drops
 * rogue-mega milestones from cap gating — the cap then tracks promotion
 * matches only. Absent (other games, older runs) or enabled = no change.
 */
export function nextBoss(state: RunState, ctx: EngineContext): Milestone | null {
  const rogueCaps = state.ruleset.rules['za-rogue-caps'];
  const roguesExcluded = rogueCaps != null && !rogueCaps.enabled;
  const gating = milestonesFor(ctx.dataset, state.version, state.ruleset).filter(
    (m) =>
      m.aceLevel !== null &&
      m.countsForLevelCap !== false &&
      !(roguesExcluded && m.type === 'rogue-mega') &&
      !state.milestonesCleared.includes(m.id),
  );
  if (state.nextBossId) {
    const chosen = gating.find((m) => m.id === state.nextBossId);
    if (chosen) return chosen;
  }
  return gating.sort((a, b) => a.order - b.order)[0] ?? null;
}

/** Whether the run shows DLC-gated content. Keyed off the 'dlc-content' rule:
 * enabled = show, disabled = base-game run. ABSENT = show — games without the
 * rule have no DLC content anyway, and runs started before the rule existed
 * keep seeing the DLC areas they could already use (absent ≠ off, same
 * semantics as za-rogue-caps). */
export function dlcEnabled(ruleset: Ruleset | undefined): boolean {
  return ruleset?.rules['dlc-content']?.enabled ?? true;
}

/** Milestones that apply to the given run version — a few are version-gated
 * (e.g. SV's Area Zero finale, the split Quaking Earth Titan). Absent
 * conditions.version = shown in every version. Use this wherever the milestone
 * list is displayed or counted so a run never shows the other version's bosses.
 * Pass the run's ruleset so DLC-gated milestones respect the 'dlc-content'
 * toggle; omitting it includes everything (legacy callers/tests). */
export function milestonesFor(dataset: GameDataset, version: string, ruleset?: Ruleset): Milestone[] {
  const withDlc = ruleset === undefined || dlcEnabled(ruleset);
  return dataset.milestones.filter(
    (m) =>
      (!m.conditions?.version || m.conditions.version.includes(version)) &&
      (withDlc || !m.conditions?.dlc),
  );
}

/** Areas that apply to the run — everything, minus `dlc:*`-tagged areas when
 * the 'dlc-content' rule is off. */
export function areasFor(dataset: GameDataset, ruleset?: Ruleset): Area[] {
  if (ruleset === undefined || dlcEnabled(ruleset)) return dataset.areas;
  return dataset.areas.filter((a) => !a.tags.some((t) => t.startsWith('dlc:')));
}

/** Whether an area is a dead end for the given version: it documents wild
 * encounters, but every one of them is locked to the OTHER version — so the
 * player can never resolve it and it should be hidden. An area with NO
 * documented encounters at all (a town, an item/trainer-only stop) is NOT a
 * dead end — those carry items/trainers/specials and must stay visible. */
export function isVersionDeadArea(area: Area, version: string): boolean {
  if (area.encounters.length === 0) return false;
  return !area.encounters.some((slot) => !slot.conditions?.version || slot.conditions.version.includes(version));
}

/** `areasFor`, additionally dropping areas whose only documented encounters
 * belong to the other game version (e.g. SwSh's Giant's Mirror — a single
 * Shield-locked Galarian Corsola — is hidden from Sword runs, and vice versa).
 * Areas already resolved keep their real encounters, so they never trip this. */
export function areasForVersion(dataset: GameDataset, version: string, ruleset?: Ruleset): Area[] {
  return areasFor(dataset, ruleset).filter((a) => !isVersionDeadArea(a, version));
}

/** Whether a special encounter is available for the given version — most
 * specials have no version lock and apply everywhere; a few (e.g. LGPE's
 * partner Pokémon: Pikachu on one version, Eevee on the other) are fixed by
 * which version you're playing, not a real in-game choice. Pass the run's
 * ruleset so DLC-gated specials respect the 'dlc-content' toggle. */
export function specialAppliesToVersion(
  special: SpecialEncounter,
  version: string,
  ruleset?: Ruleset,
): boolean {
  if (special.conditions?.dlc && ruleset !== undefined && !dlcEnabled(ruleset)) return false;
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
