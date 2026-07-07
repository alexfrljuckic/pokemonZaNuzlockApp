// ---------- Game dataset (authored JSON, validated by packages/datasets) ----------

export interface GameDataset {
  schemaVersion: number;
  gameId: string;
  name: string;
  versions: string[];
  // PokeAPI version-group slugs whose move-learn data applies to this game
  // (include DLC groups, e.g. sword-shield + the-isle-of-armor). Absent when
  // PokeAPI has no move data for the game (Legends Z-A) — consumers fall
  // back to the all-games union movepool.
  pokeapiVersionGroups?: string[];
  areas: Area[];
  specials: SpecialEncounter[];
  milestones: Milestone[];
  mechanics: GameMechanics;
}

export interface Area {
  id: string;
  name: string;
  unlockAfter: string | null; // milestone id, or null if available from start
  tags: string[];             // e.g. "route", "wild-zone", "dlc:teal-mask"
  encounters: EncounterSlot[];
  /** Documented trainer battles in this area (display-only route intel;
   * sourced, never invented — see the dataset PR rules). */
  trainers?: AreaTrainer[];
  /** Fixed overworld item pickups (display-only route intel; sourced —
   * shop stock, renewables and quest rewards excluded). */
  items?: AreaItem[];
}

export interface AreaItem {
  name: string;
  /** Hidden pickup (Dowsing Machine / Itemfinder spot). */
  hidden?: boolean;
  /** Purchasable in this area's shops rather than a ground pickup. */
  shop?: boolean;
  /** Only when a single pickup yields more than one. */
  quantity?: number;
  /** Field-move (HM) requirements needed to reach this pickup — lowercase-
   * hyphenated slugs. Sourced, never invented; omit when freely reachable. */
  access?: FieldMove[];
  /** Optional short free-text spot within the area (research-backed only). */
  locationHint?: string;
  conditions?: {
    version?: string[];
  };
}

/** HM / field-move slugs an item pickup may require. Kept in sync with the
 * `access` enum in game.schema.json. */
export type FieldMove =
  | 'surf'
  | 'cut'
  | 'strength'
  | 'rock-smash'
  | 'waterfall'
  | 'rock-climb'
  | 'defog'
  | 'fly'
  | 'flash'
  | 'whirlpool'
  | 'dive';

export interface AreaTrainer {
  name: string;
  /** Trainer class, e.g. "Youngster", "Ace Trainer". */
  class?: string;
  team: {
    species: string;
    level: number;
    moves?: string[];
    ability?: string;
    heldItem?: string;
  }[];
  /** Version gating, when a trainer exists in only one version. */
  conditions?: {
    version?: string[];
  };
}

export interface EncounterSlot {
  species: string;            // PokeAPI species slug, e.g. "mr-mime"
  methods: string[];          // "walk" | "surf" | "fish" | game-specific
  rate?: number;              // percent or weight, per dataset convention
  conditions?: {
    version?: string[];
    time?: string[];
    weather?: string[];
    [k: string]: string[] | undefined;
  };
}

export interface SpecialEncounter {
  id: string;
  type: 'gift' | 'static' | 'trade' | 'fossil' | 'egg';
  species: string;
  area: string;
  // version-locked specials (e.g. LGPE's partner Pokémon: Pikachu on that
  // version, Eevee on the other — not a real in-game choice, just fixed by
  // which version you started). Absent = available regardless of version.
  // dlc: true = only shown when the run's 'dlc-content' rule is on.
  conditions?: {
    version?: string[];
    dlc?: boolean;
  };
}

