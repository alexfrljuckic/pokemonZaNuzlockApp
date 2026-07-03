import { nextBoss, validateTeam, type EngineContext, type RunState } from '@nuzlocke/engine';
import { appendEvent } from '../../lib/db';

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
  const milestones = [...ctx.dataset.milestones].sort((a, b) => a.order - b.order);
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
      <h2>Bosses & Milestones</h2>
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

      {milestones.map((m) => {
        const cleared = state.milestonesCleared.includes(m.id);
        const isNext = boss?.id === m.id;
        return (
          <div key={m.id} className="milestone-row-wrap">
            <div className="milestone-row">
              <span>
                {m.name}
                {m.aceLevel != null ? <span className="muted"> (ace Lv {m.aceLevel})</span> : null}
                {m.grants?.reviveTokens ? <span className="muted"> · grants {m.grants.reviveTokens} token(s)</span> : null}
              </span>
              {cleared ? (
                <span className="muted">cleared</span>
              ) : (
                <button className={isNext ? '' : 'secondary'} onClick={() => clear(m.id)}>
                  Clear
                </button>
              )}
            </div>
            {m.roster && m.roster.length > 0 && (
              <p className="muted milestone-roster">
                Team: {m.roster.map((p) => `${p.species} (Lv ${p.level})`).join(', ')}
              </p>
            )}
          </div>
        );
      })}

      {allCleared && state.status === 'active' && (
        <button onClick={declareVictory}>Declare Victory</button>
      )}
    </section>
  );
}
