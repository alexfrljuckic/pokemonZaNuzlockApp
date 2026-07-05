import { useMemo, useState } from 'react';
import { areasFor, filterEncounterPool, specialAppliesToVersion, type Area, type EngineContext, type RunState } from '@nuzlocke/engine';
import { appendEvent } from '../../lib/db';
import { GAME_MAPS, mapHelpers } from '../../lib/maps';
import { RouteMap, type ZoneSummary } from '../../components/RouteMap';
import { StarterPicker, claimedSpecial, starterHeading } from '../../components/SpecialsSection';
import { AllFilteredOut, hasDocumentedEncounters } from '../../components/routes/AllFilteredOut';
import { AreaList } from '../../components/routes/AreaList';
import { CaughtHere } from '../../components/routes/CaughtHere';
import { EncounterForm, type Outcome } from '../../components/routes/EncounterForm';
import { ItemsHere } from '../../components/routes/ItemsHere';
import { SpecialsHere } from '../../components/routes/SpecialsHere';
import { TrainersHere } from '../../components/routes/TrainersHere';

const zoneIdOf = (area: Area): string | null =>
  area.tags.find((t) => t.startsWith('zone:'))?.slice('zone:'.length) ?? null;

const zoneNameOf = (zoneId: string) => zoneId.replace(/-/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());

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
  const [activeZone, setActiveZone] = useState<string | null>(null);

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

  // respects the run's 'dlc-content' toggle (base-game runs hide DLC areas)
  const areas = areasFor(ctx.dataset, state.ruleset);
  const map = GAME_MAPS[ctx.dataset.gameId];

  // Starter is normally claimed in the game-picker flow before a run even
  // starts; this is only a fallback for runs where it was skipped (or
  // pre-existing runs from before that flow existed).
  const starters = (ctx.dataset.specials ?? []).filter(
    (s) => s.id.startsWith('starter-') && specialAppliesToVersion(s, state.version),
  );
  const starterUnclaimed = starters.length > 0 && !starters.some((s) => claimedSpecial(s.id, state));

  if (!map) {
    return (
      <section>
        <h2>Routes</h2>
        {starterUnclaimed && (
          <div className="specials-section">
            <h3 className="route-offmap-title">{starterHeading(starters)}</h3>
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

  // Zone mode (PLA): areas carry zone:* tags and the map's zone nodes act as
  // group selectors — the list below shows one zone at a time.
  const zones = useMemo(() => {
    const byZone = new Map<string, ZoneSummary>();
    for (const a of areas) {
      const z = zoneIdOf(a);
      if (!z) continue;
      const cur = byZone.get(z) ?? { id: z, name: zoneNameOf(z), resolved: 0, total: 0 };
      cur.total += 1;
      if (state.encounterOutcomes[a.id]) cur.resolved += 1;
      byZone.set(z, cur);
    }
    return byZone;
  }, [areas, state.encounterOutcomes]);
  const zoneMode = zones.size > 0;

  const offMapAreas = zoneMode
    ? areas.filter((a) => (activeZone ? zoneIdOf(a) === activeZone : !zoneIdOf(a) && !hasMapNode(a.id)))
    : areas.filter((a) => !hasMapNode(a.id));
  const offMapTitle = zoneMode && activeZone ? zoneNameOf(activeZone) : 'Other areas';

  function selectZone(zoneId: string) {
    setActiveZone((cur) => (cur === zoneId ? null : zoneId));
    setOpenAreaId(null);
  }

  return (
    <section className="route-map-stage">
      <h2>Routes</h2>

      {starterUnclaimed && (
        <div className="specials-section">
          <h3 className="route-offmap-title">{starterHeading(starters)}</h3>
          <StarterPicker runId={runId} state={state} starters={starters} onChange={onChange} />
        </div>
      )}

      <RouteMap
        map={map}
        areas={areas}
        state={state}
        version={state.version}
        onSelect={(id) => setOpenAreaId(id)}
        zones={zoneMode ? zones : undefined}
        onSelectZone={zoneMode ? selectZone : undefined}
      />

      {zoneMode && (
        <div className="zone-chips" role="tablist" aria-label="Zones">
          {[...zones.values()].map((z) => (
            <button
              key={z.id}
              type="button"
              role="tab"
              aria-selected={activeZone === z.id}
              className={`zone-chip${activeZone === z.id ? ' selected' : ''}`}
              onClick={() => selectZone(z.id)}
            >
              {z.name} <span className="muted">{z.resolved}/{z.total}</span>
            </button>
          ))}
        </div>
      )}

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
          <TrainersHere area={selected} version={state.version} gameId={ctx.dataset.gameId} state={state} runId={runId} onChange={onChange} />
          <ItemsHere area={selected} version={state.version} state={state} runId={runId} onChange={onChange} />
        </div>
      )}

      {zoneMode && !activeZone && offMapAreas.length === 0 && (
        <p className="muted zone-hint">Pick a zone on the map (or a chip above) to browse its areas.</p>
      )}

      {offMapAreas.length > 0 && (
        <div className="route-offmap">
          <h3 className="route-offmap-title">{offMapTitle}</h3>
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
