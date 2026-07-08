import { useState } from 'react';
import type { ClassifiedEncounter, EncounterSlot, RunState } from '@nuzlocke/engine';
import { typesFor } from '../../lib/speciesData';
import { tierBadge, tierHint } from '../../lib/undergroundTiers';
import { CatchFields, clampLevel } from '../CatchFields';
import { SpriteImg } from '../SpriteImg';
import { TypeBadges } from '../TypeBadge';

export type Outcome = 'caught' | 'failed' | 'skipped';

/** The active dupes-clause scope for a run ('evolution-line' | 'species'),
 * used to word the dimmed-card reason. undefined when the rule is off. */
export function dupesScope(state: RunState): string | undefined {
  const dupes = state.ruleset.rules['dupes-clause'];
  return dupes?.enabled ? String(dupes.params.scope ?? 'evolution-line') : undefined;
}

/** The four display buckets, rendered in this order; empty buckets are omitted.
 * A single species can appear in more than one bucket at its own per-bucket
 * rate (Psyduck: 2% walking + 30% surfing) — that's the whole point. */
type GroupKey = 'walking' | 'surfing' | 'fishing' | 'other';
const GROUP_ORDER: GroupKey[] = ['walking', 'surfing', 'fishing', 'other'];
const GROUP_LABEL: Record<GroupKey, string> = {
  walking: 'Walking',
  surfing: 'Surfing',
  fishing: 'Fishing',
  other: 'Other',
};

/** Map a raw dataset method slug to its display bucket. Anything not explicitly
 * walk/surf/rod (swarm, poke-radar, honey-tree, static, alpha, gift,
 * rock-smash, headbutt, …) lands in "Other". */
function groupForMethod(method: string): GroupKey {
  if (method === 'walk') return 'walking';
  if (method === 'surf') return 'surfing';
  if (method === 'old-rod' || method === 'good-rod' || method === 'super-rod') return 'fishing';
  return 'other';
}

/** One species within one group: keeps the per-sub-method rates so nothing is
 * merged away (e.g. Fishing → good-rod 55% · super-rod 40%). `unavailable` is
 * set (dupes reason) only when the species is excluded — dimmed but shown. */
type Period = 'morning' | 'day' | 'night';
const PERIODS: Period[] = ['morning', 'day', 'night'];
const PERIOD_LABEL: Record<Period, string> = { morning: 'Morning', day: 'Day', night: 'Night' };

type GroupEntry = {
  species: string;
  /** sub-method → its own rate, in first-seen order, within this group only */
  subMethods: { method: string; rate?: number }[];
  unavailable?: string;
  /** Grand Underground progression tier (BDSP hideaways), display-only. */
  tier?: number;
  /** time-of-day → spawn rate, for species that only appear (or appear at a
   * different rate) at certain times. A period absent here = doesn't spawn then. */
  byPeriod: Partial<Record<Period, number | undefined>>;
  /** true when any slot carried a time-of-day condition (else appears anytime). */
  hasTime: boolean;
};

type Group = { key: GroupKey; label: string; entries: GroupEntry[] };

/** Time-of-day summary for a species card. null when it spawns anytime at one
 * rate (no time relevance). Otherwise a clear label — emphasising "only" when
 * the species is time-exclusive (can't be caught at other times). */
export function timeChip(
  byPeriod: Partial<Record<Period, number | undefined>>,
  hasTime: boolean,
): { text: string; restricted: boolean } | null {
  if (!hasTime) return null;
  const present = PERIODS.filter((p) => byPeriod[p] != null);
  if (present.length === 0) return null;
  const rates = new Set(present.map((p) => byPeriod[p]));
  // appears every period at one rate → not actually time-relevant
  if (present.length === 3 && rates.size === 1) return null;
  const restricted = present.length < 3;
  // group periods that share a rate, e.g. Morning+Night both 30%
  const byRate = new Map<number | undefined, Period[]>();
  for (const p of present) {
    const r = byPeriod[p];
    if (!byRate.has(r)) byRate.set(r, []);
    byRate.get(r)!.push(p);
  }
  const seg = ([rate, ps]: [number | undefined, Period[]]) =>
    `${ps.map((p) => PERIOD_LABEL[p]).join('/')}${rate != null ? ` ${rate}%` : ''}`;
  const segs = [...byRate.entries()].map(seg).join(' · ');
  return { text: restricted ? `Only ${segs}` : segs, restricted };
}

