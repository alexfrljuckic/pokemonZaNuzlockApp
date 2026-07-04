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
export const SINNOH_VIEWBOX = { w: 806, h: 688 };

// Node sizing scales with the coordinate space (fractions of viewBox width).
export const NODE_SCALE = SINNOH_VIEWBOX.w / 216;

// Positions calibrated to the Sinnoh town-map backdrop (216x168). Ordered
// roughly south → north.
// Anchors extracted from the labeled backdrop's pixel data (banner centroids):
//   red banners:   Snowpoint (307,69) · Fight Area (534,272) · Eterna (265,357) ·
//                  League (717,347) · Veilstone (607,416) · Hearthome (391,486) ·
//                  Canalave (18,504) · Oreburgh (250,520) · Jubilife (127,529) ·
//                  Sunyshore (726,535) · Pastoria (534,606)
//   blue banners:  Survival (546,205) · Resort (679,297) · Celestic (378,348) ·
//                  Floaroma (138,434) · Solaceon (487,446) · Sandgem (138,613) ·
//                  Twinleaf (66,631)
//   green banners: Stark Mtn (625,82) · Victory Road (714,368) · Ramanas (234,661)
//   Eterna Forest tree cluster centered ~(197,307).
export const SINNOH_NODES: MapNode[] = [
  // — Southern start (SW) —
  { id: 'lake-verity', x: 28, y: 588, kind: 'landmark' },
  { id: 'route-201', x: 100, y: 624, kind: 'route' },
  { id: 'route-202', x: 133, y: 570, kind: 'route' },
  { id: 'ramanas-park', x: 234, y: 661, kind: 'landmark' },
  { id: 'route-203', x: 190, y: 527, kind: 'route' },
  { id: 'oreburgh-gate', x: 226, y: 524, kind: 'cave' },
  { id: 'oreburgh-mine', x: 272, y: 568, kind: 'cave' },

  // — West / Floaroma / Eterna —
  { id: 'route-204-south', x: 127, y: 482, kind: 'route' },
  { id: 'floaroma-meadow', x: 108, y: 415, kind: 'landmark' },
  { id: 'valley-windworks', x: 205, y: 436, kind: 'landmark' },
  { id: 'route-205-south', x: 208, y: 390, kind: 'route' },
  { id: 'eterna-forest', x: 197, y: 307, kind: 'forest' },
  { id: 'old-chateau', x: 232, y: 285, kind: 'landmark' },
  { id: 'eterna-city', x: 265, y: 357, kind: 'city' },
  { id: 'route-206', x: 263, y: 440, kind: 'route' },

  // — Far west coast —
  { id: 'route-218', x: 75, y: 511, kind: 'route' },
  { id: 'canalave-city', x: 18, y: 504, kind: 'city' },
  { id: 'iron-island', x: 92, y: 288, kind: 'cave' },

  // — Central spine —
  { id: 'mt-coronet', x: 322, y: 402, kind: 'cave' },
  { id: 'hearthome-city', x: 391, y: 486, kind: 'city' },
  { id: 'amity-square', x: 418, y: 452, kind: 'landmark' },
  { id: 'lost-tower', x: 455, y: 481, kind: 'landmark' },

  // — East —
  { id: 'solaceon-town', x: 487, y: 446, kind: 'town' },
  { id: 'solaceon-ruins', x: 514, y: 462, kind: 'cave' },

  // — Toward Pastoria (SE-central) —
  { id: 'route-215', x: 550, y: 430, kind: 'route' },
  { id: 'trophy-garden', x: 379, y: 528, kind: 'landmark' },
  { id: 'route-214', x: 601, y: 470, kind: 'route' },
  { id: 'route-213', x: 612, y: 596, kind: 'route' },
  { id: 'great-marsh', x: 534, y: 557, kind: 'landmark' },
  { id: 'lake-valor', x: 625, y: 550, kind: 'landmark' },

  // — SE coast —
  { id: 'route-222', x: 678, y: 545, kind: 'route' },
  { id: 'sunyshore-city', x: 726, y: 535, kind: 'city' },

  // — North (snow) —
  { id: 'route-216', x: 310, y: 230, kind: 'route' },
  { id: 'route-217', x: 293, y: 158, kind: 'route' },
  { id: 'lake-acuity', x: 270, y: 40, kind: 'landmark' },
  { id: 'snowpoint-city', x: 307, y: 69, kind: 'city' },
  { id: 'snowpoint-temple', x: 342, y: 52, kind: 'cave' },

  // — East coast / Battle Zone (post-game) —
  { id: 'victory-road', x: 714, y: 368, kind: 'cave' },
  { id: 'route-225', x: 523, y: 240, kind: 'route' },
  { id: 'route-228', x: 628, y: 235, kind: 'route' },
  { id: 'route-230', x: 605, y: 310, kind: 'route' },
  { id: 'stark-mountain', x: 622, y: 88, kind: 'cave' },
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
