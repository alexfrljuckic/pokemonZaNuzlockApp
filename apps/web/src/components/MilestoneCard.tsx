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

/** Expandable boss-fight row: one full-width horizontal card — trainer sprite
 * and title left, roster strip center, status + Defeated button right — with
 * full per-mon detail (weaknesses, moves, stat bars) below when expanded.
 * Full-width rows keep the tab organized no matter how many are open at once
 * (grid cards used to reflow around each expanded one).
 *
 * Read-only mode (SpectatorView): omit onClear — the Defeated button
 * disappears, everything else renders identically. */
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
      <div className="milestone-card-main">
        <div className="milestone-card-head">
          {milestone.species ? (
            // Pokémon boss (Z-A rogue megas etc.) — a Pokémon sprite, not a trainer.
            <SpriteImg species={milestone.species} size={60} className="milestone-trainer-sprite" />
          ) : (
            <TrainerSprite
              trainerKey={milestone.trainerSprite ?? trainerKeyFromMilestone(milestone.id)}
              size={60}
              className="milestone-trainer-sprite"
            />
          )}
          <div className="milestone-card-title">
            <strong>{milestone.name}</strong>
            <span className="muted">
              {milestone.type}
              {milestone.aceLevel != null ? ` · ace Lv ${milestone.aceLevel}` : ''}
            </span>
          </div>
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

        <div className="milestone-card-side">
          {cleared && <span className="milestone-cleared-badge">✓ defeated</span>}
          {!cleared && isNext && (
            <span className="milestone-next-badge">{isPinnedNext ? '◎ next (your pick)' : '◎ next'}</span>
          )}
          {/* always-visible defeat action — no need to expand the card first */}
          {!cleared && onClear && (
            <button
              className={isNext ? '' : 'secondary'}
              aria-label={`Mark ${milestone.name} defeated`}
              onClick={(e) => {
                e.stopPropagation();
                onClear();
              }}
            >
              Defeated
            </button>
          )}
        </div>
      </div>

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
            <p className="muted">Grants {milestone.grants.reviveTokens} revive token(s) when defeated.</p>
          ) : null}
          {!cleared && onSetNext && (
            <div className="milestone-card-actions">
              <button
                className={`milestone-setnext${isPinnedNext ? ' pinned' : ''}`}
                title="Sets the level cap to this boss's ace"
                onClick={(e) => {
                  e.stopPropagation();
                  onSetNext();
                }}
              >
                {isPinnedNext ? '◎ Pinned as next — unpin' : '◎ Fight this next'}
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
