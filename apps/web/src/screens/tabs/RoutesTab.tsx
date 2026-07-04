import { useState } from 'react';
import { filterEncounterPool, specialAppliesToVersion, type Area, type EncounterSlot, type EngineContext, type RunState } from '@nuzlocke/engine';
import { appendEvent } from '../../lib/db';
import { GAME_MAPS, mapHelpers } from '../../lib/maps';
import { RouteMap, isFrontier } from '../../components/RouteMap';
import { SpriteImg } from '../../components/SpriteImg';
import { TypeBadges } from '../../components/TypeBadge';
import { SpecialCard, StarterPicker, claimedSpecial } from '../../components/SpecialsSection';
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

/** Whether this area has any wild encounters documented at all for the active
 * version — independent of the ruleset (dupes/first-encounter can legally
 * filter every slot out while the area still "has" encounters on paper). */
function hasDocumentedEncounters(area: Area, version: string): boolean {
  return area.encounters.some((slot) => !slot.conditions?.version || slot.conditions.version.includes(version));
}

/** Shown when every documented encounter here was filtered out by the active
 * ruleset (e.g. dupes clause: you already own every species that lives here).
 * Without this the area could never be resolved — the encounter form has
 * nothing to offer, but the route still needs a way to be marked done. */
function AllFilteredOut({ onSkip }: { onSkip: () => void }) {
  return (
    <div className="route-all-filtered">
      <p className="muted">
        Every wild Pokémon here is already covered by your dupes clause — nothing left to catch.
      </p>
      <button className="secondary" onClick={onSkip}>
        Skip route
      </button>
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

/** Gift/fossil/static specials tied to one area (not starters — those are
 * claimed earlier, in the game-picker flow). Renders nothing if none. */
function SpecialsHere({
  areaId,
  runId,
  state,
  ctx,
  onChange,
}: {
  areaId: string;
  runId: string;
  state: RunState;
  ctx: EngineContext;
  onChange: () => Promise<void>;
}) {
  const here = (ctx.dataset.specials ?? []).filter(
    (s) => s.area === areaId && !s.id.startsWith('starter-') && specialAppliesToVersion(s, state.version),
  );
  if (here.length === 0) return null;
  return (
    <div className="specials-group">
      <p className="muted specials-group-label">Gifts &amp; specials here</p>
      <div className="specials-grid">
        {here.map((s) => (
          <SpecialCard key={s.id} s={s} runId={runId} state={state} onChange={onChange} />
        ))}
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
  runId,
  openAreaId,
  setOpenAreaId,
  onResolve,
  onReset,
  onChange,
}: {
  areas: Area[];
  state: RunState;
  ctx: EngineContext;
  runId: string;
  openAreaId: string | null;
  setOpenAreaId: (id: string | null) => void;
  onResolve: (area: Area, species: string, outcome: Outcome, nickname?: string, level?: number, shiny?: boolean) => void;
  onReset: (area: Area) => void;
  onChange: () => Promise<void>;
}) {
  return (
    <>
      {areas.map((area) => {
        const outcome = state.encounterOutcomes[area.id];
        const pool = !outcome ? filterEncounterPool(state, area, ctx) : [];

        const frontier = isFrontier(area, state);
        return (
          <div key={area.id} className={`area-row${frontier ? ' area-row-frontier' : ''}`}>
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
              ) : hasDocumentedEncounters(area, state.version) ? (
                <AllFilteredOut onSkip={() => onResolve(area, '', 'skipped')} />
              ) : (
                <p className="muted">No wild encounters documented here.</p>
              ))}
            {openAreaId === area.id && (
              <SpecialsHere areaId={area.id} runId={runId} state={state} ctx={ctx} onChange={onChange} />
            )}
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
  const map = GAME_MAPS[ctx.dataset.gameId];

  // Starter is normally claimed in the game-picker flow before a run even
  // starts; this is only a fallback for runs where it was skipped (or
  // pre-existing runs from before that flow existed).
  const starters = (ctx.dataset.specials ?? []).filter(
    (s) => s.id.startsWith('starter-') && specialAppliesToVersion(s, state.version),
  );
  const starterUnclaimed = starters.length > 0 && !starters.some((s) => claimedSpecial(s.id, state));
  const starterStepLabel = starters.length > 1 ? 'Choose your starter' : 'Your partner Pokémon';

  if (!map) {
    return (
      <section>
        <h2>Routes</h2>
        {starterUnclaimed && (
          <div className="specials-section">
            <h3 className="route-offmap-title">{starterStepLabel}</h3>
            <StarterPicker runId={runId} state={state} starters={starters} onChange={onChange} />
          </div>
        )}
        <AreaList
          areas={areas}
          state={state}
          ctx={ctx}
          runId={runId}
          openAreaId={openAreaId}
          setOpenAreaId={setOpenAreaId}
          onResolve={resolve}
          onReset={resetRoute}
          onChange={onChange}
        />
      </section>
    );
  }

  const selected = openAreaId ? areas.find((a) => a.id === openAreaId) ?? null : null;
  const selectedOutcome = selected ? state.encounterOutcomes[selected.id] : undefined;
  const selectedPool = selected ? filterEncounterPool(state, selected, ctx) : [];
  const { hasMapNode } = mapHelpers(map);
  const offMapAreas = areas.filter((a) => !hasMapNode(a.id));

  return (
    <section>
      <h2>Routes</h2>

      {starterUnclaimed && (
        <div className="specials-section">
          <h3 className="route-offmap-title">{starterStepLabel}</h3>
          <StarterPicker runId={runId} state={state} starters={starters} onChange={onChange} />
        </div>
      )}

      <RouteMap map={map} areas={areas} state={state} version={state.version} onSelect={(id) => setOpenAreaId(id)} />

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
          ) : hasDocumentedEncounters(selected, state.version) ? (
            <AllFilteredOut onSkip={() => resolve(selected, '', 'skipped')} />
          ) : (
            <p className="muted">No wild encounters documented here.</p>
          )}
          <SpecialsHere areaId={selected.id} runId={runId} state={state} ctx={ctx} onChange={onChange} />
        </div>
      )}

      {offMapAreas.length > 0 && (
        <div className="route-offmap">
          <h3 className="route-offmap-title">Other areas</h3>
          <AreaList
            areas={offMapAreas}
            state={state}
            ctx={ctx}
            runId={runId}
            openAreaId={openAreaId}
            setOpenAreaId={setOpenAreaId}
            onResolve={resolve}
            onReset={resetRoute}
            onChange={onChange}
          />
        </div>
      )}
    </section>
  );
}
