import { describe, expect, it } from 'vitest';
import {
  RULES,
  buildRuleset,
  deriveState,
  filterEncounterPool,
  nextBoss,
  type EngineContext,
  type GameDataset,
  type RunEvent,
} from '../src/index.js';

// Per-game honor packs (backlog 26, docs/CHALLENGE-MODES.md): rule defs are
// data gated via appliesTo — presets include them only for their game, and
// honor rules never grow enforcement hooks.

const PACKS: Record<string, string[]> = {
  pla: [
    'pla-use-only-first-catch',
    'pla-no-crafted-revives',
    'pla-no-distortions',
    'pla-outbreak-shiny-clause',
    'pla-noble-two-attempts',
  ],
  sv: ['sv-no-raid-encounters', 'sv-no-picnic-eggs', 'sv-symmetric-tera'],
  plza: ['za-symmetric-mega', 'za-rogue-caps'],
};

describe('per-game honor-rule packs', () => {
  it('scopes each pack to its game via appliesTo', () => {
    for (const [gameId, ids] of Object.entries(PACKS)) {
      const rules = buildRuleset('standard', gameId).rules;
      for (const id of ids) expect(rules[id], `${id} missing for ${gameId}`).toBeTruthy();
      // never leaks into an unrelated game
      const bdsp = buildRuleset('standard', 'bdsp').rules;
      for (const id of ids) expect(bdsp[id], `${id} leaked into bdsp`).toBeUndefined();
    }
  });

  it('keeps honor rules hook-free (displayed, never enforced)', () => {
    for (const ids of Object.values(PACKS)) {
      for (const id of ids) {
        const def = RULES[id];
        if (def.enforcement === 'honor') {
          expect(def.hooks, `${id} must not have enforcement hooks`).toEqual([]);
        }
      }
    }
  });

  it('defaults match the community conventions (bans on, leniencies/clauses off)', () => {
    const pla = buildRuleset('standard', 'pla').rules;
    expect(pla['pla-use-only-first-catch'].enabled).toBe(true);
    expect(pla['pla-no-crafted-revives'].enabled).toBe(true);
    expect(pla['pla-no-distortions'].enabled).toBe(true);
    expect(pla['pla-outbreak-shiny-clause'].enabled).toBe(true);
    expect(pla['pla-noble-two-attempts'].enabled).toBe(false);
    const sv = buildRuleset('standard', 'sv').rules;
    expect(sv['sv-no-raid-encounters'].enabled).toBe(true);
    expect(sv['sv-no-picnic-eggs'].enabled).toBe(true);
    expect(sv['sv-symmetric-tera'].enabled).toBe(false);
    // hardcore turns symmetric Tera on (SV only — no leak elsewhere)
    expect(buildRuleset('hardcore', 'sv').rules['sv-symmetric-tera'].enabled).toBe(true);
    expect(buildRuleset('hardcore', 'pla').rules['sv-symmetric-tera']).toBeUndefined();
  });
});

// ---- za-rogue-caps: the one enforced toggle in the packs ----

const zaDataset: GameDataset = {
  schemaVersion: 1,
  gameId: 'plza',
  name: 'Legends: Z-A (synthetic)',
  versions: ['legends-za'],
  areas: [],
  specials: [],
  milestones: [
    { id: 'promo-1', name: 'Promotion Match Z', type: 'promotion', order: 1, aceLevel: 9 },
    { id: 'rogue-absol', name: 'Rogue Mega Absol', type: 'rogue-mega', order: 2, aceLevel: 30 },
    { id: 'promo-2', name: 'Promotion Match Y', type: 'promotion', order: 3, aceLevel: 15 },
  ],
  mechanics: { heldItems: false, wildBattles: true, setModeOption: false, raids: false, overworldAggro: true },
};
const ctx: EngineContext = { dataset: zaDataset, speciesToLine: {} };

let seq = 0;
const ev = (type: RunEvent['type'], payload: unknown): RunEvent =>
  ({ seq: ++seq, at: new Date(1700000000000 + seq * 60000).toISOString(), type, payload } as RunEvent);