export interface Milestone {
  id: string;
  name: string;
  type: string;               // "gym" | "noble" | "promotion" | "titan" | "elite-four" | ...
  order: number;
  aceLevel: number | null;    // highest level in the boss fight; null if not a battle
  /** Whether this milestone's aceLevel gates the enforced level cap. Absent/true = gates it; false = tracked/displayed but excluded (e.g. rival battles). */
  countsForLevelCap?: boolean;
  grants?: { reviveTokens?: number };
  /** Full team, informational only — display in UI. The level-cap rule reads aceLevel, never this. */
  roster?: MilestoneRosterMember[];
  /** Per-player-starter roster variants (rival battles), keyed by the player's
   * chosen starter species slug. UI picks the matching variant, else `roster`. */
  rosterByStarter?: Record<string, MilestoneRosterMember[]>;
  /** Per-difficulty-tier roster variants (Radical Red Normal/Hardcore), keyed
   * by a difficulty slug (normal/hardcore). UI picks the variant matching the
   * run's tier (mapped from presetId), else falls back to rosterByStarter/roster.
   * Mainline games omit this and are unaffected. */
  rosterByDifficulty?: Record<string, MilestoneRosterMember[]>;
  /** Version gating for a milestone present in only one version (e.g. SV's
   * Area Zero finale or the version-split Quaking Earth Titan). Absent = shown
   * regardless of version. dlc: true = only shown when the run's
   * 'dlc-content' rule is on. */
  conditions?: {
    version?: string[];
    dlc?: boolean;
  };
  /** Showdown trainer-sprite key when the default guess (id's last segment)
   * is wrong (e.g. rival-hop-1 → "hop"). Presentation data owned by datasets. */
  trainerSprite?: string;
  /** When the boss IS a Pokémon (Z-A rogue-mega bosses, legendary encounters)
   * rather than a trainer — render this species as a Pokémon sprite instead of
   * a trainer sprite. e.g. "absol-mega". */
  species?: string;
}

export interface MilestoneRosterMember {
  species: string;
  level: number;
  moves?: string[];
  ability?: string;
  heldItem?: string;
  /** Terastal type the ace Terastallizes into (Scarlet/Violet). Data-only. */
  teraType?: string;
}

export interface GameMechanics {
  heldItems: boolean;
  wildBattles: boolean;
  setModeOption: boolean;
  raids: boolean;
  overworldAggro: boolean;
}

// ---------- Rules ----------

export type RuleHook =
  | 'filterEncounterPool'
  | 'validateTeam'
  | 'onFaint'
  | 'onCatch'
  | 'onMilestone';

export interface RuleDef {
  id: string;
  name: string;
  description: string;
  category: 'core' | 'encounter' | 'difficulty' | 'death' | 'honor';
  /** 'all', or a list of gameIds the rule applies to */
  appliesTo: 'all' | string[];
  /** Rules the engine can't verify are tracked, displayed, and acknowledged — never enforced */
  enforcement: 'enforced' | 'honor';
  defaultEnabled: boolean;
  defaultParams: Record<string, unknown>;
  hooks: RuleHook[];
}

export interface RuleConfig {
  enabled: boolean;
  params: Record<string, unknown>;
}

export interface Ruleset {
  presetId: string; // 'standard' | 'hardcore' | 'casual' | 'custom'
  rules: Record<string, RuleConfig>;
  houseRules: string[]; // free-text honor rules, displayed verbatim
}

// ---------- Events (append-only; state is derived) ----------

