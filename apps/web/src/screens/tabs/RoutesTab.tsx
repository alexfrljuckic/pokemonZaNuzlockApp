import { useMemo, useState } from 'react';
import { areasForVersion, classifyEncounterPool, specialAppliesToVersion, type Area, type EngineContext, type RunState } from '@nuzlocke/engine';
import { appendEvent } from '../../lib/db';
import { GAME_MAPS, ZONE_MAPS, mapHelpers } from '../../lib/maps';
import { ConfirmAction } from '../../components/ConfirmAction';
import { RouteMap, type ZoneSummary } from '../../components/RouteMap';
import { StarterPicker, claimedSpecial, starterHeading } from '../../components/SpecialsSection';
import { AllFilteredOut, hasDocumentedEncounters } from '../../components/routes/AllFilteredOut';
import { AreaList } from '../../components/routes/AreaList';
import { CaughtHere } from '../../components/routes/CaughtHere';
import { EncounterForm, dupesScope, type Outcome } from '../../components/routes/EncounterForm';
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
    await appendEvent(runId, { type: 'encounter_reset', payload: { areaId: area.id } });
    setOpenAreaId(null);
    await onChange();
  }

  // respects the run's 'dlc-content' toggle (base-game runs hide DLC areas),
  // and hides areas whose only documented encounters are locked to the other
  // version (e.g. Giant's Mirror on a Sword run — its lone slot is Shield-only)
  const areas = areasForVersion(ctx.dataset, state.version, state.ruleset);
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
            <StarterPicker runId={runId} state={state} starters={starters} gameId={ctx.dataset.gameId} onChange={onChange} />
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
  // Classified base pool: available species + dupes-dimmed ones (still shown so
  // the player sees the full picture of what lives here).
  const selectedPool = selected ? classifyEncounterPool(state, selected, ctx) : [];

  // Zone mode (PLA): areas carry zone:* tags and the map's zone nodes act as
  // group selectors — the list below shows one zone at a time. When the game
  // has a per-zone map for the active zone, it replaces the overview.
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

  const zoneMap = activeZone ? ZONE_MAPS[ctx.dataset.gameId]?.[activeZone] : undefined;
  const activeMap = zoneMap ?? map;
  const { hasMapNode } = mapHelpers(activeMap);
  // Portrait maps (Galar is 1:1.95) are height-capped on desktop and would
  // leave the stage's width empty — the side content moves next to them.
  const portrait = activeMap.viewBox.h / activeMap.viewBox.w > 1.15;

  const offMapAreas = zoneMode
    ? activeZone
      ? areas.filter((a) => zoneIdOf(a) === activeZone && !hasMapNode(a.id))
      : areas.filter((a) => !zoneIdOf(a) && !hasMapNode(a.id))
    : areas.filter((a) => !hasMapNode(a.id));
  const offMapTitle = zoneMode && activeZone
    ? zoneMap
      ? `More in ${zoneNameOf(activeZone)}`
      : zoneNameOf(activeZone)
    : 'Other areas';

  function selectZone(zoneId: string) {
    setActiveZone((cur) => (cur === zoneId ? null : zoneId));
    setOpenAreaId(null);
  }

  return (
    <section className={`route-map-stage${portrait ? ' route-stage-portrait' : ''}`}>
      <h2>Routes</h2>

      {starterUnclaimed && (
        <div className="specials-section">
          <h3 className="route-offmap-title">{starterHeading(starters)}</h3>
          <StarterPicker runId={runId} state={state} starters={starters} gameId={ctx.dataset.gameId} onChange={onChange} />
        </div>
      )}

      {/* plain block wrappers everywhere except desktop portrait mode, where
          .route-stage-body becomes a map | side-content grid */}
      <div className="route-stage-body">
        <div className="route-stage-map">
          {zoneMap && activeZone && (
            <div className="zone-map-head">
              <button type="button" className="secondary zone-back" onClick={() => setActiveZone(null)}>
                ← All zones
              </button>
              <h3 className="route-offmap-title">{zoneNameOf(activeZone)}</h3>
            </div>
          )}

          <RouteMap
            key={zoneMap ? activeZone : 'overview'}
            map={activeMap}
            areas={areas}
            state={state}
            version={state.version}
            milestones={ctx.dataset.milestones}
            onSelect={(id) => setOpenAreaId(id)}
            zones={zoneMode && !zoneMap ? zones : undefined}
            onSelectZone={zoneMode && !zoneMap ? selectZone : undefined}
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
        </div>

        <div className="route-stage-side">
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
              <ConfirmAction
                label="Reset route"
                triggerClass="secondary route-reset-btn"
                prompt={`Reset ${selected.name}? Removes any Pokémon caught here.`}
                ariaLabel={`Reset ${selected.name}`}
                onConfirm={() => resetRoute(selected)}
              />
            </div>
          ) : selectedPool.length > 0 ? (
            // Base pool has species (available or dupes-dimmed) — the form shows
            // them all; dimmed-only areas keep a skip affordance inside the form.
            <EncounterForm
              pool={selectedPool}
              scope={dupesScope(state)}
              gameId={ctx.dataset.gameId}
              onResolve={(sp, out, nick, lvl, sh) => resolve(selected, sp, out, nick, lvl, sh)}
              onSkip={() => resolve(selected, '', 'skipped')}
            />
          ) : hasDocumentedEncounters(selected, state.version) ? (
            // Base pool empty but the area documents encounters (all locked to
            // the other version / alpha-only) — nothing to show; skip.
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
        </div>
      </div>
    </section>
  );
}