/** Human-readable reason a species can't be caught, for the dimmed card's
 * label/tooltip/aria. Species-scope and evolution-line-scope read differently. */
function reasonText(reason: ClassifiedEncounter['reason'], scope: string | undefined): string {
  if (reason === 'dupes-clause') {
    return scope === 'species'
      ? 'Already caught this species — dupes clause'
      : 'Already have this evolution line — dupes clause';
  }
  return 'Unavailable';
}

/** Render a group's sub-method breakdown as compact text.
 *  - single walk/surf slot: just the rate ("30%")
 *  - fishing / multi sub-method: label each ("good-rod 55% · super-rod 40%") */
function subMethodLabel(key: GroupKey, subs: GroupEntry['subMethods']): string {
  const withRate = (m: string, r?: number) => (r != null ? `${m} ${r}%` : m);
  if (key === 'fishing' || key === 'other' || subs.length > 1) {
    return subs.map((s) => withRate(s.method, s.rate)).join(' · ');
  }
  // walking / surfing single slot — the group header already names the method,
  // so just show the rate.
  const only = subs[0];
  return only?.rate != null ? `${only.rate}%` : only?.method ?? '';
}

/** Bucket the classified pool into display groups. A species can land in
 * several groups; within a group its sub-methods keep their own rates. A
 * species is `unavailable` in a group only if EVERY slot feeding that group is
 * excluded — matching the per-species rule that any catchable slot keeps it
 * selectable. */
function groupEntries(pool: ClassifiedEncounter[], scope: string | undefined): Group[] {
  const acc = new Map<GroupKey, Map<string, GroupEntry & { available: boolean }>>();
  for (const { slot, available, reason } of pool) {
    for (const method of slot.methods) {
      const key = groupForMethod(method);
      let bucket = acc.get(key);
      if (!bucket) {
        bucket = new Map();
        acc.set(key, bucket);
      }
      const cur =
        bucket.get(slot.species) ??
        ({ species: slot.species, subMethods: [], available: false, unavailable: undefined, tier: slot.tier, byPeriod: {}, hasTime: false } as GroupEntry & {
          available: boolean;
        });
      if (!cur.subMethods.some((s) => s.method === method)) {
        cur.subMethods.push({ method, rate: slot.rate });
      }
      // time-of-day: a slot with conditions.time spawns only in those periods;
      // no condition = spawns any time (fills all periods at this rate).
      const times = (slot.conditions?.time as Period[] | undefined) ?? PERIODS;
      if (slot.conditions?.time?.length) cur.hasTime = true;
      for (const p of times) if (cur.byPeriod[p] == null) cur.byPeriod[p] = slot.rate;
      if (available) cur.available = true;
      else if (cur.unavailable === undefined) cur.unavailable = reasonText(reason, scope);
      bucket.set(slot.species, cur);
    }
  }
  return GROUP_ORDER.filter((key) => acc.has(key)).map((key) => ({
    key,
    label: GROUP_LABEL[key],
    entries: [...acc.get(key)!.values()].map(({ species, subMethods, available, unavailable, tier, byPeriod, hasTime }) => ({
      species,
      subMethods,
      unavailable: available ? undefined : unavailable,
      tier,
      byPeriod,
      hasTime,
    })),
  }));
}