describe('alphas-count toggle', () => {
  const plaDataset: GameDataset = {
    schemaVersion: 1,
    gameId: 'pla',
    name: 'Legends: Arceus (synthetic)',
    versions: ['legends-arceus'],
    areas: [
      {
        id: 'horseshoe-plains',
        name: 'Horseshoe Plains',
        unlockAfter: null,
        tags: ['zone:obsidian-fieldlands'],
        encounters: [
          { species: 'bidoof', methods: ['walk'] },
          { species: 'rapidash', methods: ['alpha'] },
        ],
      },
    ],
    specials: [],
    milestones: [{ id: 'noble-kleavor', name: 'Kleavor', type: 'noble', order: 1, aceLevel: 18 }],
    mechanics: { heldItems: false, wildBattles: true, setModeOption: false, raids: false, overworldAggro: true },
  };
  const plaCtx: EngineContext = { dataset: plaDataset, speciesToLine: {} };
  const area = plaDataset.areas[0];

  it('excludes guaranteed alphas by default and includes them in hard mode', () => {
    expect(buildRuleset('standard', 'pla').rules['alphas-count'].enabled).toBe(false);
    expect(buildRuleset('standard', 'bdsp').rules['alphas-count']).toBeUndefined();

    const off = deriveState(
      [ev('run_started', { gameId: 'pla', version: 'legends-arceus', ruleset: buildRuleset('standard', 'pla') })],
      plaCtx,
    );
    expect(filterEncounterPool(off, area, plaCtx).map((s) => s.species)).toEqual(['bidoof']);

    const hard = buildRuleset('standard', 'pla');
    hard.rules['alphas-count'] = { enabled: true, params: {} };
    const on = deriveState(
      [ev('run_started', { gameId: 'pla', version: 'legends-arceus', ruleset: hard })],
      plaCtx,
    );
    expect(filterEncounterPool(on, area, plaCtx).map((s) => s.species)).toEqual(['bidoof', 'rapidash']);
  });

  it('leaves runs without the rule untouched (absent ≠ off)', () => {
    const legacy = deriveState(
      [ev('run_started', { gameId: 'pla', version: 'legends-arceus', ruleset: { presetId: 'standard', rules: {}, houseRules: [] } })],
      plaCtx,
    );
    expect(filterEncounterPool(legacy, area, plaCtx).map((s) => s.species)).toEqual(['bidoof', 'rapidash']);
  });
});

describe('za-rogue-caps toggle', () => {
  const start = (preset: 'standard' | 'hardcore') =>
    ev('run_started', { gameId: 'plza', version: 'legends-za', ruleset: buildRuleset(preset, 'plza') });

  it('gates the cap with rogues by default (current behavior preserved)', () => {
    const state = deriveState([start('standard'), ev('milestone_cleared', { milestoneId: 'promo-1' })], ctx);
    expect(nextBoss(state, ctx)?.id).toBe('rogue-absol');
  });

  it('skips rogue-mega milestones for the cap when switched off', () => {
    // note: events are built in seq order — rule_changed must follow run_started
    const events = [
      start('standard'),
      ev('milestone_cleared', { milestoneId: 'promo-1' }),
      ev('rule_changed', {
        ruleId: 'za-rogue-caps',
        before: { enabled: true, params: {} },
        after: { enabled: false, params: {} },
      }),
    ];
    const state = deriveState(events, ctx);
    expect(nextBoss(state, ctx)?.id).toBe('promo-2');
  });

  it('leaves games without the rule untouched (rule absent ≠ rule off)', () => {
    // a ruleset that never contained za-rogue-caps (e.g. an older run)
    const bare = { presetId: 'standard', rules: {}, houseRules: [] };
    const state = deriveState(
      [ev('run_started', { gameId: 'plza', version: 'legends-za', ruleset: bare }), ev('milestone_cleared', { milestoneId: 'promo-1' })],
      ctx,
    );
    expect(nextBoss(state, ctx)?.id).toBe('rogue-absol');
  });
});

// Radical Red replaces the generic presets with its in-game difficulty tiers.
describe('Radical Red difficulty tiers (buildRuleset)', () => {
  it('always enforces the soft level cap — every RR mode has it, unlike other games', () => {
    for (const preset of ['rr-normal', 'rr-hardcore']) {
      const rs = buildRuleset(preset, 'radical-red');
      expect(rs.rules['level-cap']?.enabled, `${preset} caps`).toBe(true);
    }
    // a generic game's "standard" preset does NOT enable caps (proves RR is special)
    expect(buildRuleset('standard', 'sv').rules['level-cap']?.enabled).toBeFalsy();
  });

  it('Normal enables caps only; Hardcore adds Set + no-bag + Minimal Grinding', () => {
    const normal = buildRuleset('rr-normal', 'radical-red').rules;
    expect(normal['set-mode']?.enabled).toBeFalsy();
    expect(normal['no-items-in-battle']?.enabled).toBeFalsy();
    expect(normal['rr-min-grinding']?.enabled).toBeFalsy();

    const hard = buildRuleset('rr-hardcore', 'radical-red').rules;
    expect(hard['set-mode']?.enabled).toBe(true);
    expect(hard['no-items-in-battle']?.enabled).toBe(true);
    expect(hard['rr-min-grinding']?.enabled).toBe(true);
  });

  it("RR honor rules are gated to Radical Red and never enforced", () => {
    for (const id of ['rr-min-grinding', 'rr-restricted']) {
      expect(RULES[id].appliesTo).toEqual(['radical-red']);
      expect(RULES[id].enforcement).toBe('honor');
      expect(RULES[id].hooks).toEqual([]);
    }
    // not present for other games
    expect(buildRuleset('standard', 'bdsp').rules['rr-min-grinding']).toBeUndefined();
  });
});
