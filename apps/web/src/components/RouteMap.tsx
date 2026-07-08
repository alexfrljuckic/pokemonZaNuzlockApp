import { useEffect, useMemo, useRef, useState } from 'react';
import { frontierAreas, type Area, type Milestone, type RunState } from '@nuzlocke/engine';
import { mapHelpers, type GameMap, type MapNode } from '../lib/maps';
import { SpriteImg } from './SpriteImg';

type NodeState = 'locked' | 'available' | 'caught' | 'failed' | 'skipped';

function nodeStateFor(area: Area, state: RunState): NodeState {
  const outcome = state.encounterOutcomes[area.id];
  if (outcome) return outcome as NodeState;
  // Routes are never locked in the UI — every area is interactable at any time.
  return 'available';
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

const MAX_ZOOM = 8;
// Auto-fit-to-frontier zoom is kept in a comfortable band: always zoom in a
// little (MIN), but never slam to max on a single small area (the player can
// still pinch/zoom to MAX_ZOOM by hand).
const MIN_AUTO_ZOOM = 1.9;
const MAX_AUTO_ZOOM = 3.5;

type MapView = { x: number; y: number; scale: number };

/** A map node that stands for a whole group of sub-areas (PLA zones) rather
 * than one area — clicking it browses the zone instead of resolving. */
export interface ZoneSummary {
  id: string;
  name: string;
  resolved: number;
  total: number;
}

export function RouteMap({
  map,
  areas,
  state,
  version,
  milestones,
  onSelect,
  zones,
  onSelectZone,
}: {
  map: GameMap;
  areas: Area[];
  state: RunState;
  version: string;
  /** dataset milestones, for the frontier's progression (unlock-tier) ordering */
  milestones: Milestone[];
  onSelect: (areaId: string) => void;
  /** zone-id → summary, for maps whose nodes are zone groups (PLA) */
  zones?: Map<string, ZoneSummary>;
  onSelectZone?: (zoneId: string) => void;
}) {
  const [hovered, setHovered] = useState<string | null>(null);
  // On touch there is no hover, so the first tap opens the preview tip and a
  // second tap on the same region resolves — otherwise mobile users never see
  // the species/catch-rate preview desktop users get for free.
  const [tapPreview, setTapPreview] = useState(false);
  const lastPointerType = useRef('mouse');
  // Optional backdrop: drop an image at public/maps/<map.backdropSrc> and it
  // renders under the interactive regions. If absent (404), we fall back to
  // drawing visible region boxes + connector edges. Region geometry is
  // calibrated to whatever backdrop is in place — see lib/maps/*.
  const [bgOk, setBgOk] = useState(true);

  const { mapNode } = useMemo(() => mapHelpers(map), [map]);
  const areaById = useMemo(() => new Map(areas.map((a) => [a.id, a])), [areas]);
  // "up next" window: progresses as areas resolve, not just on milestones
  // Scope the "up next" window to areas that are ON THIS MAP — otherwise off-map
  // areas (BDSP's Grand Underground, on a separate toggled map) flood the window
  // and the overworld highlight goes dark even though routes are still available.
  const nodeIds = useMemo(() => new Set(map.nodes.map((n) => n.id)), [map]);
  const frontier = useMemo(
    () => frontierAreas(areas.filter((a) => nodeIds.has(a.id)), state, milestones),
    [areas, state, milestones, nodeIds],
  );
  const { w, h } = map.viewBox;

  // Zoom + pan via the SVG viewBox, so the whole map always fits the screen
  // at rest (crucial on phones) and regions become finger-sized when zoomed.
  // scale 1 = full map; pan clamps inside the map bounds.
  const svgRef = useRef<SVGSVGElement>(null);
  const [view, setView] = useState<MapView>({ x: 0, y: 0, scale: 1 });
  const viewRef = useRef(view);
  // pointerId -> last position + gesture start, for drag-pan and pinch-zoom
  const pointers = useRef(new Map<number, { x: number; y: number; startX: number; startY: number }>());
  // set once a gesture moved past the tap threshold; suppresses the click
  const dragging = useRef(false);

  const clampView = (v: MapView): MapView => {
    const scale = Math.min(Math.max(v.scale, 1), MAX_ZOOM);
    const vw = w / scale;
    const vh = h / scale;
    return {
      scale,
      x: Math.min(Math.max(v.x, 0), w - vw),
      y: Math.min(Math.max(v.y, 0), h - vh),
    };
  };

  /** A view fitting the given nodes' bounding box (plus padding), centered —
   * used to land zoomed in on the "up next" frontier instead of the whole map. */
  const fitToNodes = (ns: MapNode[]): MapView => {
    const minX = Math.min(...ns.map((n) => n.x));
    const minY = Math.min(...ns.map((n) => n.y));
    const maxX = Math.max(...ns.map((n) => n.x + n.w));
    const maxY = Math.max(...ns.map((n) => n.y + n.h));
    const pad = 0.35; // breathing room around the frontier so it isn't edge-to-edge
    const bw = (maxX - minX) * (1 + pad * 2) || w;
    const bh = (maxY - minY) * (1 + pad * 2) || h;
    // Always land zoomed in (MIN_AUTO_ZOOM) even when the frontier is spread out
    // early on — centre on it so the "up next" region fills the view; the player
    // pans/resets to see the rest.
    const scale = Math.max(MIN_AUTO_ZOOM, Math.min(MAX_AUTO_ZOOM, Math.min(w / bw, h / bh)));
    return clampView({ scale, x: (minX + maxX) / 2 - w / scale / 2, y: (minY + maxY) / 2 - h / scale / 2 });
  };

  // Land the view on the "up next" frontier area(s) — zoomed in on where you
  // are, not the whole map. Full map when there's no frontier (fresh/all done).
  // Keyed on `map` only, so it sets the initial view without fighting the
  // user's later manual pan/zoom as areas resolve.
  useEffect(() => {
    const fnodes = map.nodes.filter((n) => frontier.has(n.id));
    // Only maps that opt in (Galar's awkward triptych) land pre-zoomed on the
    // frontier; every other map opens fully zoomed-out at rest.
    const initial =
      map.autoZoomToFrontier && fnodes.length ? fitToNodes(fnodes) : { x: 0, y: 0, scale: 1 };
    viewRef.current = initial;
    setView(initial);
    pointers.current.clear();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [map]);

  const applyView = (v: MapView) => {
    const next = clampView(v);
    viewRef.current = next;
    setView(next);
  };

  /** Zoom by `factor`, keeping the map point under (clientX, clientY) fixed;
   * without a client point, zoom on the current center. */
  const zoomBy = (factor: number, clientX?: number, clientY?: number) => {
    const cur = viewRef.current;
    const scale = Math.min(Math.max(cur.scale * factor, 1), MAX_ZOOM);
    const vw = w / cur.scale;
    const vh = h / cur.scale;
    const nw = w / scale;
    const nh = h / scale;
    const rect = svgRef.current?.getBoundingClientRect();
    // fraction of the viewport the anchor point sits at (default: center)
    const fx = rect && clientX != null ? (clientX - rect.left) / rect.width : 0.5;
    const fy = rect && clientY != null ? (clientY - rect.top) / rect.height : 0.5;
    applyView({
      scale,
      x: cur.x + fx * vw - fx * nw,
      y: cur.y + fy * vh - fy * nh,
    });
  };

  const onPointerDown = (e: React.PointerEvent<SVGSVGElement>) => {
    lastPointerType.current = e.pointerType;
    pointers.current.set(e.pointerId, { x: e.clientX, y: e.clientY, startX: e.clientX, startY: e.clientY });
    if (pointers.current.size === 1) dragging.current = false;
    // A second finger is always a pinch — capture both so the gesture
    // survives leaving the element. (Single pointers are only captured once
    // they cross the tap threshold, so plain taps still click regions.)
    if (pointers.current.size === 2) {
      for (const id of pointers.current.keys()) {
        try {
          svgRef.current?.setPointerCapture(id);
        } catch {
          /* pointer may already be up */
        }
      }
      dragging.current = true;
    }
  };

  const onPointerMove = (e: React.PointerEvent<SVGSVGElement>) => {
    const pts = pointers.current;
    const prev = pts.get(e.pointerId);
    if (!prev) return;

    if (pts.size === 1) {
      const moved = Math.hypot(e.clientX - prev.startX, e.clientY - prev.startY);
      if (!dragging.current && moved > 8) {
        dragging.current = true;
        try {
          svgRef.current?.setPointerCapture(e.pointerId);
        } catch {
          /* ignore */
        }
      }
      if (dragging.current && viewRef.current.scale > 1) {
        const rect = svgRef.current?.getBoundingClientRect();
        if (rect) {
          const cur = viewRef.current;
          const vw = w / cur.scale;
          const vh = h / cur.scale;
          applyView({
            ...cur,
            x: cur.x - ((e.clientX - prev.x) * vw) / rect.width,
            y: cur.y - ((e.clientY - prev.y) * vh) / rect.height,
          });
        }
      }
      pts.set(e.pointerId, { ...prev, x: e.clientX, y: e.clientY });
    } else if (pts.size === 2) {
      const [idA, idB] = [...pts.keys()];
      const a = pts.get(idA)!;
      const b = pts.get(idB)!;
      const before = Math.hypot(a.x - b.x, a.y - b.y);
      pts.set(e.pointerId, { ...prev, x: e.clientX, y: e.clientY });
      const a2 = pts.get(idA)!;
      const b2 = pts.get(idB)!;
      const after = Math.hypot(a2.x - b2.x, a2.y - b2.y);
      if (before > 0 && after > 0) {
        zoomBy(after / before, (a2.x + b2.x) / 2, (a2.y + b2.y) / 2);
      }
    }
  };

  const onPointerEnd = (e: React.PointerEvent<SVGSVGElement>) => {
    pointers.current.delete(e.pointerId);
    // dragging stays set until the trailing click is suppressed
  };

  // Browsers emulate mouseenter/focus on tap, which would skip the
  // tap-to-preview step — so hover-in ignores touch (pointerdown has already
  // recorded the pointer type by the time these fire).
  const hoverIn = (id: string) => {
    if (lastPointerType.current === 'touch') return;
    setTapPreview(false);
    setHovered(id);
  };
  const hoverOut = (id: string) => setHovered((cur) => (cur === id ? null : cur));

  /** Mouse/keyboard activates a region immediately; on touch the first tap
   * opens its preview tip and a second tap on the same region activates. */
  const tapOrActivate = (id: string, activate: () => void) => {
    if (lastPointerType.current === 'touch') {
      if (hovered !== id) {
        setTapPreview(true);
        setHovered(id);
        return;
      }
      setHovered(null);
    }
    activate();
  };

  const hoveredArea = hovered ? areaById.get(hovered) : null;
  const hoveredZone = hovered && !hoveredArea ? zones?.get(hovered) : null;
  const hoveredNode = hovered ? mapNode(hovered) : null;
  const hoveredState = hoveredArea ? nodeStateFor(hoveredArea, state) : null;

  const vw = w / view.scale;
  const vh = h / view.scale;
  const zoomed = view.scale > 1.001;
  const tipVisible =
    hoveredNode &&
    hoveredNode.x + hoveredNode.w / 2 >= view.x &&
    hoveredNode.x + hoveredNode.w / 2 <= view.x + vw &&
    hoveredNode.y + hoveredNode.h / 2 >= view.y &&
    hoveredNode.y + hoveredNode.h / 2 <= view.y + vh;
  // clamp horizontally so edge-region tips (max-width 220px, centered) never
  // spill outside the map container on narrow phones
  const tipStyle = hoveredNode
    ? {
        left: `clamp(110px, ${(((hoveredNode.x + hoveredNode.w / 2) - view.x) / vw) * 100}%, calc(100% - 110px))`,
        top: `${((hoveredNode.y - view.y) / vh) * 100}%`,
      }
    : undefined;

  return (
    <div className="route-map">
      <svg
        ref={svgRef}
        viewBox={`${view.x} ${view.y} ${vw} ${vh}`}
        className={`route-map-svg${bgOk ? '' : ' route-map-no-bg'}${zoomed ? ' route-map-zoomed' : ''}`}
        // When zoomed, one finger pans the map, so claim all touches; at rest
        // let vertical swipes keep scrolling the page (pinch still reaches us).
        style={{ aspectRatio: `${w} / ${h}`, touchAction: zoomed ? 'none' : 'pan-y' }}
        role="img"
        aria-label={map.ariaLabel}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerEnd}
        onPointerCancel={onPointerEnd}
        onKeyDown={() => {
          // keyboard navigation after a tap: focus tips come back
          lastPointerType.current = 'key';
        }}
        onClickCapture={(e) => {
          if (dragging.current) {
            e.preventDefault();
            e.stopPropagation();
            dragging.current = false;
          }
        }}
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
          if (!area) {
            // Zone node (PLA): stands for a group of sub-areas — clicking it
            // browses the zone in the list below instead of resolving.
            const zone = zones?.get(node.id);
            if (!zone || !onSelectZone) return null;
            const done = zone.total > 0 && zone.resolved >= zone.total;
            return (
              <g
                key={node.id}
                className={`route-region-g route-region-zone route-region-${done ? 'caught' : 'available'}`}
                tabIndex={0}
                role="button"
                aria-label={`${zone.name} — browse ${zone.total} areas (${zone.resolved} resolved)`}
                onMouseEnter={() => hoverIn(node.id)}
                onMouseLeave={() => hoverOut(node.id)}
                onFocus={() => hoverIn(node.id)}
                onBlur={() => hoverOut(node.id)}
                onClick={() => tapOrActivate(node.id, () => onSelectZone(node.id))}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    onSelectZone(node.id);
                  }
                }}
              >
                <rect className="route-region" x={node.x} y={node.y} width={node.w} height={node.h} rx={10} />
                <g className="route-region-badge" transform={`translate(${node.x + node.w - 26} ${node.y + 14})`}>
                  <rect x={-22} y={-11} width={46} height={22} rx={11} className="route-zone-count-bg" />
                  <text y={4.5} fontSize={13}>{`${zone.resolved}/${zone.total}`}</text>
                </g>
              </g>
            );
          }
          const st = nodeStateFor(area, state);
          // any unlocked area is clickable — available opens the encounter
          // picker, a resolved one opens its outcome + reset.
          const interactive = st !== 'locked';
          const badge = BADGE_GLYPH[st];
          // "up next" glow: the sliding frontier window on normal maps, or every
          // unresolved node on busy-backdrop maps (Grand Underground) so they're
          // findable.
          const upNext = map.highlightAllNodes ? st === 'available' : frontier.has(area.id);
          return (
            <g
              key={node.id}
              className={`route-region-g route-region-${st}${upNext ? ' route-region-frontier' : ''}`}
              tabIndex={interactive ? 0 : -1}
              role={interactive ? 'button' : undefined}
              aria-label={`${area.name}${interactive ? ' — resolve encounter' : ` (${st})`}`}
              onMouseEnter={() => hoverIn(node.id)}
              onMouseLeave={() => hoverOut(node.id)}
              onFocus={() => hoverIn(node.id)}
              onBlur={() => hoverOut(node.id)}
              onClick={() => interactive && tapOrActivate(node.id, () => onSelect(node.id))}
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

      <div className="route-map-controls" role="group" aria-label="Map zoom">
        <button type="button" aria-label="Zoom in" disabled={view.scale >= MAX_ZOOM} onClick={() => zoomBy(1.6)}>
          +
        </button>
        <button type="button" aria-label="Zoom out" disabled={!zoomed} onClick={() => zoomBy(1 / 1.6)}>
          −
        </button>
        <button
          type="button"
          aria-label="Reset zoom"
          disabled={!zoomed}
          onClick={() => applyView({ x: 0, y: 0, scale: 1 })}
        >
          ⛶
        </button>
      </div>

      <ul className="route-map-legend" aria-label="Map legend">
        <li>
          <span className="rlg-swatch rlg-frontier" aria-hidden="true" /> Up next
        </li>
        <li>
          <span className="rlg-swatch rlg-available" aria-hidden="true" /> Available
        </li>
        <li>
          <span className="rlg-swatch rlg-caught" aria-hidden="true">
            ✓
          </span>{' '}
          Caught
        </li>
        <li>
          <span className="rlg-swatch rlg-failed" aria-hidden="true">
            ✕
          </span>{' '}
          Fled / fainted
        </li>
        <li>
          <span className="rlg-swatch rlg-skipped" aria-hidden="true">
            –
          </span>{' '}
          Skipped
        </li>
      </ul>

      {hoveredArea && hoveredNode && tipVisible && (
        <div className="route-tip" style={tipStyle}>
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
          {hoveredState === 'available' && (
            <div className="route-tip-cta">{tapPreview ? 'Double-tap to resolve encounter' : 'Click to resolve encounter'}</div>
          )}
        </div>
      )}

      {hoveredZone && hoveredNode && tipVisible && (
        <div className="route-tip" style={tipStyle}>
          <div className="route-tip-head">
            <strong>{hoveredZone.name}</strong>
            <span className="route-tip-state">
              {hoveredZone.resolved}/{hoveredZone.total} areas
            </span>
          </div>
          <div className="route-tip-cta">
            {tapPreview ? "Double-tap to browse this zone's areas" : "Click to browse this zone's areas"}
          </div>
        </div>
      )}
    </div>
  );
}
