import type { Area, AreaItem } from '@nuzlocke/engine';

function appliesTo(i: AreaItem, version: string): boolean {
  return !i.conditions?.version || i.conditions.version.includes(version);
}

const isMachine = (name: string) => /^(TM|TR|HM)\d/i.test(name);

/** Fixed item pickups in this area — display-only route intel (sourced;
 * shops, renewables and quest rewards excluded at research time). Collapsed
 * by default since item-heavy dungeons list dozens; the summary row matches
 * the Trainers section header language. Renders nothing when the dataset
 * has no item data here. */
export function ItemsHere({ area, version }: { area: Area; version: string }) {
  const items = (area.items ?? []).filter((i) => appliesTo(i, version));
  if (items.length === 0) return null;
  const machines = items.filter((i) => isMachine(i.name)).length;
  return (
    <details className="items-group">
      <summary>
        <h3 className="chart-heading">Items</h3>
        <span className="items-count">
          {items.length}
          {machines > 0 ? ` · ${machines} TM` : ''}
        </span>
        <span className="items-caret" aria-hidden>
          ▸
        </span>
      </summary>
      <ul className="items-list">
        {items.map((i, idx) => (
          <li
            key={`${i.name}-${idx}`}
            className={`item-chip${i.hidden ? ' item-hidden' : ''}${isMachine(i.name) ? ' item-machine' : ''}`}
          >
            {i.name}
            {i.quantity ? <span className="item-qty">×{i.quantity}</span> : null}
            {i.hidden && <span className="item-hidden-tag">hidden</span>}
          </li>
        ))}
      </ul>
    </details>
  );
}
