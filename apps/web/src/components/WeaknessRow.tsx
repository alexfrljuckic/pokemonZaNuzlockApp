import { weaknesses } from '../lib/typeChart';
import { TypeBadge } from './TypeBadge';

/** "Weak to" badge row for a defending type combo (≥2× multipliers, ×4
 * flagged). Renders nothing when there are no weaknesses. Shared by MonCard
 * and MilestoneCard detail views. */
export function WeaknessRow({ types }: { types: string[] }) {
  const weak = weaknesses(types);
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
}
