import { useState } from 'react';
import type { Milestone, MilestoneRosterMember } from '@nuzlocke/engine';
import { typesFor } from '../lib/speciesData';
import { trainerKeyFromMilestone } from '../lib/sprites';
import { MoveChips } from './MoveChips';
import { SpriteImg } from './SpriteImg';
import { StatBars } from './StatBars';
import { TrainerSprite } from './TrainerSprite';
import { TypeBadges } from './TypeBadge';
import { WeaknessRow } from './WeaknessRow';

/** Expandable boss-fight card: trainer sprite, roster strip, and full per-mon
 * detail (weaknesses, moves, stat bars) when expanded.
 *
 * Read-only mode (SpectatorView): omit onClear — the Clear button disappears,
 * everything else renders identically. */
export function MilestoneCard({
  milestone,
  roster,
  cleared,
  isNext,
  isPinnedNext = false,
  onClear,
  onSetNext,
}: {
  milestone: Milestone;
  roster: MilestoneRosterMember[];
  cleared: boolean;
  isNext: boolean;
  /** true when the player explicitly picked this boss as next (vs. dataset order) */
  isPinnedNext?: boolean;
  onClear?: () => void;
  /** present only on cap-gating milestones in owner views — toggles the next-boss pick */
  onSetNext?: () => void;
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
        <TrainerSprite
          trainerKey={milestone.trainerSprite ?? trainerKeyFromMilestone(milestone.id)}
          size={60}
          className="milestone-trainer-sprite"
        />
        <div className="milestone-card-title">
          <strong>{milestone.name}</strong>
          <span className="muted">
            {milestone.type}
            {milestone.aceLevel != null ? ` · ace Lv ${milestone.aceLevel}` : ''}
          </span>
        </div>
        {cleared && <span className="milestone-cleared-badge">✓ cleared</span>}
        {!cleared && isNext && (
          <span className="milestone-next-badge">{isPinnedNext ? '◎ next (your pick)' : '◎ next'}</span>
        )}
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
                    {(p.ability || p.heldItem || p.teraType) && (
                      <span className="muted mrd-meta">
                        {p.ability ?? ''}
                        {p.ability && p.heldItem ? ' · ' : ''}
                        {p.heldItem ? `@ ${p.heldItem}` : ''}
                        {p.teraType ? `${p.ability || p.heldItem ? ' · ' : ''}tera ${p.teraType}` : ''}
                      </span>
                    )}
                  </div>
                </div>
                <WeaknessRow types={typesFor(p.species)} />
                <MoveChips moves={p.moves} />
                <StatBars species={p.species} />
              </div>
            ))
          ) : (
            <p className="muted">No full roster documented for this milestone yet.</p>
          )}
          {milestone.grants?.reviveTokens ? (
            <p className="muted">Grants {milestone.grants.reviveTokens} revive token(s) on clear.</p>
          ) : null}
          {!cleared && (onClear || onSetNext) && (
            <div className="milestone-card-actions">
              {onClear && (
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
              {onSetNext && (
                <button
                  className="secondary"
                  onClick={(e) => {
                    e.stopPropagation();
                    onSetNext();
                  }}
                >
                  {isPinnedNext ? 'Unpin — follow suggested order' : 'Fight this next (sets level cap)'}
                </button>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
