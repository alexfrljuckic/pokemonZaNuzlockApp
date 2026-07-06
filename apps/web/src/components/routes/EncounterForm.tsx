import { useState } from 'react';
import type { EncounterSlot } from '@nuzlocke/engine';
import { typesFor } from '../../lib/speciesData';
import { CatchFields, clampLevel } from '../CatchFields';
import { SpriteImg } from '../SpriteImg';
import { TypeBadges } from '../TypeBadge';

export type Outcome = 'caught' | 'failed' | 'skipped';

/** Unique species in pool order, with their catch method(s) and best rate. */
function uniqueSlots(pool: EncounterSlot[]): { species: string; methods: string; rate?: number }[] {
  const byId = new Map<string, { methods: string[]; rate?: number }>();
  for (const slot of pool) {
    const cur = byId.get(slot.species) ?? { methods: [], rate: undefined };
    for (const m of slot.methods) if (!cur.methods.includes(m)) cur.methods.push(m);
    if (slot.rate != null) cur.rate = Math.max(cur.rate ?? 0, slot.rate);
    byId.set(slot.species, cur);
  }
  return [...byId].map(([species, v]) => ({ species, methods: v.methods.join('/'), rate: v.rate }));
}

export function EncounterForm({
  pool,
  onResolve,
}: {
  pool: EncounterSlot[];
  onResolve: (species: string, outcome: Outcome, nickname?: string, level?: number, shiny?: boolean) => void;
}) {
  const slots = uniqueSlots(pool);
  const [species, setSpecies] = useState(slots[0]?.species ?? '');
  const [nickname, setNickname] = useState('');
  const [level, setLevel] = useState('5');
  const [shiny, setShiny] = useState(false);

  return (
    <div className="encounter-form">
      <p className="encounter-hint">Tap what you encountered:</p>
      <div className="encounter-grid">
        {slots.map((slot) => (
          <button
            key={slot.species}
            type="button"
            className={`encounter-slot${slot.species === species ? ' selected' : ''}`}
            onClick={() => setSpecies(slot.species)}
            title={`${slot.species} (${slot.methods})`}
          >
            <SpriteImg species={slot.species} size={72} shiny={shiny} />
            <span className="encounter-slot-name">{slot.species}</span>
            <TypeBadges types={typesFor(slot.species)} />
            <span className="encounter-slot-method muted">
              {slot.methods}
              {slot.rate != null ? ` · ${slot.rate}%` : ''}
            </span>
          </button>
        ))}
      </div>
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
    </div>
  );
}
