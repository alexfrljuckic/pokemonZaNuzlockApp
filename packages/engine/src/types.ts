// ---------- Game dataset (authored JSON, validated by packages/datasets) ----------

export interface GameDataset {
  schemaVersion: number;
  gameId: string;
  name: string;
  versions: string[];
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
}

export interface Milestone {
  id: string;
  name: string;
  type: string;               // "gym" | "noble" | "promotion" | "titan" | "elite-four" | ...
  order: number;
  aceLevel: number | null;    // highest level in the boss fight; null if not a battle
  grants?: { reviveTokens?: number };
  /** Full team, informational only — display in UI. The level-cap rule reads aceLevel, never this. */
  roster?: MilestoneRosterMember[];
}

export interface MilestoneRosterMember {
  species: string;
  level: number;
  moves?: string[];
  ability?: string;
  heldItem?: string;
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
  | { seq: number; at: string; type: 'encounter_resolved'; payload: { areaId: string; species: string; outcome: 'caught' | 'failed' | 'skipped'; pokemonId?: string; nickname?: string; level?: number } }
  | { seq: number; at: string; type: 'level_up'; payload: { pokemonId: string; level: number } }
  | { seq: number; at: string; type: 'moved'; payload: { pokemonId: string; to: 'party' | 'box' } }
  | { seq: number; at: string; type: 'faint'; payload: { pokemonId: string; cause?: string; killer?: string; milestoneId?: string } }
  | { seq: number; at: string; type: 'revive'; payload: { pokemonId: string } }
  | { seq: number; at: string; type: 'milestone_cleared'; payload: { milestoneId: string } }
  | { seq: number; at: string; type: 'rule_changed'; payload: { ruleId: string; before: RuleConfig | null; after: RuleConfig; note?: string } }
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
  status: 'active' | 'victory' | 'wiped-continuing' | 'abandoned';
  pokemon: Record<string, PokemonInstance>;
  /** areaId -> outcome of that area's one legal encounter */
  encounterOutcomes: Record<string, 'caught' | 'failed' | 'skipped'>;
  milestonesCleared: string[];
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
