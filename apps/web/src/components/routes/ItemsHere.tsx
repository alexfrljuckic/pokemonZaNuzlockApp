import type { Area, AreaItem, RunState } from '@nuzlocke/engine';
import { appendEvent } from '../../lib/db';

function appliesTo(i: AreaItem, version: string): boolean {
  return !i.conditions?.version || i.conditions.version.includes(version);
}

const isMachine = (name: string) => /^(TM|TR|HM)\d/i.test(name);

/** Item availability in this area — always visible. Ground/hidden pickups
 * come first and count toward the "n/m picked up" header; shop stock (the
 * `shop` flag) renders in its own group since it's purchasable rather than
 * findable. Every chip is clickable to mark obtained (audited item_picked /
 * item_reset events). Omit runId/onChange for read-only. */
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
  const all = (area.items ?? [])
    .map((item, index) => ({ item, index }))
    .filter(({ item }) => appliesTo(item, version));
  if (all.length === 0) return null;
  const pickups = all.filter(({ item }) => !item.shop);
  const shop = all.filter(({ item }) => item.shop);
  const canMark = runId != null && onChange != null;
  const picked = (index: number) => state?.itemsPicked.includes(`${area.id}#${index}`) ?? false;
  const pickedCount = pickups.filter(({ index }) => picked(index)).length;

  async function toggle(index: number, name: string) {
    if (!canMark) return;
    await appendEvent(runId, {
      type: picked(index) ? 'item_reset' : 'item_picked',
      payload: { areaId: area.id, itemIndex: index, ...(picked(index) ? {} : { name }) },
    } as never);
    await onChange();
  }

  const chip = ({ item, index }: { item: AreaItem; index: number }) => (
    <li key={`${item.name}-${index}`}>
      <button
        type="button"
        className={`item-chip${item.hidden ? ' item-hidden' : ''}${isMachine(item.name) ? ' item-machine' : ''}${picked(index) ? ' item-picked' : ''}`}
        disabled={!canMark}
        onClick={() => toggle(index, item.name)}
        title={canMark ? (picked(index) ? 'Unmark obtained' : 'Mark obtained') : undefined}
      >
        {picked(index) && <span className="item-tick">✓</span>}
        {item.name}
        {item.quantity ? <span className="item-qty">×{item.quantity}</span> : null}
        {item.hidden && <span className="item-hidden-tag">hidden</span>}
      </button>
    </li>
  );

  return (
    <div className="items-group">
      {pickups.length > 0 && (
        <>
          <div className="items-header">
            <h3 className="chart-heading">Items</h3>
            <span className={`items-count${pickedCount === pickups.length ? ' done' : ''}`}>
              {pickedCount}/{pickups.length} picked up
            </span>
          </div>
          <ul className="items-list">{pickups.map(chip)}</ul>
        </>
      )}
      {shop.length > 0 && (
        <>
          <div className="items-header">
            <h3 className="chart-heading">Shops</h3>
            <span className="items-count">{shop.length} in stock</span>
          </div>
          <ul className="items-list">{shop.map(chip)}</ul>
        </>
      )}
    </div>
  );
}