export function EncounterForm({
  pool,
  scope,
  gameId,
  onResolve,
  onSkip,
}: {
  /** Classified base pool: available species plus dupes-dimmed ones. */
  pool: ClassifiedEncounter[];
  /** dupes-clause scope ('evolution-line' | 'species') for reason wording. */
  scope?: string;
  /** the run's game — routes type lookups through per-game overrides (Radical
   * Red retypes some species). Optional; falls back to the global dex. */
  gameId?: string;
  onResolve: (species: string, outcome: Outcome, nickname?: string, level?: number, shiny?: boolean) => void;
  /** Shown as a "Skip route" affordance when every species is dimmed. */
  onSkip?: () => void;
}) {
  const groups = groupEntries(pool, scope);
  // First selectable species across groups, in group order.
  const firstAvailable =
    groups.flatMap((g) => g.entries).find((e) => !e.unavailable)?.species ?? '';
  const allDimmed = groups.length > 0 && !firstAvailable;
  const [species, setSpecies] = useState(firstAvailable);
  const [nickname, setNickname] = useState('');
  const [level, setLevel] = useState('5');
  const [shiny, setShiny] = useState(false);

  return (
    <div className="encounter-form">
      <p className="encounter-hint">Tap what you encountered:</p>
      {groups.map((group) => (
        <div className="encounter-group" key={group.key}>
          <span className="encounter-group-label muted">{group.label}</span>
          <div className="encounter-grid">
            {group.entries.map((entry) => {
              const disabled = Boolean(entry.unavailable);
              const rateLabel = subMethodLabel(group.key, entry.subMethods);
              const time = timeChip(entry.byPeriod, entry.hasTime);
              const selected = entry.species === species;
              const tierLabel = tierBadge(entry.tier);
              return (
                <button
                  // key is group-scoped so a species in two groups gets two cards
                  key={`${group.key}:${entry.species}`}
                  type="button"
                  disabled={disabled}
                  aria-disabled={disabled}
                  aria-label={
                    disabled
                      ? `${entry.species} — ${entry.unavailable}`
                      : `${entry.species} (${group.label})${time ? ` — ${time.restricted ? 'only ' : ''}${time.text.replace(/^Only /, '')}` : ''}`
                  }
                  className={`encounter-slot${selected ? ' selected' : ''}${disabled ? ' encounter-slot-unavailable' : ''}`}
                  onClick={disabled ? undefined : () => setSpecies(entry.species)}
                  title={disabled ? `${entry.species} — ${entry.unavailable}` : `${entry.species} (${group.label}${rateLabel ? ` · ${rateLabel}` : ''}${time ? ` · ${time.text}` : ''})`}
                >
                  <SpriteImg species={entry.species} size={72} shiny={shiny} />
                  <span className="encounter-slot-name">{entry.species}</span>
                  <TypeBadges types={typesFor(entry.species, gameId)} />
                  {tierLabel && (
                    <span className="encounter-slot-tier" title={tierHint(entry.tier) ?? undefined}>
                      {tierLabel}
                    </span>
                  )}
                  {disabled ? (
                    <span className="encounter-slot-unavailable-tag muted">{entry.unavailable}</span>
                  ) : time ? (
                    // time-varying / time-exclusive: the chip carries the per-period
                    // rates, so it replaces the plain rate line
                    <span className={`encounter-slot-time${time.restricted ? ' encounter-slot-time-only' : ''}`}>
                      {time.text}
                    </span>
                  ) : (
                    rateLabel && <span className="encounter-slot-method muted">{rateLabel}</span>
                  )}
                </button>
              );
            })}
          </div>
        </div>
      ))}
      {allDimmed ? (
        <div className="encounter-all-dimmed">
          <p className="muted">
            Every species that lives here is already part of your run — the dupes clause leaves nothing
            new to catch.
          </p>
          {onSkip && (
            <button className="secondary" onClick={onSkip}>
              Skip route
            </button>
          )}
        </div>
      ) : (
        <>
          <CatchFields
            species={species}
            nickname={nickname}
            onNickname={setNickname}
            level={level}
            onLevel={setLevel}
            shiny={shiny}
            onShiny={setShiny}
            className="encounter-fields"
          />
          <div className="encounter-actions">
            <button onClick={() => onResolve(species, 'caught', nickname || species, clampLevel(level), shiny)}>
              Caught
            </button>
            <button className="secondary" onClick={() => onResolve(species, 'failed')}>
              Failed
            </button>
            <button className="secondary" onClick={() => onResolve(species, 'skipped')}>
              Skipped
            </button>
          </div>
        </>
      )}
    </div>
  );
}

/** Legacy helper retained for any caller that still passes a plain slot pool.
 * Prefer the classified pool + EncounterForm above. */
export function slotsToClassified(pool: EncounterSlot[]): ClassifiedEncounter[] {
  return pool.map((slot) => ({ slot, available: true }));
}
