// Shared shape for a game's schematic interactive map (Routes tab, section E).
// Each game gets its own file (sinnohMap.ts, kantoMap.ts, ...) exporting a
// GameMap of this shape; RouteMap.tsx renders whichever one RoutesTab passes
// in — no map-specific logic lives in the component itself.

export type MapNodeKind = 'city' | 'town' | 'route' | 'cave' | 'landmark' | 'forest';

export interface MapNode {
  id: string; // must match an Area.id in the game's dataset
  x: number; // region top-left, in backdrop pixels
  y: number;
  w: number; // region size — covers the area's section of the map art
  h: number;
  kind: MapNodeKind;
}

export interface GameMap {
  viewBox: { w: number; h: number };
  backdropSrc: string; // e.g. "/maps/sinnoh.png" — 404s gracefully to the schematic fallback
  ariaLabel: string;
  nodes: MapNode[];
  edges: Array<[string, string]>; // decorative wayfinding lines only, not gameplay adjacency
}

export function mapHelpers(map: GameMap) {
  const byId = new Map(map.nodes.map((n) => [n.id, n]));
  return {
    mapNode: (id: string): MapNode | undefined => byId.get(id),
    hasMapNode: (id: string): boolean => byId.has(id),
  };
}
