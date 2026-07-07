import { immunities, resistances, weaknesses } from '../lib/typeChart';
import { TypeBadge } from './TypeBadge';

const MULT: Record<string, string> = { '4': '×4', '2': '×2', '0.5': '×½', '0.25': '×¼' };
/** Two defending types cap the product at {0, ¼, ½, 1, 2, 4}, so the map covers
 * every weak/resist case; the fallback is just belt-and-braces. */
const multLabel = (x: number): string => MULT[String(x)] ?? `×${x}`;

function MatchupRow({
  label,
  tone,
  items,
  showMult,
}: {
  label: string;
  tone: 'weak' | 'resist' | 'immune';
  items: { type: string; x: number }[];
  showMult: boolean;
}) {
  if (items.length === 0) return null;
  return (
    <div className={`mrd-mu-row mrd-mu-${tone}`}>
      <div className="mrd-mu-head">
        <span className="mrd-mu-label">{label}</span>
        <span className="mrd-mu-count">{items.length}</span>
      </div>
      <div className="mrd-mu-chips">
        {items.map((it) => (
          <span key={it.type} className="mrd-mu-chip">
            <TypeBadge type={it.type} />
            {showMult && <span className="mrd-mu-x">{multLabel(it.x)}</span>}
          </span>
        ))}
      </div>
    </div>
  );
}

/** Type-matchup rows for a defending type combo. Shows what the mon is Weak to
 * (×2 / ×4), what it Resists (×½ / ×¼) and what it's Immune to (×0). Each chip
 * carries its multiplier so magnitude is always explicit; the three groups sit
 * in aligned label-column rows so long lists stay readable. Neutral (×1) types
 * are omitted; empty groups render nothing. Shared by MonCard, MilestoneCard
 * and TrainersHere detail views. */
export function WeaknessRow({ types }: { types: string[] }) {
  const weak = weaknesses(types);
  const resist = resistances(types);
  const immune = immunities(types);
  if (weak.length === 0 && resist.length === 0 && immune.length === 0) return null;
  return (
    <div className="mrd-matchups">
      <MatchupRow label="Weak" tone="weak" items={weak} showMult />
      <MatchupRow label="Resists" tone="resist" items={resist} showMult />
      {/* Immunities are always ×0, so the label already says it — no per-chip ×N. */}
      <MatchupRow label="Immune" tone="immune" items={immune} showMult={false} />
    </div>
  );
}
