import { machineType, moveType } from '../lib/speciesData';
import { TypeDot } from './TypeBadge';

/** Move chip row: type dot + move name (+ per-game TM/HM/TR tag when a gameId
 * is given). Renders nothing for an empty list. Shared by MonCard and
 * MilestoneCard detail views. */
export function MoveChips({ moves, gameId }: { moves?: string[]; gameId?: string }) {
  if (!moves || moves.length === 0) return null;
  return (
    <div className="poke-moves">
      {moves.map((m) => {
        const tag = gameId ? machineType(m, gameId) : null;
        return (
          <span key={m} className="move-chip">
            <TypeDot type={moveType(m)} />
            {m}
            {tag && <span className={`move-tag badge-${tag}`}>{tag}</span>}
          </span>
        );
      })}
    </div>
  );
}
