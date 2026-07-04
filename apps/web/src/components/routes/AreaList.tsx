import { filterEncounterPool, type Area, type EngineContext, type RunState } from '@nuzlocke/engine';
import { isFrontier } from '../RouteMap';
import { AllFilteredOut, hasDocumentedEncounters } from './AllFilteredOut';
import { CaughtHere } from './CaughtHere';
import { EncounterForm, type Outcome } from './EncounterForm';
import { SpecialsHere } from './SpecialsHere';

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