export type RunEvent =
  | { seq: number; at: string; type: 'run_started'; payload: { gameId: string; version: string; ruleset: Ruleset } }
  | { seq: number; at: string; type: 'encounter_resolved'; payload: { areaId: string; species: string; outcome: 'caught' | 'failed' | 'skipped'; pokemonId?: string; nickname?: string; level?: number; shiny?: boolean } }
  | { seq: number; at: string; type: 'encounter_reset'; payload: { areaId: string } }
  | { seq: number; at: string; type: 'special_claimed'; payload: { specialId: string; species: string; pokemonId: string; nickname?: string; level?: number; shiny?: boolean } }
  | { seq: number; at: string; type: 'special_reset'; payload: { specialId: string } }
  | { seq: number; at: string; type: 'level_up'; payload: { pokemonId: string; level: number } }
  | { seq: number; at: string; type: 'moved'; payload: { pokemonId: string; to: 'party' | 'box' } }
  | { seq: number; at: string; type: 'pokemon_updated'; payload: { pokemonId: string; nickname?: string; level?: number; heldItem?: string | null; moves?: string[]; nature?: string | null; ability?: string | null } }
  | { seq: number; at: string; type: 'pokemon_evolved'; payload: { pokemonId: string; toSpecies: string; level?: number } }
  | { seq: number; at: string; type: 'pokemon_evolution_reverted'; payload: { pokemonId: string } }
  | { seq: number; at: string; type: 'pokemon_imported'; payload: { pokemonId: string; species: string; nickname?: string; level?: number; fromRunId: string; retiredSpecies?: string } }
  | { seq: number; at: string; type: 'faint'; payload: { pokemonId: string; cause?: string; killer?: string; milestoneId?: string } }
  | { seq: number; at: string; type: 'revive'; payload: { pokemonId: string } }
  | { seq: number; at: string; type: 'milestone_cleared'; payload: { milestoneId: string } }
  | { seq: number; at: string; type: 'next_boss_set'; payload: { milestoneId: string | null } }
  | { seq: number; at: string; type: 'trainer_battled'; payload: { areaId: string; trainerIndex: number; name?: string } }
  | { seq: number; at: string; type: 'trainer_reset'; payload: { areaId: string; trainerIndex: number } }
  | { seq: number; at: string; type: 'item_picked'; payload: { areaId: string; itemIndex: number; name?: string } }
  | { seq: number; at: string; type: 'item_reset'; payload: { areaId: string; itemIndex: number } }
  | { seq: number; at: string; type: 'rule_changed'; payload: { ruleId: string; before: RuleConfig | null; after: RuleConfig; note?: string } }
  | { seq: number; at: string; type: 'house_rules_changed'; payload: { before: string[]; after: string[]; note?: string } }
  | { seq: number; at: string; type: 'wipe_decision'; payload: { decision: 'reset' | 'continue' } }
  | { seq: number; at: string; type: 'run_ended'; payload: { result: 'victory' | 'abandoned' } }
  | { seq: number; at: string; type: 'note'; payload: { text: string } };

// ---------- Derived state ----------

export interface PokemonInstance {
  id: string;
  species: string;
  nickname: string;
  level: number;
  status: 'party' | 'box' | 'dead';
  origin: { areaId?: string; specialId?: string; imported?: boolean };
  death?: { at: string; cause?: string; killer?: string; milestoneId?: string };
  heldItem?: string;
  moves?: string[];
  nature?: string;
  ability?: string;
  shiny?: boolean;
  /** Stack of pre-evolution species (oldest first), maintained by the
   * pokemon_evolved / pokemon_evolution_reverted fold — powers un-evolve.
   * Species only: un-evolving corrects a wrong pick, it never rolls the
   * level back (the mon's actual level didn't change in-game). */
  preEvolutions?: string[];
}

export interface RuleChangeRecord {
  at: string;
  ruleId: string;
  before: RuleConfig | null;
  after: RuleConfig;
  note?: string;
}

export interface RunState {
  gameId: string;
  version: string;
  ruleset: Ruleset;
  status: 'active' | 'victory' | 'wiped-continuing' | 'wiped' | 'abandoned';
  pokemon: Record<string, PokemonInstance>;
  /** areaId -> outcome of that area's one legal encounter */
  encounterOutcomes: Record<string, 'caught' | 'failed' | 'skipped'>;
  milestonesCleared: string[];
  /** User-designated next boss (open-order games like SV) — the level cap keys
   * off this milestone while it stays uncleared; null = follow dataset order. */
  nextBossId: string | null;
  /** `${areaId}#${trainerIndex}` keys of route trainers marked battled */
  trainersBattled: string[];
  /** `${areaId}#${itemIndex}` keys of route items marked picked up */
  itemsPicked: string[];
  reviveTokens: number;
  /** set once the whole team has fainted; never unset except by 'reset' decision (a new run) */
  wipes: { at: string }[];
  ruleChanges: RuleChangeRecord[];
}

// ---------- Context the app injects (data the engine can't know) ----------

export interface EngineContext {
  dataset: GameDataset;
  /** species slug -> evolution-line id, for the dupes clause. Built from PokeAPI evolution chains. */
  speciesToLine: Record<string, string>;
}

export interface Violation {
  ruleId: string;
  message: string;
}
