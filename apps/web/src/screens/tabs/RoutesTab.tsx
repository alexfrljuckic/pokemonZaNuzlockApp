import { useState } from 'react';
import { filterEncounterPool, type Area, type EncounterSlot, type EngineContext, type RunState } from '@nuzlocke/engine';
import { appendEvent } from '../../lib/db';
import { hasMapNode } from '../../lib/sinnohMap';
import { RouteMap } from '../../components/RouteMap';
import { SpriteImg } from '../../components/SpriteImg';

type Outcome = 'caught' | 'failed' | 'skipped';

function isUnlocked(area: Area, state: RunState) {
  return !area.unlockAfter || state.milestonesCleared.includes(area.unlockAfter);
}

/** Unique species in pool order, with their catch method(s). */
function uniqueSlots(pool: EncounterSlot[]): { species: string; methods: string }[] {
  const byId = new Map<string, string[]>();
  for (const slot of pool) {
    const cur = byId.get(slot.species) ?? [];
    for (const m of slot.methods) if (!cur.includes(m)) cur.push(m);
    byId.set(slot.species, cur);
  }
  return [...byId].map(([species, methods]) => ({ species, methods: methods.join('/') }));
}

function EncounterForm({
  pool,
  onResolve,
}: {
  pool: EncounterSlot[];
  onResolve: (species: string, outcome: Outcome, nickname?: string, level?: number) => void;
}) {
  const slots = uniqueSlots(pool);
  const [species, setSpecies] = useState(slots[0]?.species ?? '');
  const [nickname, setNickname] = useState('');
  const [level, setLevel] = useState('5');

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
            <SpriteImg species={slot.species} size={72} />
            <span className="encounter-slot-name">{slot.species}</span>
            <span className="encounter-slot-method muted">{slot.methods}</span>
          </button>
        ))}
      </div>
      <div className="encounter-fields">
        <label>
          Nickname
          <input type="text" value={nickname} onChange={(e) => setNickname(e.target.value)} placeholder={species} />
        </label>
        <label>
          Level
          <input type="text" inputMode="numeric" value={level} onChange={(e) => setLevel(e.target.value)} />
        </label>
      </div>
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
  onReset,
}: {
  areas: Area[];
  state: RunState;
  ctx: EngineContext;
  openAreaId: string | null;
  setOpenAreaId: (id: string | null) => void;
  onResolve: (area: Area, species: string, outcome: Outcome, nickname?: string, level?: number) => void;
  onReset: (area: Area) => void;
}) {
  return (
    <>
      {areas.map((area) => {
        const unlocked = isUnlocked(area, state);
        const outcome = state.encounterOutcomes[area.id];
        const pool = unlocked && !outcome ? filterEncounterPool(state, area, ctx) : [];
        // clickable to open the encounter picker (unresolved) or the reset (resolved)
        const clickable = unlocked;

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
              {!outcome && unlocked && <span className="muted">{pool.length} available</span>}
            </div>
            {openAreaId === area.id &&
              (outcome ? (
                <div className="route-resolved-body">
                  <p className="muted">
                    Resolved ({outcome}). Resetting clears the outcome and removes any Pokémon caught here.
                  </p>
                  <button className="secondary route-reset-btn" onClick={() => onReset(area)}>
                    Reset route
                  </button>
                </div>
              ) : pool.length > 0 ? (
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

  async function resetRoute(area: Area) {
    await appendEvent(runId, { type: 'encounter_reset', payload: { areaId: area.id } } as never);
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
          onReset={resetRoute}
        />
      </section>
    );
  }

  const selected = openAreaId ? areas.find((a) => a.id === openAreaId) ?? null : null;
  const selectedOutcome = selected ? state.encounterOutcomes[selected.id] : undefined;
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
          {selectedOutcome ? (
            <div className="route-resolved-body">
              <p>
                This route is resolved — outcome:{' '}
                <span className={`outcome-${selectedOutcome}`}>{selectedOutcome}</span>.
              </p>
              <p className="muted">
                Resetting clears the outcome and removes any Pokémon caught here from your team, box and graveyard.
              </p>
              <button className="secondary route-reset-btn" onClick={() => resetRoute(selected)}>
                Reset route
              </button>
            </div>
          ) : selectedPool.length > 0 ? (
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
            onReset={resetRoute}
          />
        </div>
      )}
    </section>
  );
}
