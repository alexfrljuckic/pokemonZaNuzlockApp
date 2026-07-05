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
import type { GameMap } from './types';

export const SINNOH_MAP: GameMap = {
  viewBox: { w: 806, h: 688 },
  backdropSrc: '/maps/sinnoh.png',
  ariaLabel: 'Sinnoh route map',
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
  // Regions are top-left + size boxes covering each area's section of the art,
  // sized from the banner anchors above and the visible route paths.
  nodes: [
    // — Southern start (SW) —
    { id: 'lake-verity', x: 4, y: 560, w: 58, h: 56, kind: 'landmark' },
    { id: 'route-201', x: 76, y: 606, w: 50, h: 36, kind: 'route' },
    { id: 'route-202', x: 118, y: 538, w: 32, h: 66, kind: 'route' },
    { id: 'ramanas-park', x: 204, y: 644, w: 62, h: 38, kind: 'landmark' },
    { id: 'route-203', x: 152, y: 510, w: 58, h: 32, kind: 'route' },
    { id: 'oreburgh-gate', x: 212, y: 508, w: 30, h: 30, kind: 'cave' },
    { id: 'oreburgh-mine', x: 252, y: 548, w: 40, h: 40, kind: 'cave' },

    // — West / Floaroma / Eterna —
    { id: 'route-204-south', x: 110, y: 452, w: 32, h: 56, kind: 'route' },
    // — #73 areas (calibrated from a 3x crop of the backdrop: Ravaged Path
    //   sits on the 204 road below Floaroma; 207 is the horizontal road
    //   between the Cycling Road junction and Coronet's west base; 208
    //   continues east of Coronet to Hearthome; Wayward Cave hangs off
    //   206's east side) —
    { id: 'ravaged-path', x: 144, y: 462, w: 26, h: 26, kind: 'cave' },
    { id: 'route-207', x: 252, y: 480, w: 40, h: 24, kind: 'route' },
    { id: 'route-208', x: 318, y: 476, w: 42, h: 26, kind: 'route' },
    { id: 'wayward-cave', x: 276, y: 424, w: 22, h: 22, kind: 'cave' },
    { id: 'floaroma-meadow', x: 84, y: 392, w: 48, h: 46, kind: 'landmark' },
    { id: 'valley-windworks', x: 182, y: 418, w: 46, h: 38, kind: 'landmark' },
    { id: 'route-205-south', x: 188, y: 352, w: 38, h: 62, kind: 'route' },
    { id: 'eterna-forest', x: 152, y: 276, w: 92, h: 64, kind: 'forest' },
    { id: 'old-chateau', x: 212, y: 264, w: 36, h: 32, kind: 'landmark' },
    { id: 'eterna-city', x: 240, y: 332, w: 48, h: 46, kind: 'city' },
    { id: 'route-206', x: 246, y: 402, w: 32, h: 68, kind: 'route' },

    // — Far west coast —
    { id: 'route-218', x: 44, y: 494, w: 56, h: 32, kind: 'route' },
    { id: 'canalave-city', x: 0, y: 478, w: 40, h: 50, kind: 'city' },
    { id: 'iron-island', x: 58, y: 262, w: 66, h: 50, kind: 'cave' },

    // — Central spine —
    { id: 'mt-coronet', x: 298, y: 248, w: 50, h: 210, kind: 'cave' },
    { id: 'hearthome-city', x: 366, y: 460, w: 48, h: 48, kind: 'city' },
    { id: 'amity-square', x: 398, y: 432, w: 38, h: 34, kind: 'landmark' },
    { id: 'lost-tower', x: 436, y: 462, w: 36, h: 34, kind: 'landmark' },

    // — East —
    { id: 'solaceon-town', x: 462, y: 422, w: 46, h: 42, kind: 'town' },
    { id: 'solaceon-ruins', x: 496, y: 446, w: 34, h: 32, kind: 'cave' },

    // — Toward Pastoria (SE-central) —
    { id: 'route-215', x: 518, y: 410, w: 62, h: 34, kind: 'route' },
    { id: 'trophy-garden', x: 352, y: 506, w: 52, h: 40, kind: 'landmark' },
    { id: 'route-214', x: 582, y: 438, w: 34, h: 62, kind: 'route' },
    { id: 'route-213', x: 574, y: 578, w: 70, h: 34, kind: 'route' },
    { id: 'great-marsh', x: 506, y: 536, w: 54, h: 38, kind: 'landmark' },
    { id: 'lake-valor', x: 598, y: 526, w: 50, h: 44, kind: 'landmark' },

    // — SE coast —
    { id: 'route-222', x: 652, y: 526, w: 48, h: 34, kind: 'route' },
    { id: 'sunyshore-city', x: 700, y: 508, w: 50, h: 50, kind: 'city' },

    // — North (snow) —
    { id: 'route-216', x: 288, y: 206, w: 42, h: 44, kind: 'route' },
    { id: 'route-217', x: 270, y: 128, w: 42, h: 58, kind: 'route' },
    { id: 'lake-acuity', x: 246, y: 16, w: 46, h: 44, kind: 'landmark' },
    { id: 'snowpoint-city', x: 282, y: 42, w: 48, h: 52, kind: 'city' },
    { id: 'snowpoint-temple', x: 322, y: 30, w: 40, h: 38, kind: 'cave' },

    // — East coast / Battle Zone (post-game) —
    { id: 'victory-road', x: 690, y: 344, w: 46, h: 46, kind: 'cave' },
    { id: 'route-225', x: 500, y: 210, w: 42, h: 58, kind: 'route' },
    { id: 'route-228', x: 602, y: 206, w: 48, h: 54, kind: 'route' },
    { id: 'route-230', x: 578, y: 286, w: 50, h: 44, kind: 'route' },
    { id: 'stark-mountain', x: 594, y: 58, w: 54, h: 54, kind: 'cave' },
  ],
  edges: [
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
    ['route-204-south', 'ravaged-path'],
    ['route-206', 'wayward-cave'],
    ['route-206', 'route-207'],
    ['route-207', 'mt-coronet'],
    ['mt-coronet', 'route-208'],
    ['route-208', 'hearthome-city'],
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
  ],
};
