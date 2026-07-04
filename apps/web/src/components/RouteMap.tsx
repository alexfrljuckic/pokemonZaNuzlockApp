import { useMemo, useState } from 'react';
import type { Area, RunState } from '@nuzlocke/engine';
import { mapHelpers, type GameMap } from '../lib/maps';
import { SpriteImg } from './SpriteImg';

type NodeState = 'locked' | 'available' | 'caught' | 'failed' | 'skipped';

function nodeStateFor(area: Area, state: RunState): NodeState {
  const outcome = state.encounterOutcomes[area.id];
  if (outcome) return outcome as NodeState;
  // Routes are never locked in the UI — every area is interactable at any time.
  return 'available';
}

/** Areas that just opened up per the story's `unlockAfter` gating — a light
 * "next approximate routes" hint, not an enforced lock. An area counts as
 * frontier if it's unresolved and either has no gate (and nothing's been
 * cleared yet) or its gate is the most recently cleared milestone. */
export function isFrontier(area: Area, state: RunState): boolean {
  if (state.encounterOutcomes[area.id]) return false;
  const cleared = state.milestonesCleared;
  if (cleared.length === 0) return area.unlockAfter == null;
  return area.unlockAfter === cleared[cleared.length - 1];
}

/** Unique species present in an area for the active version, with best rate —
 * the at-a-glance "what lives here" preview (not the ruleset-legal catch pool,
 * which the resolution form computes separately via filterEncounterPool). */
function previewSpecies(area: Area, version: string): { species: string; rate?: number }[] {
  const byId = new Map<string, number | undefined>();
  for (const slot of area.encounters) {
    if (slot.conditions?.version && !slot.conditions.version.includes(version)) continue;
    const prev = byId.get(slot.species);
    byId.set(slot.species, slot.rate != null ? Math.max(prev ?? 0, slot.rate) : prev);
  }
  return [...byId].map(([species, rate]) => ({ species, rate }));
}

const BADGE_GLYPH: Partial<Record<NodeState, string>> = {
  caught: '✓',
  failed: '✕',
  skipped: '–',
};

export function RouteMap({
  map,
  areas,
  state,
  version,
  onSelect,
}: {
  map: GameMap;
  areas: Area[];
  state: RunState;
  version: string;
  onSelect: (areaId: string) => void;
}) {
  const [hovered, setHovered] = useState<string | null>(null);
  // Optional backdrop: drop an image at public/maps/<map.backdropSrc> and it
  // renders under the interactive regions. If absent (404), we fall back to
  // drawing visible region boxes + connector edges. Region geometry is
  // calibrated to whatever backdrop is in place — see lib/maps/*.
  const [bgOk, setBgOk] = useState(true);

  const { mapNode } = useMemo(() => mapHelpers(map), [map]);
  const areaById = useMemo(() => new Map(areas.map((a) => [a.id, a])), [areas]);
  const { w, h } = map.viewBox;

  const hoveredArea = hovered ? areaById.get(hovered) : null;
  const hoveredNode = hovered ? mapNode(hovered) : null;
  const hoveredState = hoveredArea ? nodeStateFor(hoveredArea, state) : null;

  return (
    <div className="route-map">
      <svg
        viewBox={`0 0 ${w} ${h}`}
        className={`route-map-svg${bgOk ? '' : ' route-map-no-bg'}`}
        role="img"
        aria-label={map.ariaLabel}
      >
        {/* optional image backdrop (see lib/maps / public/maps) */}
        {bgOk && (
          <image
            href={map.backdropSrc}
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
          map.edges.map(([from, to]) => {
            const a = mapNode(from);
            const b = mapNode(to);
            if (!a || !b) return null;
            return (
              <line
                key={`${from}-${to}`}
                className="route-edge"
                x1={a.x + a.w / 2}
                y1={a.y + a.h / 2}
                x2={b.x + b.w / 2}
                y2={b.y + b.h / 2}
              />
            );
          })}

        {/* area regions — blend with the art at rest, highlight on hover */}
        {map.nodes.map((node) => {
          const area = areaById.get(node.id);
          if (!area) return null;
          const st = nodeStateFor(area, state);
          // any unlocked area is clickable — available opens the encounter
          // picker, a resolved one opens its outcome + reset.
          const interactive = st !== 'locked';
          const badge = BADGE_GLYPH[st];
          const frontier = isFrontier(area, state);
          return (
            <g
              key={node.id}
              className={`route-region-g route-region-${st}${frontier ? ' route-region-frontier' : ''}`}
              tabIndex={interactive ? 0 : -1}
              role={interactive ? 'button' : undefined}
              aria-label={`${area.name}${interactive ? ' — resolve encounter' : ` (${st})`}`}
              onMouseEnter={() => setHovered(node.id)}
              onMouseLeave={() => setHovered((cur) => (cur === node.id ? null : cur))}
              onFocus={() => setHovered(node.id)}
              onBlur={() => setHovered((cur) => (cur === node.id ? null : cur))}
              onClick={() => interactive && onSelect(node.id)}
              onKeyDown={(e) => {
                if (interactive && (e.key === 'Enter' || e.key === ' ')) {
                  e.preventDefault();
                  onSelect(node.id);
                }
              }}
            >
              <rect className="route-region" x={node.x} y={node.y} width={node.w} height={node.h} rx={10} />
              {badge && (
                <g className="route-region-badge" transform={`translate(${node.x + node.w - 12} ${node.y + 12})`}>
                  <circle r={11} />
                  <text y={4.5} fontSize={14}>{badge}</text>
                </g>
              )}
            </g>
          );
        })}
      </svg>

      {hoveredArea && hoveredNode && (
        <div
          className="route-tip"
          style={{
            left: `${((hoveredNode.x + hoveredNode.w / 2) / w) * 100}%`,
            top: `${(hoveredNode.y / h) * 100}%`,
          }}
        >
          <div className="route-tip-head">
            <strong>{hoveredArea.name}</strong>
            <span className={`route-tip-state route-tip-${hoveredState}`}>{hoveredState}</span>
          </div>
          <div className="route-tip-sprites">
            {previewSpecies(hoveredArea, version)
              .slice(0, 12)
              .map((e) => (
                <span key={e.species} className="route-tip-mon" title={`${e.species}${e.rate != null ? ` — ${e.rate}%` : ''}`}>
                  <SpriteImg species={e.species} size={32} />
                  {e.rate != null && <span className="route-tip-rate">{e.rate}%</span>}
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
