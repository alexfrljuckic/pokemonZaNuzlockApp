import type { RunState } from '@nuzlocke/engine';
import { SpriteImg } from '../SpriteImg';

/** The Pokémon (if any) currently owned that were caught in this area. */
export function caughtHere(areaId: string, state: RunState) {
  return Object.values(state.pokemon).filter((p) => p.origin?.areaId === areaId);
}

export function CaughtHere({ areaId, state }: { areaId: string; state: RunState }) {
  const mons = caughtHere(areaId, state);
  if (mons.length === 0) return null;
  return (
    <div className="route-caught-here">
      {mons.map((p) => (
        <div key={p.id} className="route-caught-mon">
          <SpriteImg species={p.species} size={48} shiny={p.shiny} className={p.status === 'dead' ? 'sprite-dead' : ''} />
          <div className="poke-detail-summary">
            <strong>
              {p.nickname}
              {p.shiny && <span className="shiny-star" title="Shiny"> ✦</span>}
            </strong>
            <span className="muted">
              {p.species} · Lv {p.level} · {p.status === 'dead' ? 'fainted' : p.status}
              {p.heldItem ? ` · ${p.heldItem}` : ''}
            </span>
          </div>
        </div>
      ))}
    </div>
  );
}
