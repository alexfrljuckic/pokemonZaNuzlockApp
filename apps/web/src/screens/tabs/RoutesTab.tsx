import { useState } from 'react';
import { filterEncounterPool, type Area, type EncounterSlot, type EngineContext, type RunState } from '@nuzlocke/engine';
import { appendEvent } from '../../lib/db';
import { hasMapNode } from '../../lib/sinnohMap';
import { RouteMap } from '../../components/RouteMap';
import { SpriteImg } from '../../components/SpriteImg';
import { TypeBadges } from '../../components/TypeBadge';
import { SpecialsSection } from '../../components/SpecialsSection';
import { typesFor } from '../../lib/speciesData';

type Outcome = 'caught' | 'failed' | 'skipped';

// Routes are always interactable — unlock gating is intentionally not enforced
// in the UI (players track ahead of story order freely). unlockAfter stays in
// the data for reference/other features.
function isUnlocked(_area: Area, _state: RunState) {
  return true;
}

/** The Pokémon (if any) currently owned that were caught in this area. */
function caughtHere(areaId: string, state: RunState) {
  return Object.values(state.pokemon).filter((p) => p.origin?.areaId === areaId);
}

function CaughtHere({ areaId, state }: { areaId: string; state: RunState }) {
  const mons = caughtHere(areaId, state);
  if (mons.length === 0) return null;
  return (
    <div className="route-caught-here">
      {mons.map((p) => (
        <div key={p.id} className="route-caught-mon">
          <SpriteImg species={p.species} size={48} shiny={p.shiny} className={p.status === 'dead' ? 'sprite-dead' : ''} />
          <div className="poke-detail-summary">
            <strong>
              {p.nickname}
              {p.shiny && <span className="shiny-star" title="Shiny"> ✦</span>}
            </strong>
            <span className="muted">
              {p.species} · Lv {p.level} · {p.status === 'dead' ? 'fainted' : p.status}
              {p.heldItem ? ` · ${p.heldItem}` : ''}
            </span>
          </div>
        </div>
      ))}
    </div>
  );
}

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

function EncounterForm({
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
      <div className="encounter-fields">
        <label>
          Nickname
          <input type="text" value={nickname} onChange={(e) => setNickname(e.target.value)} placeholder={species} />
        </label>
        <label>
          Level
          <input type="text" inputMode="numeric" value={level} onChange={(e) => setLevel(e.target.value)} />
        </label>
        <label className="shiny-toggle">
          <input type="checkbox" checked={shiny} onChange={(e) => setShiny(e.target.checked)} />
          Shiny ✦
        </label>
      </div>
      <div className="encounter-actions">
        <button onClick={() => onResolve(species, 'caught', nickname || species, Number(level) || 1, shiny)}>
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
  onResolve: (area: Area, species: string, outcome: Outcome, nickname?: string, level?: number, shiny?: boolean) => void;
  onReset: (area: Area) => void;
}) {
  return (
    <>
      {areas.map((area) => {
        const outcome = state.encounterOutcomes[area.id];
        const pool = !outcome ? filterEncounterPool(state, area, ctx) : [];

        return (
          <div key={area.id} className="area-row">
            <div
              className="area-row-header"
              onClick={() => setOpenAreaId(openAreaId === area.id ? null : area.id)}
              style={{ cursor: 'pointer' }}
            >
              <span>{area.name}</span>
              {outcome && <span className={`outcome-${outcome}`}>{outcome}</span>}
              {!outcome && <span className="muted">{pool.length} available</span>}
            </div>
            {openAreaId === area.id &&
              (outcome ? (
                <div className="route-resolved-body">
                  <p>
                    Resolved — <span className={`outcome-${outcome}`}>{outcome}</span>.
                  </p>
                  <CaughtHere areaId={area.id} state={state} />
                  <p className="muted">Resetting clears the outcome and removes any Pokémon caught here.</p>
                  <button className="secondary route-reset-btn" onClick={() => onReset(area)}>
                    Reset route
                  </button>
                </div>
              ) : pool.length > 0 ? (
                <EncounterForm pool={pool} onResolve={(sp, out, nick, lvl, sh) => onResolve(area, sp, out, nick, lvl, sh)} />
              ) : (
                <p className="muted">No wild encounters documented here.</p>
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

  async function resolve(area: Area, species: string, outcome: Outcome, nickname?: string, level?: number, shiny?: boolean) {
    await appendEvent(runId, {
      type: 'encounter_resolved',
      payload: {
        areaId: area.id,
        species,
        outcome,
        pokemonId: outcome === 'caught' ? crypto.randomUUID() : undefined,
        nickname,
        level,
        ...(shiny ? { shiny: true } : {}),
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
        <SpecialsSection runId={runId} state={state} ctx={ctx} onChange={onChange} />
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
              <CaughtHere areaId={selected.id} state={state} />
              <p className="muted">
                Resetting clears the outcome and removes any Pokémon caught here from your team, box and graveyard.
              </p>
              <button className="secondary route-reset-btn" onClick={() => resetRoute(selected)}>
                Reset route
              </button>
            </div>
          ) : selectedPool.length > 0 ? (
            <EncounterForm pool={selectedPool} onResolve={(sp, out, nick, lvl, sh) => resolve(selected, sp, out, nick, lvl, sh)} />
          ) : (
            <p className="muted">No wild encounters documented here.</p>
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

      <SpecialsSection runId={runId} state={state} ctx={ctx} onChange={onChange} />
    </section>
  );
}
