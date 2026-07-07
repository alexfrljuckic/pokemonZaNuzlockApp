import type { Area, AreaItem, FieldMove, RunState } from '@nuzlocke/engine';
import { appendEvent } from '../../lib/db';

function appliesTo(i: AreaItem, version: string): boolean {
  return !i.conditions?.version || i.conditions.version.includes(version);
}

const isMachine = (name: string) => /^(TM|TR|HM)\d/i.test(name);

/** Human labels for the field-move (HM) access slugs. */
const FIELD_MOVE_LABEL: Record<FieldMove, string> = {
  surf: 'Surf',
  cut: 'Cut',
  strength: 'Strength',
  'rock-smash': 'Rock Smash',
  waterfall: 'Waterfall',
  'rock-climb': 'Rock Climb',
  defog: 'Defog',
  fly: 'Fly',
  flash: 'Flash',
  whirlpool: 'Whirlpool',
  dive: 'Dive',
};

const moveLabel = (m: FieldMove) => FIELD_MOVE_LABEL[m] ?? m;

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
    if (picked(index)) {
      await appendEvent(runId, { type: 'item_reset', payload: { areaId: area.id, itemIndex: index } });
    } else {
      await appendEvent(runId, { type: 'item_picked', payload: { areaId: area.id, itemIndex: index, name } });
    }
    await onChange();
  }

  const chip = ({ item, index }: { item: AreaItem; index: number }) => {
    const access = item.access ?? [];
    const requires = access.length > 0 ? `Requires ${access.map(moveLabel).join(' + ')}` : '';
    // Tooltip: rough location (area name + any hint) plus the access requirement.
    const locationBits = [area.name, item.locationHint].filter(Boolean).join(' — ');
    const detail = [locationBits, requires].filter(Boolean).join('. ');
    const markLabel = canMark ? (picked(index) ? 'Unmark obtained' : 'Mark obtained') : '';
    const title = [detail, markLabel].filter(Boolean).join(' · ') || undefined;
    return (
      <li key={`${item.name}-${index}`}>
        <button
          type="button"
          className={`item-chip${item.hidden ? ' item-hidden' : ''}${isMachine(item.name) ? ' item-machine' : ''}${picked(index) ? ' item-picked' : ''}`}
          disabled={!canMark}
          onClick={() => toggle(index, item.name)}
          title={title}
          aria-label={requires ? `${item.name}. ${requires}` : undefined}
        >
          {picked(index) && <span className="item-tick">✓</span>}
          {item.name}
          {item.quantity ? <span className="item-qty">×{item.quantity}</span> : null}
          {item.hidden && <span className="item-hidden-tag">hidden</span>}
          {access.map((m) => (
            <span key={m} className="item-access" title={`Requires ${moveLabel(m)} to reach`}>
              {moveLabel(m)}
            </span>
          ))}
        </button>
      </li>
    );
  };

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
