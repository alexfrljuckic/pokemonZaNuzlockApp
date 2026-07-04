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
// Anchors extracted from the backdrop's pixel data (marker centroids):
//   cities (red):  Snowpoint (82,10) · Fight Area (142,56) · Eterna (70,79) ·
//                  League (187,84) · Veilstone (156,95) · Hearthome (107,116) ·
//                  Canalave (12,123) · Oreburgh (66,128) · Jubilife (37,130) ·
//                  Sunyshore (191,130) · Pastoria (135,144)
//   towns (blue):  Survival (146,36) · Resort (181,64) · Celestic (105,78) ·
//                  Solaceon (129,106) · Sandgem (41,148) · Twinleaf (27,155)
//   lakes (cyan):  Acuity (70,12) · Valor (154,129) · Verity (17,146)
export const SINNOH_NODES: MapNode[] = [
  // — Southern start (SW) —
  { id: 'lake-verity', x: 17, y: 146, kind: 'landmark' },
  { id: 'route-201', x: 33, y: 151, kind: 'route' },
  { id: 'route-202', x: 39, y: 139, kind: 'route' },
  { id: 'ramanas-park', x: 44, y: 162, kind: 'landmark' },
  { id: 'route-203', x: 51, y: 128, kind: 'route' },
  { id: 'oreburgh-gate', x: 59, y: 128, kind: 'cave' },
  { id: 'oreburgh-mine', x: 67, y: 134, kind: 'cave' },

  // — West / Floaroma / Eterna —
  { id: 'route-204-south', x: 37, y: 119, kind: 'route' },
  { id: 'floaroma-meadow', x: 38, y: 98, kind: 'landmark' },
  { id: 'valley-windworks', x: 49, y: 105, kind: 'landmark' },
  { id: 'route-205-south', x: 46, y: 92, kind: 'route' },
  { id: 'eterna-forest', x: 56, y: 84, kind: 'forest' },
  { id: 'old-chateau', x: 61, y: 78, kind: 'landmark' },
  { id: 'eterna-city', x: 70, y: 79, kind: 'city' },
  { id: 'route-206', x: 71, y: 94, kind: 'route' },

  // — Far west coast —
  { id: 'route-218', x: 24, y: 125, kind: 'route' },
  { id: 'canalave-city', x: 12, y: 123, kind: 'city' },
  { id: 'iron-island', x: 25, y: 67, kind: 'cave' },

  // — Central spine —
  { id: 'mt-coronet', x: 92, y: 70, kind: 'cave' },
  { id: 'hearthome-city', x: 107, y: 116, kind: 'city' },
  { id: 'amity-square', x: 111, y: 110, kind: 'landmark' },
  { id: 'lost-tower', x: 120, y: 112, kind: 'landmark' },

  // — East —
  { id: 'solaceon-town', x: 129, y: 106, kind: 'town' },
  { id: 'solaceon-ruins', x: 134, y: 110, kind: 'cave' },

  // — Toward Pastoria (SE-central) —
  { id: 'route-215', x: 143, y: 96, kind: 'route' },
  { id: 'trophy-garden', x: 112, y: 132, kind: 'landmark' },
  { id: 'route-214', x: 157, y: 110, kind: 'route' },
  { id: 'route-213', x: 147, y: 139, kind: 'route' },
  { id: 'great-marsh', x: 135, y: 137, kind: 'landmark' },
  { id: 'lake-valor', x: 154, y: 129, kind: 'landmark' },

  // — SE coast —
  { id: 'route-222', x: 176, y: 131, kind: 'route' },
  { id: 'sunyshore-city', x: 191, y: 130, kind: 'city' },

  // — North (snow) —
  { id: 'route-216', x: 87, y: 48, kind: 'route' },
  { id: 'route-217', x: 83, y: 30, kind: 'route' },
  { id: 'lake-acuity', x: 70, y: 12, kind: 'landmark' },
  { id: 'snowpoint-city', x: 82, y: 10, kind: 'city' },
  { id: 'snowpoint-temple', x: 89, y: 15, kind: 'cave' },

  // — East coast / Battle Zone (post-game) —
  { id: 'victory-road', x: 184, y: 92, kind: 'cave' },
  { id: 'route-225', x: 146, y: 47, kind: 'route' },
  { id: 'route-228', x: 172, y: 50, kind: 'route' },
  { id: 'route-230', x: 166, y: 70, kind: 'route' },
  { id: 'stark-mountain', x: 192, y: 30, kind: 'cave' },
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
