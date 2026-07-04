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

// Coordinate space matches the backdrop image (public/maps/sinnoh.png) 1:1 in
// pixels, so node positions read directly against it.
export const SINNOH_VIEWBOX = { w: 216, h: 168 };

// Positions calibrated to the Sinnoh town-map backdrop (216x168). Ordered
// roughly south → north.
export const SINNOH_NODES: MapNode[] = [
  // — Southern start (SW) —
  { id: 'lake-verity', x: 43, y: 134, kind: 'landmark' },
  { id: 'ramanas-park', x: 30, y: 150, kind: 'landmark' },
  { id: 'route-201', x: 52, y: 140, kind: 'route' },
  { id: 'route-202', x: 63, y: 124, kind: 'route' },
  { id: 'route-203', x: 78, y: 118, kind: 'route' },
  { id: 'oreburgh-gate', x: 86, y: 122, kind: 'cave' },
  { id: 'oreburgh-mine', x: 93, y: 126, kind: 'cave' },

  // — West / Floaroma / Eterna —
  { id: 'route-204-south', x: 64, y: 100, kind: 'route' },
  { id: 'route-205-south', x: 62, y: 86, kind: 'route' },
  { id: 'valley-windworks', x: 50, y: 92, kind: 'landmark' },
  { id: 'floaroma-meadow', x: 58, y: 80, kind: 'landmark' },
  { id: 'eterna-forest', x: 70, y: 66, kind: 'forest' },
  { id: 'old-chateau', x: 76, y: 60, kind: 'landmark' },
  { id: 'eterna-city', x: 80, y: 54, kind: 'city' },
  { id: 'route-206', x: 92, y: 80, kind: 'route' },

  // — Far west coast —
  { id: 'route-218', x: 48, y: 108, kind: 'route' },
  { id: 'canalave-city', x: 34, y: 92, kind: 'city' },
  { id: 'iron-island', x: 18, y: 100, kind: 'cave' },

  // — Central spine —
  { id: 'mt-coronet', x: 100, y: 80, kind: 'cave' },
  { id: 'hearthome-city', x: 112, y: 101, kind: 'city' },
  { id: 'amity-square', x: 118, y: 97, kind: 'landmark' },
  { id: 'lost-tower', x: 124, y: 92, kind: 'landmark' },

  // — East —
  { id: 'solaceon-town', x: 134, y: 84, kind: 'town' },
  { id: 'solaceon-ruins', x: 142, y: 80, kind: 'cave' },

  // — Toward Pastoria (SE-central) —
  { id: 'route-215', x: 128, y: 96, kind: 'route' },
  { id: 'trophy-garden', x: 116, y: 116, kind: 'landmark' },
  { id: 'route-214', x: 150, y: 96, kind: 'route' },
  { id: 'route-213', x: 145, y: 116, kind: 'route' },
  { id: 'great-marsh', x: 130, y: 124, kind: 'landmark' },
  { id: 'lake-valor', x: 151, y: 111, kind: 'landmark' },

  // — SE coast —
  { id: 'route-222', x: 166, y: 110, kind: 'route' },
  { id: 'sunyshore-city', x: 177, y: 111, kind: 'city' },

  // — North (snow) —
  { id: 'route-216', x: 100, y: 60, kind: 'route' },
  { id: 'route-217', x: 98, y: 48, kind: 'route' },
  { id: 'lake-acuity', x: 91, y: 40, kind: 'landmark' },
  { id: 'snowpoint-city', x: 104, y: 34, kind: 'city' },
  { id: 'snowpoint-temple', x: 110, y: 26, kind: 'cave' },

  // — NE post-game (Battle Zone / Victory Road) —
  { id: 'victory-road', x: 190, y: 84, kind: 'cave' },
  { id: 'route-230', x: 140, y: 20, kind: 'route' },
  { id: 'route-225', x: 150, y: 30, kind: 'route' },
  { id: 'route-228', x: 170, y: 26, kind: 'route' },
  { id: 'stark-mountain', x: 176, y: 14, kind: 'cave' },
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
