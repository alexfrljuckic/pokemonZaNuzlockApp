import type { Area, AreaItem } from '@nuzlocke/engine';

function appliesTo(i: AreaItem, version: string): boolean {
  return !i.conditions?.version || i.conditions.version.includes(version);
}

/** Fixed item pickups in this area — display-only route intel (sourced;
 * shops, renewables and quest rewards excluded at research time). Collapsed
 * by default since item-heavy dungeons list dozens. Renders nothing when the
 * dataset has no item data here. */
export function ItemsHere({ area, version }: { area: Area; version: string }) {
  const items = (area.items ?? []).filter((i) => appliesTo(i, version));
  if (items.length === 0) return null;
  return (
    <details className="items-group">
      <summary className="muted specials-group-label">Items here ({items.length})</summary>
      <ul className="items-list">
        {items.map((i, idx) => (
          <li key={`${i.name}-${idx}`} className={i.hidden ? 'item-hidden' : undefined}>
            {i.name}
            {i.quantity ? <span className="item-qty">×{i.quantity}</span> : null}
            {i.hidden && <span className="item-hidden-tag">hidden</span>}
          </li>
        ))}
      </ul>
    </details>
  );
}
