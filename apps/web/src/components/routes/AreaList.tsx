import { classifyEncounterPool, frontierAreas, type Area, type EngineContext, type RunState } from '@nuzlocke/engine';
import { ConfirmAction } from '../ConfirmAction';
import { AllFilteredOut, hasDocumentedEncounters } from './AllFilteredOut';
import { CaughtHere } from './CaughtHere';
import { EncounterForm, dupesScope, type Outcome } from './EncounterForm';
import { ItemsHere } from './ItemsHere';
import { SpecialsHere } from './SpecialsHere';
import { TrainersHere } from './TrainersHere';

/** Flat expandable list of areas — the fallback for games without a map, and
 * the supplemental view for map-less areas (e.g. Grand Underground). */
export function AreaList({
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
  // Window computed over the FULL dataset order (this list may render only
  // the off-map subset), so map and list agree on what's "up next".
  const frontier = frontierAreas(ctx.dataset.areas, state, ctx.dataset.milestones);
  return (
    <>
      {areas.map((area) => {
        const outcome = state.encounterOutcomes[area.id];
        // Classified base pool: available species + dupes-dimmed ones (shown,
        // not hidden). `available` is what the "N available" count reflects.
        const pool = !outcome ? classifyEncounterPool(state, area, ctx) : [];
        const availableCount = pool.filter((e) => e.available).length;

        return (
          <div key={area.id} className={`area-row${frontier.has(area.id) ? ' area-row-frontier' : ''}`}>
            <button
              type="button"
              className="area-row-header"
              aria-expanded={openAreaId === area.id}
              onClick={() => setOpenAreaId(openAreaId === area.id ? null : area.id)}
            >
              <span>{area.name}</span>
              {outcome && <span className={`outcome-${outcome}`}>{outcome}</span>}
              {!outcome && <span className="muted">{availableCount} available</span>}
            </button>
            {openAreaId === area.id &&
              (outcome ? (
                <div className="route-resolved-body">
                  <p>
                    Resolved — <span className={`outcome-${outcome}`}>{outcome}</span>.
                  </p>
                  <CaughtHere areaId={area.id} state={state} />
                  <p className="muted">Resetting clears the outcome and removes any Pokémon caught here.</p>
                  <ConfirmAction
                    label="Reset route"
                    triggerClass="secondary route-reset-btn"
                    prompt={`Reset ${area.name}? Removes any Pokémon caught here.`}
                    ariaLabel={`Reset ${area.name}`}
                    onConfirm={() => onReset(area)}
                  />
                </div>
              ) : pool.length > 0 ? (
                // Base pool has species (available or dupes-dimmed) — the form
                // renders them; dimmed-only areas keep a skip affordance.
                <EncounterForm
                  pool={pool}
                  scope={dupesScope(state)}
                  onResolve={(sp, out, nick, lvl, sh) => onResolve(area, sp, out, nick, lvl, sh)}
                  onSkip={() => onResolve(area, '', 'skipped')}
                />
              ) : hasDocumentedEncounters(area, state.version) ? (
                // Base pool empty but the area documents encounters (all locked
                // to the other version / alpha-only) — nothing to show; skip.
                <AllFilteredOut onSkip={() => onResolve(area, '', 'skipped')} />
              ) : (
                <p className="muted">No wild encounters documented here.</p>
              ))}
            {openAreaId === area.id && (
              <>
                <SpecialsHere areaId={area.id} runId={runId} state={state} ctx={ctx} onChange={onChange} />
                <TrainersHere area={area} version={state.version} gameId={ctx.dataset.gameId} state={state} runId={runId} onChange={onChange} />
                <ItemsHere area={area} version={state.version} state={state} runId={runId} onChange={onChange} />
              </>
            )}
          </div>
        );
      })}
    </>
  );
}
