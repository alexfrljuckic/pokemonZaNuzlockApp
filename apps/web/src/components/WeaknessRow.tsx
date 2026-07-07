import { immunities, resistances, weaknesses } from '../lib/typeChart';
import { TypeBadge } from './TypeBadge';

/** Type-matchup rows for a defending type combo. Shows what the mon is Weak to
 * (≥2×, ×4 flagged), what it Resists (½× / ¼×, ¼ flagged), and what it's Immune
 * to (×0). Neutral (×1) types are omitted; empty groups render nothing. Shared
 * by MonCard, MilestoneCard and TrainersHere detail views. */
export function WeaknessRow({ types }: { types: string[] }) {
  const weak = weaknesses(types);
  const resist = resistances(types);
  const immune = immunities(types);
  if (weak.length === 0 && resist.length === 0 && immune.length === 0) return null;
  return (
    <div className="mrd-matchups">
      {weak.length > 0 && (
        <div className="mrd-weak mrd-mu-weak">
          <span className="mrd-weak-label muted">Weak to</span>
          {weak.map((w) => (
            <span key={w.type} className="mrd-weak-item">
              <TypeBadge type={w.type} />
              {w.x >= 4 && <span className="mrd-weak-x">×4</span>}
            </span>
          ))}
        </div>
      )}
      {resist.length > 0 && (
        <div className="mrd-weak mrd-mu-resist">
          <span className="mrd-weak-label muted">Resists</span>
          {resist.map((r) => (
            <span key={r.type} className="mrd-weak-item">
              <TypeBadge type={r.type} />
              {r.x <= 0.25 && <span className="mrd-resist-x">×¼</span>}
            </span>
          ))}
        </div>
      )}
      {immune.length > 0 && (
        <div className="mrd-weak mrd-mu-immune">
          <span className="mrd-weak-label muted">Immune to</span>
          {immune.map((i) => (
            <span key={i.type} className="mrd-weak-item">
              <TypeBadge type={i.type} />
            </span>
          ))}
        </div>
      )}
    </div>
  );
}
