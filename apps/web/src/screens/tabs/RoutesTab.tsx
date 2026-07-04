import { useState } from 'react';
import { filterEncounterPool, type Area, type EncounterSlot, type EngineContext, type RunState } from '@nuzlocke/engine';
import { appendEvent } from '../../lib/db';
import { hasMapNode } from '../../lib/sinnohMap';
import { RouteMap } from '../../components/RouteMap';

type Outcome = 'caught' | 'failed' | 'skipped';

function isUnlocked(area: Area, state: RunState) {
  return !area.unlockAfter || state.milestonesCleared.includes(area.unlockAfter);
}

function EncounterForm({
  pool,
  onResolve,
}: {
  pool: EncounterSlot[];
  onResolve: (species: string, outcome: Outcome, nickname?: string, level?: number) => void;
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

/** Flat expandable list of areas — the fallback for games without a map, and
 * the supplemental view for map-less areas (e.g. Grand Underground). */
function AreaList({
  areas,
  state,
  ctx,
  openAreaId,
  setOpenAreaId,
  onResolve,
}: {
  areas: Area[];
  state: RunState;
  ctx: EngineContext;
  openAreaId: string | null;
  setOpenAreaId: (id: string | null) => void;
  onResolve: (area: Area, species: string, outcome: Outcome, nickname?: string, level?: number) => void;
}) {
  return (
    <>
      {areas.map((area) => {
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
                <EncounterForm pool={pool} onResolve={(sp, out, nick, lvl) => onResolve(area, sp, out, nick, lvl)} />
              ) : (
                <p className="muted">No legal encounters left here under the active ruleset.</p>
              ))}
          </div>
        );
      })}
    </>
  );
}

export function RoutesTab({
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

  async function resolve(area: Area, species: string, outcome: Outcome, nickname?: string, level?: number) {
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

  const areas = ctx.dataset.areas;
  const hasMap = ctx.dataset.gameId === 'bdsp';

  if (!hasMap) {
    return (
      <section>
        <h2>Routes</h2>
        <AreaList
          areas={areas}
          state={state}
          ctx={ctx}
          openAreaId={openAreaId}
          setOpenAreaId={setOpenAreaId}
          onResolve={resolve}
        />
      </section>
    );
  }

  const selected = openAreaId ? areas.find((a) => a.id === openAreaId) ?? null : null;
  const selectedPool = selected ? filterEncounterPool(state, selected, ctx) : [];
  const offMapAreas = areas.filter((a) => !hasMapNode(a.id));

  return (
    <section>
      <h2>Routes</h2>

      <RouteMap areas={areas} state={state} version={state.version} onSelect={(id) => setOpenAreaId(id)} />

      {selected && (
        <div className="route-resolve-panel">
          <div className="route-resolve-head">
            <strong>{selected.name}</strong>
            <button className="secondary route-resolve-close" onClick={() => setOpenAreaId(null)} aria-label="Close">
              ✕
            </button>
          </div>
          {selectedPool.length > 0 ? (
            <EncounterForm pool={selectedPool} onResolve={(sp, out, nick, lvl) => resolve(selected, sp, out, nick, lvl)} />
          ) : (
            <p className="muted">No legal encounters left here under the active ruleset.</p>
          )}
        </div>
      )}

      {offMapAreas.length > 0 && (
        <div className="route-offmap">
          <h3 className="route-offmap-title">Grand Underground &amp; other zones</h3>
          <AreaList
            areas={offMapAreas}
            state={state}
            ctx={ctx}
            openAreaId={openAreaId}
            setOpenAreaId={setOpenAreaId}
            onResolve={resolve}
          />
        </div>
      )}
    </section>
  );
}
