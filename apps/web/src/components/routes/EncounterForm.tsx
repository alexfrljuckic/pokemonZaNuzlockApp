import { useState } from 'react';
import type { ClassifiedEncounter, EncounterSlot, RunState } from '@nuzlocke/engine';
import { typesFor } from '../../lib/speciesData';
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

/** A unique species entry for the grid: its catch method(s), best rate, and —
 * when the dupes clause has made it uncatchable — an `unavailable` reason. */
type SpeciesEntry = { species: string; methods: string; rate?: number; unavailable?: string };

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

/** Collapse the classified pool to unique species (in pool order), merging catch
 * methods and keeping the best rate. A species is `unavailable` only if EVERY
 * slot for it is excluded — if any slot is still catchable it stays selectable. */
function uniqueEntries(pool: ClassifiedEncounter[], scope: string | undefined): SpeciesEntry[] {
  const byId = new Map<string, { methods: string[]; rate?: number; available: boolean; reason?: string }>();
  for (const { slot, available, reason } of pool) {
    const cur = byId.get(slot.species) ?? { methods: [], rate: undefined, available: false, reason: undefined };
    for (const m of slot.methods) if (!cur.methods.includes(m)) cur.methods.push(m);
    if (slot.rate != null) cur.rate = Math.max(cur.rate ?? 0, slot.rate);
    if (available) cur.available = true;
    else if (cur.reason === undefined) cur.reason = reasonText(reason, scope);
    byId.set(slot.species, cur);
  }
  return [...byId].map(([species, v]) => ({
    species,
    methods: v.methods.join('/'),
    rate: v.rate,
    unavailable: v.available ? undefined : v.reason,
  }));
}

export function EncounterForm({
  pool,
  scope,
  onResolve,
  onSkip,
}: {
  /** Classified base pool: available species plus dupes-dimmed ones. */
  pool: ClassifiedEncounter[];
  /** dupes-clause scope ('evolution-line' | 'species') for reason wording. */
  scope?: string;
  onResolve: (species: string, outcome: Outcome, nickname?: string, level?: number, shiny?: boolean) => void;
  /** Shown as a "Skip route" affordance when every species is dimmed. */
  onSkip?: () => void;
}) {
  const entries = uniqueEntries(pool, scope);
  const firstAvailable = entries.find((e) => !e.unavailable)?.species ?? '';
  const allDimmed = entries.length > 0 && !firstAvailable;
  const [species, setSpecies] = useState(firstAvailable);
  const [nickname, setNickname] = useState('');
  const [level, setLevel] = useState('5');
  const [shiny, setShiny] = useState(false);

  return (
    <div className="encounter-form">
      <p className="encounter-hint">Tap what you encountered:</p>
      <div className="encounter-grid">
        {entries.map((slot) => {
          const disabled = Boolean(slot.unavailable);
          return (
            <button
              key={slot.species}
              type="button"
              disabled={disabled}
              aria-disabled={disabled}
              aria-label={disabled ? `${slot.species} — ${slot.unavailable}` : slot.species}
              className={`encounter-slot${slot.species === species ? ' selected' : ''}${disabled ? ' encounter-slot-unavailable' : ''}`}
              onClick={disabled ? undefined : () => setSpecies(slot.species)}
              title={disabled ? `${slot.species} — ${slot.unavailable}` : `${slot.species} (${slot.methods})`}
            >
              <SpriteImg species={slot.species} size={72} shiny={shiny} />
              <span className="encounter-slot-name">{slot.species}</span>
              <TypeBadges types={typesFor(slot.species)} />
              {disabled ? (
                <span className="encounter-slot-unavailable-tag muted">{slot.unavailable}</span>
              ) : (
                <span className="encounter-slot-method muted">
                  {slot.methods}
                  {slot.rate != null ? ` · ${slot.rate}%` : ''}
                </span>
              )}
            </button>
          );
        })}
      </div>
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
