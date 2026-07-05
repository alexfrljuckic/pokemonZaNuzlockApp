import { describe, expect, it } from 'vitest';
import {
  areasFor,
  buildRuleset,
  deriveState,
  dlcEnabled,
  milestonesFor,
  nextBoss,
  specialAppliesToVersion,
  type EngineContext,
  type GameDataset,
  type RunEvent,
  type Ruleset,
} from '../src/index.js';

// 'dlc-content' rule (backlog 23): base-game runs hide DLC areas, milestones
// and specials; absent rule = show everything (legacy runs / other games).

const dataset: GameDataset = {
  schemaVersion: 1,
  gameId: 'swsh',
  name: 'Sword / Shield (synthetic)',
  versions: ['sword', 'shield'],
  areas: [
    { id: 'route-1', name: 'Route 1', unlockAfter: null, tags: ['route'], encounters: [] },
    { id: 'fields-of-honor', name: 'Fields of Honor', unlockAfter: null, tags: ['wild-zone', 'dlc:isle-of-armor'], encounters: [] },
    { id: 'giants-bed', name: "Giant's Bed", unlockAfter: null, tags: ['wild-zone', 'dlc:crown-tundra'], encounters: [] },
  ],
  specials: [
    { id: 'gift-toxel', type: 'gift', species: 'toxel', area: 'route-1' },
    { id: 'gift-kubfu', type: 'gift', species: 'kubfu', area: 'fields-of-honor', conditions: { dlc: true } },
    {
      id: 'static-articuno-galar',
      type: 'static',
      species: 'articuno-galar',
      area: 'giants-bed',
      conditions: { dlc: true },
    },
  ],
  milestones: [
    { id: 'gym-1-milo', name: 'Milo', type: 'gym', order: 10, aceLevel: 20 },
    { id: 'champion-leon', name: 'Leon', type: 'champion', order: 100, aceLevel: 65 },
    {
      id: 'dlc-mustard-final',
      name: 'Mustard (Final)',
      type: 'dojo',
      order: 200,
      aceLevel: 75,
      conditions: { dlc: true },
    },
    {
      id: 'dlc-klara-final',
      name: 'Klara (Final)',
      type: 'dojo',
      order: 190,
      aceLevel: 65,
      conditions: { dlc: true, version: ['sword'] },
    },
  ],
  mechanics: { heldItems: true, wildBattles: true, setModeOption: true, raids: true, overworldAggro: true },
};
const ctx: EngineContext = { dataset, speciesToLine: {} };

const rulesetWith = (on: boolean): Ruleset => {
  const rs = buildRuleset('standard', 'swsh');
  rs.rules['dlc-content'] = { enabled: on, params: {} };
  return rs;
};

let seq = 0;
const ev = (type: RunEvent['type'], payload: unknown): RunEvent =>
  ({ seq: ++seq, at: new Date(1700000000000 + seq * 60000).toISOString(), type, payload } as RunEvent);

describe('dlc-content rule', () => {
  it('ships in swsh rulesets (default off) and nowhere else', () => {
    expect(buildRuleset('standard', 'swsh').rules['dlc-content'].enabled).toBe(false);
    expect(buildRuleset('hardcore', 'swsh').rules['dlc-content'].enabled).toBe(false);
    expect(buildRuleset('standard', 'bdsp').rules['dlc-content']).toBeUndefined();
  });

  it('absent rule means everything shows (legacy runs, other games)', () => {
    expect(dlcEnabled(undefined)).toBe(true);
    expect(dlcEnabled({ presetId: 'standard', rules: {}, houseRules: [] })).toBe(true);
    expect(milestonesFor(dataset, 'sword').map((m) => m.id)).toContain('dlc-mustard-final');
    expect(areasFor(dataset).map((a) => a.id)).toContain('fields-of-honor');
  });

  it('filters milestones by dlc + version together', () => {
    const off = milestonesFor(dataset, 'sword', rulesetWith(false)).map((m) => m.id);
    expect(off).toEqual(['gym-1-milo', 'champion-leon']);
    const on = milestonesFor(dataset, 'sword', rulesetWith(true)).map((m) => m.id);
    expect(on).toContain('dlc-mustard-final');
    expect(on).toContain('dlc-klara-final');
    // Klara is Sword-only even with DLC on
    expect(milestonesFor(dataset, 'shield', rulesetWith(true)).map((m) => m.id)).not.toContain('dlc-klara-final');
  });

  it('filters dlc-tagged areas when off', () => {
    expect(areasFor(dataset, rulesetWith(false)).map((a) => a.id)).toEqual(['route-1']);
    expect(areasFor(dataset, rulesetWith(true)).map((a) => a.id)).toHaveLength(3);
  });

  it('filters dlc specials when off, keeps base ones', () => {
    const off = rulesetWith(false);
    expect(specialAppliesToVersion(dataset.specials[0], 'sword', off)).toBe(true); // toxel
    expect(specialAppliesToVersion(dataset.specials[1], 'sword', off)).toBe(false); // kubfu
    expect(specialAppliesToVersion(dataset.specials[1], 'sword', rulesetWith(true))).toBe(true);
    expect(specialAppliesToVersion(dataset.specials[1], 'sword')).toBe(true); // no ruleset = legacy
  });

  it('never targets a DLC boss for the level cap in a base-game run', () => {
    const events = [
      ev('run_started', { gameId: 'swsh', version: 'sword', ruleset: rulesetWith(false) }),
      ev('milestone_cleared', { milestoneId: 'gym-1-milo' }),
      ev('milestone_cleared', { milestoneId: 'champion-leon' }),
    ];
    const state = deriveState(events, ctx);
    expect(nextBoss(state, ctx)).toBeNull(); // not Klara/Mustard

    // flipping DLC on mid-run (audited rule_changed) brings the DLC ladder in
    const flipped = [
      ...events,
      ev('rule_changed', {
        ruleId: 'dlc-content',
        before: { enabled: false, params: {} },
        after: { enabled: true, params: {} },
      }),
    ];
    expect(nextBoss(deriveState(flipped, ctx), ctx)?.id).toBe('dlc-klara-final');
  });
});
