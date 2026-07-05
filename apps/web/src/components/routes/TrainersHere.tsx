import { useState } from 'react';
import type { Area, AreaTrainer } from '@nuzlocke/engine';
import { typesFor } from '../../lib/speciesData';
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

/** One trainer as an expandable card: class sprite + team strip collapsed,
 * full per-mon detail (weaknesses, moves, stat bars) expanded — the same
 * detail treatment as the boss-fight MilestoneCard, reusing its mrd-* styles. */
function TrainerCard({ t, gameId }: { t: AreaTrainer; gameId: string }) {
  const [expanded, setExpanded] = useState(false);
  return (
    <div
      className={`trainer-row${expanded ? ' expanded' : ''}`}
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
      <div className="trainer-row-head">
        {t.class && <TrainerSprite trainerKey={trainerKeyFromClass(t.class)} size={44} className="trainer-row-sprite" />}
        <span className="trainer-row-name">
          {t.class ? `${t.class} ` : ''}
          <strong>{t.name}</strong>
        </span>
      </div>
      <span className="trainer-row-team">
        {t.team.map((p, j) => (
          <span key={`${p.species}-${j}`} className="trainer-mon" title={`${p.species} Lv ${p.level}`}>
            <SpriteImg species={p.species} size={40} />
            <span className="trainer-mon-lv muted">Lv{p.level}</span>
            <TypeBadges types={typesFor(p.species)} />
          </span>
        ))}
      </span>
      {expanded && (
        <div className="trainer-row-detail">
          {t.team.map((p, j) => (
            <div key={`${p.species}-${j}`} className="milestone-roster-detail-row">
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
              <WeaknessRow types={typesFor(p.species)} />
              <MoveChips moves={p.moves} gameId={gameId} />
              <StatBars species={p.species} />
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

/** Documented trainer battles in this area — display-only route intel under
 * the encounter picker, so a player can see what fights are coming before
 * they commit. Renders nothing when the dataset has no trainer data here. */
export function TrainersHere({ area, version, gameId }: { area: Area; version: string; gameId: string }) {
  const trainers = (area.trainers ?? []).filter((t) => appliesTo(t, version));
  if (trainers.length === 0) return null;
  return (
    <div className="trainers-group">
      <p className="muted specials-group-label">Trainers here ({trainers.length})</p>
      <div className="trainers-list">
        {trainers.map((t, i) => (
          <TrainerCard key={`${t.name}-${i}`} t={t} gameId={gameId} />
        ))}
      </div>
    </div>
  );
}
