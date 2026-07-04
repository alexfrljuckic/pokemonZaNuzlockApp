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
  const milestones = milestonesFor(ctx.dataset, state.version).sort((a, b) => a.order - b.order);
  const allCleared = milestones.every((m) => state.milestonesCleared.includes(m.id));

  async function clear(id: string) {
    await appendEvent(runId, { type: 'milestone_cleared', payload: { milestoneId: id } });
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
            onClear={() => clear(m.id)}
          />
        ))}
      </div>

      {allCleared && state.status === 'active' && (
        <button onClick={declareVictory}>Declare Victory</button>
      )}
    </section>
  );
}
