import {
  chosenStarter,
  milestoneRoster,
  milestonesFor,
  nextBoss,
  validateTeam,
  type EngineContext,
  type RunState,
} from '@nuzlocke/engine';
import { appendEvent } from '../../lib/db';
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
  const violations = validateTeam(state, ctx);
  const starter = chosenStarter(state);
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

      <div className="milestone-card-grid">
        {milestones.map((m) => (
          <MilestoneCard
            key={m.id}
            milestone={m}
            roster={milestoneRoster(m, starter) ?? []}
            cleared={state.milestonesCleared.includes(m.id)}
            isNext={boss?.id === m.id}
            isPinnedNext={state.nextBossId === m.id}
            onClear={() => clear(m.id)}
            onSetNext={
              m.aceLevel !== null && m.countsForLevelCap !== false ? () => setNext(m.id) : undefined
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
