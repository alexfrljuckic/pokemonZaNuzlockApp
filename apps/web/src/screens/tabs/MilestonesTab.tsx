import { useEffect, useRef } from 'react';
import {
  chosenStarter,
  difficultyForPreset,
  milestoneRoster,
  milestonesFor,
  nextBoss,
  validateTeam,
  type EngineContext,
  type RunState,
} from '@nuzlocke/engine';
import { appendEvent } from '../../lib/db';
import { openBossOrderFor } from '../../games';
import { MilestoneCard } from '../../components/MilestoneCard';

export function MilestonesTab({
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
  const boss = nextBoss(state, ctx);
  // On open, scroll the "up next" boss to the top of the height-capped list.
  const gridRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const grid = gridRef.current;
    const next = grid?.querySelector<HTMLElement>('.milestone-card.next');
    if (grid && next) grid.scrollTop += next.getBoundingClientRect().top - grid.getBoundingClientRect().top;
  }, []);
  const violations = validateTeam(state, ctx);
  const starter = chosenStarter(state);
  // Radical Red: pick the boss roster for the run's difficulty tier (Normal /
  // Hardcore). null for every mainline game → milestoneRoster is unchanged.
  const difficulty = difficultyForPreset(state.ruleset.presetId);
  // linear games (BDSP/LGPE/…) clear bosses in dataset order — no need to pick
  // a next target; the picker shows only for open-order games (SV).
  const openBoss = openBossOrderFor(ctx.dataset.gameId);
  const milestones = milestonesFor(ctx.dataset, state.version, state.ruleset).sort((a, b) => a.order - b.order);
  const allCleared = milestones.every((m) => state.milestonesCleared.includes(m.id));

  async function clear(id: string) {
    await appendEvent(runId, { type: 'milestone_cleared', payload: { milestoneId: id } });
    await onChange();
  }

  // Open-order games (SV): pick which boss you're doing next — the level cap
  // keys off it. Picking the boss that's already next reverts to dataset order.
  async function setNext(id: string) {
    await appendEvent(runId, {
      type: 'next_boss_set',
      payload: { milestoneId: state.nextBossId === id ? null : id },
    });
    await onChange();
  }

  async function declareVictory() {
    await appendEvent(runId, { type: 'run_ended', payload: { result: 'victory' } });
    await onChange();
  }

  return (
    <section>
      <h2>Boss Fights</h2>
      {state.reviveTokens > 0 && <p className="muted">Revive tokens: {state.reviveTokens}</p>}

      {violations.length > 0 && (
        <div className="violations">
          {violations.map((v, i) => (
            <div key={i} className="violation">
              {v.message}
            </div>
          ))}
        </div>
      )}

      <div className="milestone-card-grid boss-scroll" ref={gridRef}>
        {milestones.map((m) => (
          <MilestoneCard
            key={m.id}
            milestone={m}
            roster={milestoneRoster(m, starter, difficulty) ?? []}
            gameId={ctx.dataset.gameId}
            cleared={state.milestonesCleared.includes(m.id)}
            isNext={boss?.id === m.id}
            isPinnedNext={state.nextBossId === m.id}
            onClear={() => clear(m.id)}
            onSetNext={
              openBoss && m.aceLevel !== null && m.countsForLevelCap !== false
                ? () => setNext(m.id)
                : undefined
            }
          />
        ))}
      </div>

      {allCleared && state.status === 'active' && (
        <button onClick={declareVictory}>Declare Victory</button>
      )}
    </section>
  );
}
