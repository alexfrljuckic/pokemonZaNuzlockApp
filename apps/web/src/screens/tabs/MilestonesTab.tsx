import { useState } from 'react';
import { nextBoss, validateTeam, type EngineContext, type Milestone, type RunState } from '@nuzlocke/engine';
import { appendEvent } from '../../lib/db';
import { SpriteImg } from '../../components/SpriteImg';

function MilestoneCard({
  milestone,
  cleared,
  isNext,
  onClear,
}: {
  milestone: Milestone;
  cleared: boolean;
  isNext: boolean;
  onClear: () => void;
}) {
  const [expanded, setExpanded] = useState(false);
  const roster = milestone.roster ?? [];
  const hasRoster = roster.length > 0;

  return (
    <div className={`milestone-card${cleared ? ' cleared' : ''}${isNext ? ' next' : ''}`}>
      <button
        type="button"
        className="milestone-card-head"
        onClick={() => setExpanded((e) => !e)}
        aria-expanded={expanded}
      >
        <div className="milestone-card-title">
          <strong>{milestone.name}</strong>
          <span className="muted">
            {milestone.type}
            {milestone.aceLevel != null ? ` · ace Lv ${milestone.aceLevel}` : ''}
          </span>
        </div>
        {cleared && <span className="muted">cleared</span>}
      </button>

      {hasRoster ? (
        <div className="milestone-roster-row">
          {roster.map((p, i) => (
            <SpriteImg key={`${p.species}-${i}`} species={p.species} size={40} />
          ))}
        </div>
      ) : milestone.aceLevel != null ? (
        <p className="muted milestone-roster-fallback">Ace Lv {milestone.aceLevel} · full team not documented</p>
      ) : null}

      {expanded && (
        <div className="milestone-card-detail">
          {hasRoster ? (
            roster.map((p, i) => (
              <div key={`${p.species}-${i}`} className="milestone-roster-detail-row">
                <SpriteImg species={p.species} size={48} />
                <div className="poke-detail-summary">
                  <strong>{p.species}</strong>
                  <span className="muted">
                    Lv {p.level}
                    {p.ability ? ` · ${p.ability}` : ''}
                    {p.heldItem ? ` · holding ${p.heldItem}` : ''}
                  </span>
                  {p.moves && p.moves.length > 0 && (
                    <span className="poke-moves">
                      {p.moves.map((mv) => (
                        <span key={mv} className="move-chip">
                          {mv}
                        </span>
                      ))}
                    </span>
                  )}
                </div>
              </div>
            ))
          ) : (
            <p className="muted">No full roster documented for this milestone yet.</p>
          )}
          {milestone.grants?.reviveTokens ? (
            <p className="muted">Grants {milestone.grants.reviveTokens} revive token(s) on clear.</p>
          ) : null}
          {!cleared && (
            <button className={isNext ? '' : 'secondary'} onClick={onClear}>
              Clear
            </button>
          )}
        </div>
      )}
    </div>
  );
}

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

      <div className="milestone-card-grid">
        {milestones.map((m) => (
          <MilestoneCard
            key={m.id}
            milestone={m}
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
