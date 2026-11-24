import { classifyEncounterPool, encounterRollInfo, rollEncounterSpecies, type Area, type EngineContext, type RunState } from '@nuzlocke/engine';
import { appendEvent } from '../../lib/db';
import { SpriteImg } from '../SpriteImg';
import { AllFilteredOut, hasDocumentedEncounters } from './AllFilteredOut';
import { EncounterForm, dupesScope, type Outcome } from './EncounterForm';

/** The unresolved-area encounter body, shared by the map panel (RoutesTab)
 * and the area list. Open-world games (PLA, Z-A) with the Random Encounter
 * Roll rule on get a roll step first: the app picks the one species you may
 * catch here, and only that species stays selectable in the form. */
export function AreaEncounter({
  area,
  state,
  ctx,
  runId,
  onChange,
  onResolve,
  onSkip,
}: {
  area: Area;
  state: RunState;
  ctx: EngineContext;
  /** owner run id; omit for read-only views (no roll button) */
  runId?: string;
  onChange?: () => Promise<void>;
  onResolve: (species: string, outcome: Outcome, nickname?: string, level?: number, shiny?: boolean) => void;
  onSkip: () => void;
}) {
  const pool = classifyEncounterPool(state, area, ctx);
  const roll = encounterRollInfo(state, area, ctx);
  const canRoll = runId != null && onChange != null;

  async function doRoll(reroll: boolean) {
    if (!runId || !onChange) return;
    const species = rollEncounterSpecies(roll.candidates, reroll ? roll.target : null);
    if (!species) return;
    await appendEvent(runId, {
      type: 'encounter_rolled',
      payload: { areaId: area.id, species, ...(reroll ? { reroll: true } : {}) },
    });
    await onChange();
  }

  if (pool.length === 0) {
    return hasDocumentedEncounters(area, state.version) ? (
      // Base pool empty but the area documents encounters (all locked to the
      // other version / alpha-only) — nothing to show; skip.
      <AllFilteredOut onSkip={onSkip} />
    ) : (
      <p className="muted">No wild encounters documented here.</p>
    );
  }

  const needsRoll = roll.enabled && !roll.target && roll.candidates.length > 0;

  return (
    <>
      {roll.enabled && roll.candidates.length > 0 && (
        <div className={`encounter-roll${roll.target ? ' rolled' : ''}`}>
          {roll.target ? (
            <>
              <div className="encounter-roll-target">
                <SpriteImg species={roll.target} size={56} />
                <div>
                  <span className="muted encounter-roll-label">Your roll</span>
                  <strong className="encounter-roll-species">{roll.target}</strong>
                  <span className="muted">The only Pokémon you may catch here.</span>
                </div>
              </div>
              {canRoll &&
                (roll.rerollsLeft > 0 && roll.candidates.length > 1 ? (
                  <button type="button" className="secondary" onClick={() => doRoll(true)}>
                    ↺ Reroll ({roll.rerollsLeft} left)
                  </button>
                ) : (
                  <span className="muted encounter-roll-note">No rerolls left</span>
                ))}
            </>
          ) : (
            <>
              <p className="encounter-roll-intro">
                Open world: roll which Pokémon is your encounter here.{' '}
                <span className="muted">
                  {roll.candidates.length} possible · {roll.rerollsLeft} reroll{roll.rerollsLeft === 1 ? '' : 's'}
                </span>
              </p>
              {canRoll ? (
                <div className="encounter-roll-actions">
                  <button type="button" onClick={() => doRoll(false)}>
                    🎲 Roll my encounter
                  </button>
                  <button type="button" className="secondary" onClick={onSkip}>
                    Skip area
                  </button>
                </div>
              ) : (
                <p className="muted">Not rolled yet.</p>
              )}
            </>
          )}
        </div>
      )}
      {/* Before the roll, show the candidates read-only so the player can see
          what lives here; after the roll, the same form becomes interactive
          (only the rolled species is selectable). */}
      <EncounterForm
        pool={pool}
        scope={dupesScope(state)}
        gameId={ctx.dataset.gameId}
        onResolve={onResolve}
        onSkip={onSkip}
        preview={needsRoll}
      />
    </>
  );
}
