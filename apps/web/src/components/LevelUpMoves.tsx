import { levelUpMovesFor, moveType } from '../lib/speciesData';
import { TypeDot } from './TypeBadge';

/** Collapsible level-up learnset for a species in a game: every move with the
 * level it's learned at, moves already reachable at `atLevel` highlighted.
 * Renders nothing when the game has no learnset data (Z-A) — absence means
 * "unknown", and an empty box would read as "learns nothing". */
export function LevelUpMoves({ species, gameId, atLevel }: { species: string; gameId: string; atLevel?: number }) {
  const learnset = levelUpMovesFor(species, gameId);
  if (learnset.length === 0) return null;
  // Cap the column count by the list length so each column is ~4 rows tall
  // (short learnsets otherwise spread into stubby 2-row columns that zig-zag);
  // column-width in CSS still caps this down further on narrow screens.
  const columnCount = Math.min(4, Math.ceil(learnset.length / 4));
  return (
    <details className="levelup-moves">
      <summary className="muted">Level-up moves ({learnset.length})</summary>
      <ul style={{ columnCount }}>
        {learnset.map(({ move, level }) => (
          <li key={move} className={atLevel != null && level <= atLevel ? 'levelup-known' : undefined}>
            <span className="levelup-lv">Lv {level}</span>
            <TypeDot type={moveType(move)} />
            {move}
          </li>
        ))}
      </ul>
    </details>
  );
}
