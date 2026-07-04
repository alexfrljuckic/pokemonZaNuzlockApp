import { useState } from 'react';
import {
  chosenStarter,
  milestoneRoster,
  nextBoss,
  validateTeam,
  type EngineContext,
  type Milestone,
  type MilestoneRosterMember,
  type RunState,
} from '@nuzlocke/engine';
import { appendEvent } from '../../lib/db';
import { STAT_ORDER, moveType, statLabel, statsFor, typesFor } from '../../lib/speciesData';
import { trainerKeyFromMilestone } from '../../lib/sprites';
import { weaknesses } from '../../lib/typeChart';
import { SpriteImg } from '../../components/SpriteImg';
import { TrainerSprite } from '../../components/TrainerSprite';
import { TypeBadge, TypeBadges, TypeDot } from '../../components/TypeBadge';

function MilestoneCard({
  milestone,
  roster,
  cleared,
  isNext,
  onClear,
}: {
  milestone: Milestone;
  roster: MilestoneRosterMember[];
  cleared: boolean;
  isNext: boolean;
  onClear: () => void;
}) {
  const [expanded, setExpanded] = useState(false);
  const hasRoster = roster.length > 0;

  return (
    <div
      className={`milestone-card${cleared ? ' cleared' : ''}${isNext ? ' next' : ''}${expanded ? ' expanded' : ''}`}
      role="button"
      tabIndex={0}
      aria-expanded={expanded}
      onClick={() => setExpanded((e) => !e)}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          setExpanded((v) => !v);
        }
      }}
    >
      <div className="milestone-card-head">
        <TrainerSprite trainerKey={trainerKeyFromMilestone(milestone.id)} size={60} className="milestone-trainer-sprite" />
        <div className="milestone-card-title">
          <strong>{milestone.name}</strong>
          <span className="muted">
            {milestone.type}
            {milestone.aceLevel != null ? ` · ace Lv ${milestone.aceLevel}` : ''}
          </span>
        </div>
        {cleared && <span className="milestone-cleared-badge">✓ cleared</span>}
      </div>

      {hasRoster ? (
        <div className="milestone-roster-row">
          {roster.map((p, i) => (
            <span key={`${p.species}-${i}`} className="milestone-roster-mon">
              <SpriteImg species={p.species} size={64} />
              <span className="milestone-roster-lv muted">Lv{p.level}</span>
              <TypeBadges types={typesFor(p.species)} />
            </span>
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
                <div className="mrd-head">
                  <SpriteImg species={p.species} size={76} />
                  <div className="mrd-title">
                    <strong>{p.species}</strong>
                    <span className="mrd-lv">Lv {p.level}</span>
                    <TypeBadges types={typesFor(p.species)} />
                    {(p.ability || p.heldItem) && (
                      <span className="muted mrd-meta">
                        {p.ability ?? ''}
                        {p.ability && p.heldItem ? ' · ' : ''}
                        {p.heldItem ? `@ ${p.heldItem}` : ''}
                      </span>
                    )}
                  </div>
                </div>
                {(() => {
                  const weak = weaknesses(typesFor(p.species));
                  if (weak.length === 0) return null;
                  return (
                    <div className="mrd-weak">
                      <span className="mrd-weak-label muted">Weak to</span>
                      {weak.map((w) => (
                        <span key={w.type} className="mrd-weak-item">
                          <TypeBadge type={w.type} />
                          {w.x >= 4 && <span className="mrd-weak-x">×4</span>}
                        </span>
                      ))}
                    </div>
                  );
                })()}
                {p.moves && p.moves.length > 0 && (
                  <div className="poke-moves">
                    {p.moves.map((mv) => (
                      <span key={mv} className="move-chip">
                        <TypeDot type={moveType(mv)} />
                        {mv}
                      </span>
                    ))}
                  </div>
                )}
                {(() => {
                  const st = statsFor(p.species);
                  if (!st) return null;
                  return (
                    <div className="poke-statbars">
                      {STAT_ORDER.map((k) => (
                        <div key={k} className="statbar">
                          <span className="statbar-label">{statLabel(k)}</span>
                          <span className="statbar-track">
                            <span className="statbar-fill" style={{ width: `${Math.min(100, (st[k] / 200) * 100)}%` }} />
                          </span>
                          <span className="statbar-value">{st[k]}</span>
                        </div>
                      ))}
                    </div>
                  );
                })()}
              </div>
            ))
          ) : (
            <p className="muted">No full roster documented for this milestone yet.</p>
          )}
          {milestone.grants?.reviveTokens ? (
            <p className="muted">Grants {milestone.grants.reviveTokens} revive token(s) on clear.</p>
          ) : null}
          {!cleared && (
            <button
              className={isNext ? '' : 'secondary'}
              onClick={(e) => {
                e.stopPropagation();
                onClear();
              }}
            >
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
  const starter = chosenStarter(state);
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
