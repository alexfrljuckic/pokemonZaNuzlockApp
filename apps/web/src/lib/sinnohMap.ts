// Schematic Sinnoh layout for the BDSP interactive map (UX-OVERHAUL section E).
//
// IP-safe: these are our own approximate coordinates on a normalized 100x140
// portrait grid (x → right, y → down), NOT ripped game-map art. Positions
// evoke Sinnoh's real geography (Twinleaf south, Snowpoint far north, Battle
// Zone post-game cluster NE) closely enough to be navigable, no more.
//
// Only overworld areas get a node here. Areas absent from NODES (Grand
// Underground + its hideaways) are rendered in a supplemental list below the
// map by RoutesTab — they have no meaningful overworld position.

export type MapNodeKind = 'city' | 'town' | 'route' | 'cave' | 'landmark' | 'forest';

export interface MapNode {
  id: string; // must match an Area.id in bdsp.json
  x: number; // 0..100
  y: number; // 0..140
  kind: MapNodeKind;
}

export const SINNOH_VIEWBOX = { w: 100, h: 140 };

// Ordered roughly south → north so the SVG paint order reads sensibly.
export const SINNOH_NODES: MapNode[] = [
  // — Southern start —
  { id: 'lake-verity', x: 16, y: 129, kind: 'landmark' },
  { id: 'route-201', x: 30, y: 126, kind: 'route' },
  { id: 'route-202', x: 34, y: 112, kind: 'route' },
  { id: 'route-203', x: 49, y: 108, kind: 'route' },
  { id: 'oreburgh-gate', x: 59, y: 111, kind: 'cave' },
  { id: 'oreburgh-mine', x: 68, y: 114, kind: 'cave' },
  { id: 'ramanas-park', x: 20, y: 116, kind: 'landmark' },

  // — Mid-west / Floaroma / Eterna —
  { id: 'route-204-south', x: 34, y: 98, kind: 'route' },
  { id: 'route-205-south', x: 30, y: 84, kind: 'route' },
  { id: 'valley-windworks', x: 22, y: 92, kind: 'landmark' },
  { id: 'floaroma-meadow', x: 20, y: 76, kind: 'landmark' },
  { id: 'eterna-forest', x: 34, y: 68, kind: 'forest' },
  { id: 'old-chateau', x: 41, y: 63, kind: 'landmark' },
  { id: 'eterna-city', x: 40, y: 56, kind: 'city' },
  { id: 'route-206', x: 46, y: 68, kind: 'route' },

  // — West coast —
  { id: 'canalave-city', x: 13, y: 66, kind: 'city' },
  { id: 'iron-island', x: 6, y: 76, kind: 'cave' },
  { id: 'route-218', x: 18, y: 84, kind: 'route' },

  // — Central spine —
  { id: 'mt-coronet', x: 52, y: 58, kind: 'cave' },
  { id: 'hearthome-city', x: 58, y: 74, kind: 'city' },
  { id: 'amity-square', x: 64, y: 70, kind: 'landmark' },
  { id: 'lost-tower', x: 68, y: 80, kind: 'landmark' },

  // — East —
  { id: 'solaceon-town', x: 72, y: 66, kind: 'town' },
  { id: 'solaceon-ruins', x: 78, y: 62, kind: 'cave' },

  // — Toward Pastoria (SE-central) —
  { id: 'route-215', x: 54, y: 84, kind: 'route' },
  { id: 'trophy-garden', x: 54, y: 96, kind: 'landmark' },
  { id: 'route-214', x: 62, y: 90, kind: 'route' },
  { id: 'route-213', x: 68, y: 96, kind: 'route' },
  { id: 'great-marsh', x: 72, y: 100, kind: 'landmark' },
  { id: 'lake-valor', x: 80, y: 92, kind: 'landmark' },

  // — SE coast —
  { id: 'route-222', x: 80, y: 80, kind: 'route' },
  { id: 'sunyshore-city', x: 86, y: 82, kind: 'city' },

  // — North (snow) —
  { id: 'route-216', x: 52, y: 44, kind: 'route' },
  { id: 'route-217', x: 50, y: 34, kind: 'route' },
  { id: 'lake-acuity', x: 44, y: 26, kind: 'landmark' },
  { id: 'snowpoint-city', x: 52, y: 22, kind: 'city' },
  { id: 'snowpoint-temple', x: 56, y: 14, kind: 'cave' },

  // — NE post-game (Battle Zone / Victory Road) —
  { id: 'victory-road', x: 70, y: 44, kind: 'cave' },
  { id: 'route-225', x: 74, y: 32, kind: 'route' },
  { id: 'route-230', x: 70, y: 24, kind: 'route' },
  { id: 'route-228', x: 82, y: 26, kind: 'route' },
  { id: 'stark-mountain', x: 88, y: 18, kind: 'cave' },
];

// Path segments drawn as connector lines between nodes (by id). Purely
// decorative wayfinding — not gameplay adjacency.
export const SINNOH_EDGES: Array<[string, string]> = [
  ['lake-verity', 'route-201'],
  ['route-201', 'route-202'],
  ['route-202', 'route-203'],
  ['route-203', 'oreburgh-gate'],
  ['oreburgh-gate', 'oreburgh-mine'],
  ['route-202', 'route-204-south'],
  ['route-204-south', 'route-205-south'],
  ['route-204-south', 'valley-windworks'],
  ['route-205-south', 'floaroma-meadow'],
  ['route-205-south', 'eterna-forest'],
  ['eterna-forest', 'old-chateau'],
  ['eterna-forest', 'eterna-city'],
  ['eterna-city', 'route-206'],
  ['eterna-city', 'mt-coronet'],
  ['route-205-south', 'canalave-city'],
  ['canalave-city', 'iron-island'],
  ['canalave-city', 'route-218'],
  ['mt-coronet', 'hearthome-city'],
  ['hearthome-city', 'amity-square'],
  ['hearthome-city', 'lost-tower'],
  ['hearthome-city', 'solaceon-town'],
  ['solaceon-town', 'solaceon-ruins'],
  ['hearthome-city', 'route-215'],
  ['route-215', 'trophy-garden'],
  ['route-215', 'route-214'],
  ['route-214', 'route-213'],
  ['route-213', 'great-marsh'],
  ['great-marsh', 'lake-valor'],
  ['lake-valor', 'route-222'],
  ['route-222', 'sunyshore-city'],
  ['mt-coronet', 'route-216'],
  ['route-216', 'route-217'],
  ['route-217', 'snowpoint-city'],
  ['snowpoint-city', 'lake-acuity'],
  ['snowpoint-city', 'snowpoint-temple'],
  ['sunyshore-city', 'victory-road'],
  ['victory-road', 'route-225'],
  ['route-225', 'route-230'],
  ['route-225', 'route-228'],
  ['route-228', 'stark-mountain'],
];

const NODE_BY_ID = new Map(SINNOH_NODES.map((n) => [n.id, n]));
export const mapNode = (id: string): MapNode | undefined => NODE_BY_ID.get(id);
export const hasMapNode = (id: string): boolean => NODE_BY_ID.has(id);
