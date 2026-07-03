import { useState } from 'react';
import { filterEncounterPool, type Area, type EncounterSlot, type EngineContext, type RunState } from '@nuzlocke/engine';
import { appendEvent } from '../../lib/db';

function isUnlocked(area: Area, state: RunState) {
  return !area.unlockAfter || state.milestonesCleared.includes(area.unlockAfter);
}

function EncounterForm({
  pool,
  onResolve,
}: {
  pool: EncounterSlot[];
  onResolve: (species: string, outcome: 'caught' | 'failed' | 'skipped', nickname?: string, level?: number) => void;
}) {
  const [species, setSpecies] = useState(pool[0]?.species ?? '');
  const [nickname, setNickname] = useState('');
  const [level, setLevel] = useState('5');

  return (
    <div className="encounter-form">
      <label>Species</label>
      <select value={species} onChange={(e) => setSpecies(e.target.value)}>
        {pool.map((slot, i) => (
          <option key={`${slot.species}-${i}`} value={slot.species}>
            {slot.species} ({slot.methods.join('/')})
          </option>
        ))}
      </select>
      <label>Nickname</label>
      <input type="text" value={nickname} onChange={(e) => setNickname(e.target.value)} placeholder={species} />
      <label>Level</label>
      <input type="text" inputMode="numeric" value={level} onChange={(e) => setLevel(e.target.value)} />
      <div className="encounter-actions">
        <button onClick={() => onResolve(species, 'caught', nickname || species, Number(level) || 1)}>Caught</button>
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

export function AreasTab({
  runId,
  state,
  ctx,
  onChange,
}: {
  runId: string;
  state: RunState;
  ctx: EngineContext;
  onChange: () => Promise<void>;
}) {
  const [openAreaId, setOpenAreaId] = useState<string | null>(null);

  async function resolve(area: Area, species: string, outcome: 'caught' | 'failed' | 'skipped', nickname?: string, level?: number) {
    await appendEvent(runId, {
      type: 'encounter_resolved',
      payload: {
        areaId: area.id,
        species,
        outcome,
        pokemonId: outcome === 'caught' ? crypto.randomUUID() : undefined,
        nickname,
        level,
      },
    });
    setOpenAreaId(null);
    await onChange();
  }

  return (
    <section>
      <h2>Areas</h2>
      {ctx.dataset.areas.map((area) => {
        const unlocked = isUnlocked(area, state);
        const outcome = state.encounterOutcomes[area.id];
        const pool = unlocked && !outcome ? filterEncounterPool(state, area, ctx) : [];
        const clickable = unlocked && !outcome;

        return (
          <div key={area.id} className="area-row">
            <div
              className="area-row-header"
              onClick={() => clickable && setOpenAreaId(openAreaId === area.id ? null : area.id)}
              style={{ cursor: clickable ? 'pointer' : 'default' }}
            >
              <span>{area.name}</span>
              {!unlocked && <span className="muted">locked</span>}
              {outcome && <span className={`outcome-${outcome}`}>{outcome}</span>}
              {clickable && <span className="muted">{pool.length} available</span>}
            </div>
            {openAreaId === area.id &&
              (pool.length > 0 ? (
                <EncounterForm pool={pool} onResolve={(species, out, nick, lvl) => resolve(area, species, out, nick, lvl)} />
              ) : (
                <p className="muted">No legal encounters left here under the active ruleset.</p>
              ))}
          </div>
        );
      })}
    </section>
  );
}
