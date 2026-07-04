import { useMemo, useState } from 'react';
import type { Area, RunState } from '@nuzlocke/engine';
import { SINNOH_EDGES, SINNOH_NODES, SINNOH_VIEWBOX, mapNode } from '../lib/sinnohMap';
import { SpriteImg } from './SpriteImg';

type NodeState = 'locked' | 'available' | 'caught' | 'failed' | 'skipped';

function nodeStateFor(area: Area, state: RunState): NodeState {
  const outcome = state.encounterOutcomes[area.id];
  if (outcome) return outcome as NodeState;
  const locked = area.unlockAfter && !state.milestonesCleared.includes(area.unlockAfter);
  return locked ? 'locked' : 'available';
}

/** Unique species present in an area for the active version — the at-a-glance
 * "what lives here" preview (not the ruleset-legal catch pool, which the
 * resolution form computes separately via filterEncounterPool). */
function previewSpecies(area: Area, version: string): string[] {
  const seen = new Set<string>();
  for (const slot of area.encounters) {
    if (slot.conditions?.version && !slot.conditions.version.includes(version)) continue;
    seen.add(slot.species);
  }
  return [...seen];
}

const RADIUS: Record<string, number> = {
  city: 3.2,
  town: 2.6,
  landmark: 2.3,
  forest: 2.3,
  cave: 2.3,
  route: 1.9,
};

export function RouteMap({
  areas,
  state,
  version,
  onSelect,
}: {
  areas: Area[];
  state: RunState;
  version: string;
  onSelect: (areaId: string) => void;
}) {
  const [hovered, setHovered] = useState<string | null>(null);
  // Optional backdrop: drop an image at apps/web/public/maps/sinnoh.png and it
  // renders under the interactive nodes. If absent (404), we fall back to the
  // drawn schematic. Node coordinates are calibrated to whatever backdrop is in
  // place — see sinnohMap.ts.
  const [bgOk, setBgOk] = useState(true);

  const areaById = useMemo(() => new Map(areas.map((a) => [a.id, a])), [areas]);
  const { w, h } = SINNOH_VIEWBOX;

  const hoveredArea = hovered ? areaById.get(hovered) : null;
  const hoveredNode = hovered ? mapNode(hovered) : null;
  const hoveredState = hoveredArea ? nodeStateFor(hoveredArea, state) : null;

  return (
    <div className="route-map">
      <svg viewBox={`0 0 ${w} ${h}`} className="route-map-svg" role="img" aria-label="Sinnoh route map">
        {/* optional image backdrop (see sinnohMap.ts / public/maps) */}
        {bgOk && (
          <image
            href="/maps/sinnoh.png"
            x={0}
            y={0}
            width={w}
            height={h}
            preserveAspectRatio="xMidYMid slice"
            onError={() => setBgOk(false)}
          />
        )}

        {/* connector paths — only when there's no backdrop of its own */}
        {!bgOk &&
          SINNOH_EDGES.map(([from, to]) => {
            const a = mapNode(from);
            const b = mapNode(to);
            if (!a || !b) return null;
            return <line key={`${from}-${to}`} className="route-edge" x1={a.x} y1={a.y} x2={b.x} y2={b.y} />;
          })}

        {/* nodes */}
        {SINNOH_NODES.map((node) => {
          const area = areaById.get(node.id);
          if (!area) return null;
          const st = nodeStateFor(area, state);
          const r = RADIUS[node.kind] ?? 2;
          const interactive = st === 'available';
          return (
            <g
              key={node.id}
              className={`route-node route-node-${st} route-kind-${node.kind}`}
              transform={`translate(${node.x} ${node.y})`}
              tabIndex={interactive ? 0 : -1}
              role={interactive ? 'button' : undefined}
              aria-label={`${area.name}${interactive ? ' — resolve encounter' : ` (${st})`}`}
              onMouseEnter={() => setHovered(node.id)}
              onMouseLeave={() => setHovered((h) => (h === node.id ? null : h))}
              onFocus={() => setHovered(node.id)}
              onBlur={() => setHovered((h) => (h === node.id ? null : h))}
              onClick={() => interactive && onSelect(node.id)}
              onKeyDown={(e) => {
                if (interactive && (e.key === 'Enter' || e.key === ' ')) {
                  e.preventDefault();
                  onSelect(node.id);
                }
              }}
            >
              <circle className="route-node-dot" r={r} />
              {st === 'locked' && <text className="route-node-glyph" y={r * 0.55}>🔒</text>}
              {st === 'caught' && <text className="route-node-glyph" y={r * 0.55}>✓</text>}
              {st === 'failed' && <text className="route-node-glyph" y={r * 0.55}>✕</text>}
              {st === 'skipped' && <text className="route-node-glyph" y={r * 0.55}>–</text>}
            </g>
          );
        })}
      </svg>

      {hoveredArea && hoveredNode && (
        <div
          className="route-tip"
          style={{ left: `${(hoveredNode.x / w) * 100}%`, top: `${(hoveredNode.y / h) * 100}%` }}
        >
          <div className="route-tip-head">
            <strong>{hoveredArea.name}</strong>
            <span className={`route-tip-state route-tip-${hoveredState}`}>{hoveredState}</span>
          </div>
          <div className="route-tip-sprites">
            {previewSpecies(hoveredArea, version)
              .slice(0, 12)
              .map((sp) => (
                <span key={sp} className="route-tip-mon" title={sp}>
                  <SpriteImg species={sp} size={32} />
                </span>
              ))}
            {previewSpecies(hoveredArea, version).length === 0 && (
              <span className="muted">No wild encounters</span>
            )}
          </div>
          {hoveredState === 'available' && <div className="route-tip-cta">Click to resolve encounter</div>}
        </div>
      )}
    </div>
  );
}
