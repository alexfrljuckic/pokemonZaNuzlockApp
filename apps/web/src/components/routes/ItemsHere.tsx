import type { Area, AreaItem, RunState } from '@nuzlocke/engine';
import { appendEvent } from '../../lib/db';

function appliesTo(i: AreaItem, version: string): boolean {
  return !i.conditions?.version || i.conditions.version.includes(version);
}

const isMachine = (name: string) => /^(TM|TR|HM)\d/i.test(name);

/** Fixed item pickups in this area — always visible (Alex: no collapse),
 * each chip clickable to mark picked up (audited item_picked / item_reset
 * events, same shape as trainer tracking). Omit runId/onChange for
 * read-only. Renders nothing when the dataset has no item data here. */
export function ItemsHere({
  area,
  version,
  state,
  runId,
  onChange,
}: {
  area: Area;
  version: string;
  state?: RunState;
  runId?: string;
  onChange?: () => Promise<void>;
}) {
  const items = (area.items ?? [])
    .map((item, index) => ({ item, index }))
    .filter(({ item }) => appliesTo(item, version));
  if (items.length === 0) return null;
  const canMark = runId != null && onChange != null;
  const picked = (index: number) => state?.itemsPicked.includes(`${area.id}#${index}`) ?? false;
  const pickedCount = items.filter(({ index }) => picked(index)).length;

  async function toggle(index: number, name: string) {
    if (!canMark) return;
    await appendEvent(runId, {
      type: picked(index) ? 'item_reset' : 'item_picked',
      payload: { areaId: area.id, itemIndex: index, ...(picked(index) ? {} : { name }) },
    } as never);
    await onChange();
  }

  return (
    <div className="items-group">
      <div className="items-header">
        <h3 className="chart-heading">Items</h3>
        <span className={`items-count${pickedCount === items.length ? ' done' : ''}`}>
          {pickedCount}/{items.length} picked up
        </span>
      </div>
      <ul className="items-list">
        {items.map(({ item, index }) => (
          <li key={`${item.name}-${index}`}>
            <button
              type="button"
              className={`item-chip${item.hidden ? ' item-hidden' : ''}${isMachine(item.name) ? ' item-machine' : ''}${picked(index) ? ' item-picked' : ''}`}
              disabled={!canMark}
              onClick={() => toggle(index, item.name)}
              title={canMark ? (picked(index) ? 'Unmark picked up' : 'Mark picked up') : undefined}
            >
              {picked(index) && <span className="item-tick">✓</span>}
              {item.name}
              {item.quantity ? <span className="item-qty">×{item.quantity}</span> : null}
              {item.hidden && <span className="item-hidden-tag">hidden</span>}
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
}
