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
    // — towns (nodes centered on the banner anchors documented above) —
    { id: 'twinleaf-town', x: 44, y: 611, w: 44, h: 40, kind: 'town' },
    { id: 'sandgem-town', x: 116, y: 593, w: 44, h: 40, kind: 'town' },
    { id: 'jubilife-city', x: 105, y: 509, w: 44, h: 40, kind: 'city' },
    { id: 'oreburgh-city', x: 228, y: 500, w: 44, h: 40, kind: 'city' },
    { id: 'floaroma-town', x: 116, y: 414, w: 44, h: 40, kind: 'town' },
    { id: 'veilstone-city', x: 585, y: 396, w: 44, h: 40, kind: 'city' },
    { id: 'pastoria-city', x: 512, y: 586, w: 44, h: 40, kind: 'city' },
    { id: 'celestic-town', x: 356, y: 328, w: 44, h: 40, kind: 'town' },
    { id: 'fight-area', x: 512, y: 252, w: 44, h: 40, kind: 'town' },
    { id: 'survival-area', x: 524, y: 185, w: 44, h: 40, kind: 'town' },
    { id: 'resort-area', x: 657, y: 277, w: 44, h: 40, kind: 'town' },
    // — Southern start (SW) —
    { id: 'lake-verity', x: 9, y: 565, w: 48, h: 46, kind: 'landmark' },
    { id: 'route-201', x: 76, y: 606, w: 50, h: 36, kind: 'route' },
    { id: 'route-202', x: 118, y: 548, w: 32, h: 46, kind: 'route' },
    { id: 'ramanas-park', x: 211, y: 644, w: 48, h: 38, kind: 'landmark' },
    { id: 'route-203', x: 154, y: 510, w: 54, h: 32, kind: 'route' },
    { id: 'oreburgh-gate', x: 212, y: 508, w: 30, h: 30, kind: 'cave' },
    { id: 'oreburgh-mine', x: 252, y: 548, w: 40, h: 40, kind: 'cave' },

    // — West / Floaroma / Eterna —
    { id: 'route-204-south', x: 110, y: 457, w: 32, h: 46, kind: 'route' },
    // route-204-north: continues past Ravaged Path up toward Floaroma Town —
    // placed just above 204-south, between it and floaroma-town/-meadow.
    { id: 'route-204-north', x: 122, y: 424, w: 28, h: 28, kind: 'route' },
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
    { id: 'route-205-south', x: 188, y: 360, w: 38, h: 46, kind: 'route' },
    // route-205-north: the north river segment past Eterna Forest / Valley
    // Windworks — placed just above 205-south, east of the forest cluster.
    { id: 'route-205-north', x: 214, y: 322, w: 26, h: 34, kind: 'route' },
    { id: 'eterna-forest', x: 162, y: 280, w: 72, h: 56, kind: 'forest' },
    { id: 'old-chateau', x: 212, y: 264, w: 36, h: 32, kind: 'landmark' },
    { id: 'eterna-city', x: 242, y: 334, w: 44, h: 42, kind: 'city' },
    { id: 'route-206', x: 246, y: 413, w: 32, h: 46, kind: 'route' },

    // — Far west coast —
    { id: 'route-218', x: 45, y: 494, w: 54, h: 32, kind: 'route' },
    { id: 'canalave-city', x: 0, y: 482, w: 40, h: 42, kind: 'city' },
    { id: 'iron-island', x: 67, y: 262, w: 48, h: 50, kind: 'cave' },

    // — Central spine —
    { id: 'mt-coronet', x: 299, y: 248, w: 48, h: 210, kind: 'cave' },
    // route-211 straddles Mt. Coronet: -west on the Eterna side, -east on the
    // Celestic side, flanking the spine at the same latitude.
    { id: 'route-211-west', x: 262, y: 300, w: 30, h: 28, kind: 'route' },
    { id: 'route-211-east', x: 354, y: 296, w: 30, h: 28, kind: 'route' },
    { id: 'hearthome-city', x: 368, y: 463, w: 44, h: 42, kind: 'city' },
    { id: 'amity-square', x: 398, y: 432, w: 38, h: 34, kind: 'landmark' },
    { id: 'lost-tower', x: 436, y: 462, w: 36, h: 34, kind: 'landmark' },

    // — East —
    // route-209: long route south of Hearthome, home to the Lost Tower —
    // placed between Hearthome/Lost Tower and Solaceon along the east road.
    { id: 'route-209', x: 424, y: 424, w: 32, h: 32, kind: 'route' },
    { id: 'solaceon-town', x: 463, y: 423, w: 44, h: 40, kind: 'town' },
    { id: 'solaceon-ruins', x: 496, y: 446, w: 34, h: 32, kind: 'cave' },
    // route-210 (split by the Psyduck herd): -south on the Solaceon side,
    // -north (foggy) climbing toward Celestic Town / Route 215.
    { id: 'route-210-south', x: 444, y: 380, w: 28, h: 30, kind: 'route' },
    { id: 'route-210-north', x: 416, y: 348, w: 28, h: 30, kind: 'route' },

    // — Toward Pastoria (SE-central) —
    { id: 'route-215', x: 522, y: 410, w: 54, h: 34, kind: 'route' },
    { id: 'trophy-garden', x: 354, y: 506, w: 48, h: 40, kind: 'landmark' },
    // route-212 runs Hearthome → Pastoria: -north holds the Trophy Garden /
    // Pokémon Mansion, -south is the marsh approaching Pastoria City.
    { id: 'route-212-north', x: 412, y: 526, w: 28, h: 30, kind: 'route' },
    { id: 'route-212-south', x: 452, y: 566, w: 28, h: 32, kind: 'route' },
    { id: 'route-214', x: 582, y: 446, w: 34, h: 46, kind: 'route' },
    { id: 'route-213', x: 582, y: 578, w: 54, h: 34, kind: 'route' },
    { id: 'great-marsh', x: 509, y: 536, w: 48, h: 38, kind: 'landmark' },
    { id: 'lake-valor', x: 599, y: 526, w: 48, h: 44, kind: 'landmark' },

    // — SW sea routes (post-Surf, south of Sandgem toward Pal Park) —
    // route-219 → route-220 (open sea) → route-221 (grass), a chain running
    // south of Sandgem Town and east toward Ramanas Park.
    { id: 'route-219', x: 98, y: 646, w: 28, h: 30, kind: 'route' },
    { id: 'route-220', x: 138, y: 652, w: 28, h: 30, kind: 'route' },
    { id: 'route-221', x: 178, y: 656, w: 26, h: 28, kind: 'route' },

    // — SE coast —
    { id: 'route-222', x: 652, y: 526, w: 48, h: 34, kind: 'route' },
    { id: 'sunyshore-city', x: 703, y: 512, w: 44, h: 42, kind: 'city' },
    // route-223: open sea north of Sunyshore up to Victory Road / the League.
    { id: 'route-223', x: 702, y: 430, w: 30, h: 40, kind: 'route' },

    // — North (snow) —
    { id: 'route-216', x: 288, y: 206, w: 42, h: 44, kind: 'route' },
    { id: 'route-217', x: 270, y: 134, w: 42, h: 46, kind: 'route' },
    { id: 'lake-acuity', x: 246, y: 16, w: 46, h: 44, kind: 'landmark' },
    { id: 'snowpoint-city', x: 284, y: 47, w: 44, h: 42, kind: 'city' },
    { id: 'snowpoint-temple', x: 322, y: 30, w: 40, h: 38, kind: 'cave' },

    // — East coast / Battle Zone (post-game) —
    { id: 'victory-road', x: 690, y: 344, w: 46, h: 46, kind: 'cave' },
    { id: 'route-225', x: 500, y: 216, w: 42, h: 46, kind: 'route' },
    { id: 'route-228', x: 602, y: 210, w: 48, h: 46, kind: 'route' },
    { id: 'route-230', x: 578, y: 286, w: 50, h: 44, kind: 'route' },
    { id: 'stark-mountain', x: 597, y: 58, w: 48, h: 54, kind: 'cave' },
    // route-224: post-game route east past the Victory Road exit (coastal).
    { id: 'route-224', x: 744, y: 296, w: 30, h: 40, kind: 'route' },
    // route-226 → route-227: post-game cliff routes climbing from the Survival
    // Area up toward Stark Mountain in the far NE.
    { id: 'route-226', x: 552, y: 150, w: 28, h: 32, kind: 'route' },
    { id: 'route-227', x: 592, y: 112, w: 28, h: 32, kind: 'route' },
    // route-229: post-game route in the Resort Area / Route 230 loop (SW of the
    // Battle Zone cluster).
    { id: 'route-229', x: 628, y: 328, w: 28, h: 30, kind: 'route' },
  ],
  edges: [
    ['lake-verity', 'route-201'],
    ['route-201', 'route-202'],
    ['route-202', 'route-203'],
    ['route-203', 'oreburgh-gate'],
    ['oreburgh-gate', 'oreburgh-mine'],
    ['route-202', 'route-204-south'],
    ['route-204-south', 'route-204-north'],
    ['route-204-north', 'floaroma-town'],
    ['route-204-south', 'route-205-south'],
    ['route-204-south', 'valley-windworks'],
    ['route-205-south', 'route-205-north'],
    ['route-205-north', 'eterna-city'],
    ['route-205-south', 'floaroma-meadow'],
    ['route-205-south', 'eterna-forest'],
    ['eterna-forest', 'old-chateau'],
    ['eterna-forest', 'eterna-city'],
    ['eterna-city', 'route-206'],
    ['eterna-city', 'mt-coronet'],
    ['eterna-city', 'route-211-west'],
    ['route-211-west', 'mt-coronet'],
    ['mt-coronet', 'route-211-east'],
    ['route-211-east', 'celestic-town'],
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
    ['hearthome-city', 'route-209'],
    ['route-209', 'lost-tower'],
    ['route-209', 'solaceon-town'],
    ['hearthome-city', 'solaceon-town'],
    ['solaceon-town', 'solaceon-ruins'],
    ['solaceon-town', 'route-210-south'],
    ['route-210-south', 'route-210-north'],
    ['route-210-north', 'celestic-town'],
    ['hearthome-city', 'route-215'],
    ['route-215', 'trophy-garden'],
    ['hearthome-city', 'route-212-north'],
    ['route-212-north', 'trophy-garden'],
    ['route-212-north', 'route-212-south'],
    ['route-212-south', 'pastoria-city'],
    ['route-215', 'route-214'],
    ['route-214', 'route-213'],
    ['route-213', 'great-marsh'],
    ['great-marsh', 'lake-valor'],
    ['lake-valor', 'route-222'],
    ['route-222', 'sunyshore-city'],
    ['sandgem-town', 'route-219'],
    ['route-219', 'route-220'],
    ['route-220', 'route-221'],
    ['sunyshore-city', 'route-223'],
    ['route-223', 'victory-road'],
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
    ['victory-road', 'route-224'],
    ['survival-area', 'route-226'],
    ['route-226', 'route-227'],
    ['route-227', 'stark-mountain'],
    ['route-230', 'route-229'],
    ['route-229', 'resort-area'],
  ],
};
