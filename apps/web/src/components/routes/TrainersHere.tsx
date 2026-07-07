import { useState } from 'react';
import type { Area, AreaTrainer, RunState } from '@nuzlocke/engine';
import { appendEvent } from '../../lib/db';
import { resolveTrainerMoves, typesFor } from '../../lib/speciesData';
import { trainerKeyFromClass } from '../../lib/sprites';
import { MoveChips } from '../MoveChips';
import { SpriteImg } from '../SpriteImg';
import { StatBars } from '../StatBars';
import { TrainerSprite } from '../TrainerSprite';
import { TypeBadges } from '../TypeBadge';
import { WeaknessRow } from '../WeaknessRow';

/** Whether a trainer exists in the active version (most are unconditional). */
function appliesTo(t: AreaTrainer, version: string): boolean {
  return !t.conditions?.version || t.conditions.version.includes(version);
}

/** One trainer as an expandable card matching the Boss Fights treatment:
 * class sprite + team strip collapsed; expanded, full per-mon detail with
 * weaknesses, moves and stat bars. Documented movesets render as-is; when a
 * moveset isn't documented we show the mon's last four level-up moves at its
 * level — what the games actually give unspecified trainer mons — labelled
 * "expected". Owners can mark a trainer battled (audited trainer_battled /
 * trainer_reset events); omit runId/onChange for read-only. */
function TrainerCard({
  t,
  index,
  areaId,
  gameId,
  battled,
  runId,
  onChange,
}: {
  t: AreaTrainer;
  index: number;
  areaId: string;
  gameId: string;
  battled: boolean;
  runId?: string;
  onChange?: () => Promise<void>;
}) {
  const [expanded, setExpanded] = useState(false);
  const canMark = runId != null && onChange != null;

  async function toggleBattled() {
    if (!canMark) return;
    if (battled) {
      await appendEvent(runId, { type: 'trainer_reset', payload: { areaId, trainerIndex: index } });
    } else {
      await appendEvent(runId, { type: 'trainer_battled', payload: { areaId, trainerIndex: index, name: t.name } });
    }
    await onChange();
  }

  return (
    <div
      className={`trainer-row${expanded ? ' expanded' : ''}${battled ? ' battled' : ''}`}
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
      {/* Collapsed: one compact row — head left, team strip right (type
          badges live in the expanded detail, like the Boss Fights cards). */}
      <div className="trainer-row-main">
        <div className="trainer-row-head">
          {t.class && (
            <TrainerSprite trainerKey={trainerKeyFromClass(t.class)} size={44} className="trainer-row-sprite" />
          )}
          <div className="trainer-row-title">
            <strong>{t.name}</strong>
            {t.class && <span className="muted">{t.class}</span>}
          </div>
        </div>
        <span className="trainer-row-team">
          {t.team.map((p, j) => (
            <span key={`${p.species}-${j}`} className="trainer-mon" title={`${p.species} Lv ${p.level}`}>
              <SpriteImg species={p.species} size={44} />
              <span className="trainer-mon-lv muted">Lv{p.level}</span>
            </span>
          ))}
        </span>
        {battled && <span className="trainer-battled-badge">✓</span>}
      </div>
      {expanded && (
        <div className="trainer-row-detail">
          {t.team.map((p, j) => {
            const resolved = resolveTrainerMoves(p, gameId);
            return (
              <div key={`${p.species}-${j}`} className="milestone-roster-detail-row">
                <div className="mrd-head">
                  <SpriteImg species={p.species} size={76} />
                  <div className="mrd-title">
                    <strong>{p.species}</strong>
                    <span className="mrd-lv">Lv {p.level}</span>
                    <TypeBadges types={typesFor(p.species, gameId)} />
                    {(p.ability || p.heldItem) && (
                      <span className="muted mrd-meta">
                        {p.ability ?? ''}
                        {p.ability && p.heldItem ? ' · ' : ''}
                        {p.heldItem ? `@ ${p.heldItem}` : ''}
                      </span>
                    )}
                  </div>
                </div>
                <WeaknessRow types={typesFor(p.species, gameId)} />
                <MoveChips moves={resolved.moves ?? undefined} gameId={gameId} />
                {resolved.source === 'expected' && (
                  <span className="muted trainer-moves-note">expected moves — last four learned by Lv {p.level}</span>
                )}
                {resolved.source === 'unknown' && (
                  <span className="muted trainer-moves-note">moves not documented</span>
                )}
                <StatBars species={p.species} gameId={gameId} />
              </div>
            );
          })}
          {canMark && (
            <button
              className={battled ? 'secondary' : ''}
              onClick={(e) => {
                e.stopPropagation();
                toggleBattled();
              }}
            >
              {battled ? 'Unmark battled' : 'Mark battled'}
            </button>
          )}
        </div>
      )}
    </div>
  );
}

/** Documented trainer battles in this area — route intel under the encounter
 * picker, so a player can see what fights are coming before they commit.
 * Renders nothing when the dataset has no trainer data here. */
export function TrainersHere({
  area,
  version,
  gameId,
  state,
  runId,
  onChange,
}: {
  area: Area;
  version: string;
  gameId: string;
  state?: RunState;
  runId?: string;
  onChange?: () => Promise<void>;
}) {
  const trainers = (area.trainers ?? [])
    .map((t, index) => ({ t, index }))
    .filter(({ t }) => appliesTo(t, version));
  if (trainers.length === 0) return null;
  const battled = (index: number) => state?.trainersBattled.includes(`${area.id}#${index}`) ?? false;
  const battledCount = trainers.filter(({ index }) => battled(index)).length;
  return (
    <div className="trainers-group">
      <div className="trainers-header">
        <h3 className="chart-heading">Trainers</h3>
        <span className={`trainers-progress${battledCount === trainers.length ? ' done' : ''}`}>
          {battledCount}/{trainers.length} battled
        </span>
      </div>
      <div className="trainers-list">
        {trainers.map(({ t, index }) => (
          <TrainerCard
            key={`${t.name}-${index}`}
            t={t}
            index={index}
            areaId={area.id}
            gameId={gameId}
            battled={battled(index)}
            runId={runId}
            onChange={onChange}
          />
        ))}
      </div>
    </div>
  );
}
