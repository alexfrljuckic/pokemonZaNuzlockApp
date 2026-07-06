// Galar layout for the SwSh interactive map. Backdrop is a composited,
// theme-transparent PNG at public/maps/galar-combined.png (1218x976): a wide
// triptych with the two DLC islands FLANKING the base region so the map is
// landscape (ratio ~1.25) and uses the full-width stage like the other maps.
// Center = the official labeled map galar2.jpg cropped to just its map panel
// (Postwick south / Wyndon north, cities labeled + wild-area points numbered
// 1-26) at x:418-800. Left = Crown Tundra (cropped from the old galar.jpg,
// x:0-400, vertically centered). Right = Isle of Armor (x:818-1218). The page
// margin / book legend is flood-filled to transparent so the app's --bg-inset
// shows through and the map matches the active theme. DLC node coords are the
// old galar.jpg positions run through crop+scale+translate; base nodes are the
// galar2 calibration shifted into panel space. Recalibrate live with the debug
// overlay (stroke the map SVG's rects) per the standing lesson.
import type { GameMap } from './types';

export const GALAR_MAP: GameMap = {
  viewBox: { w: 1218, h: 976 },
  backdropSrc: '/maps/galar-combined.png',
  ariaLabel: 'Galar route map',
  nodes: [
    // — south: Postwick / Wedgehurst / Route 1-2 into the South Wild Area —
    { id: 'postwick', x: 625, y: 893, w: 55, h: 45, kind: 'town' },
    { id: 'wedgehurst', x: 665, y: 846, w: 55, h: 42, kind: 'town' },
    { id: 'route-1', x: 600, y: 883, w: 45, h: 35, kind: 'route' },
    { id: 'route-2', x: 640, y: 800, w: 55, h: 42, kind: 'route' },
    // — South Wild Area: the lakes cluster, calibrated onto the official map's
    //   numbered points (4-12). Dense but hover tooltips carry the names —
    { id: 'watchtower-ruins', x: 542, y: 681, w: 30, h: 24, kind: 'route' },
    { id: 'east-lake-axewell', x: 580, y: 688, w: 30, h: 24, kind: 'route' },
    { id: 'north-lake-miloch', x: 628, y: 685, w: 30, h: 24, kind: 'route' },
    { id: 'west-lake-axewell', x: 539, y: 707, w: 30, h: 24, kind: 'route' },
    { id: 'axews-eye', x: 570, y: 712, w: 30, h: 24, kind: 'route' },
    { id: 'south-lake-miloch', x: 617, y: 740, w: 30, h: 24, kind: 'route' },
    { id: 'giants-seat', x: 637, y: 739, w: 30, h: 24, kind: 'route' },
    { id: 'rolling-fields', x: 559, y: 748, w: 30, h: 24, kind: 'route' },
    { id: 'dappled-grove', x: 534, y: 761, w: 30, h: 24, kind: 'route' },
    // — Motostoke (Fire Gym) + its mine / routes —
    { id: 'motostoke', x: 555, y: 593, w: 78, h: 55, kind: 'city' },
    { id: 'route-3', x: 508, y: 615, w: 34, h: 28, kind: 'route' },
    { id: 'galar-mine', x: 475, y: 588, w: 48, h: 42, kind: 'cave' },
    // — Turffield (Grass Gym) + Route 4/5 west —
    { id: 'turffield', x: 483, y: 523, w: 56, h: 46, kind: 'town' },
    { id: 'route-4', x: 468, y: 559, w: 34, h: 28, kind: 'route' },
    { id: 'route-5', x: 542, y: 541, w: 34, h: 28, kind: 'route' },
    // — Hulbury (Water Gym) east + Galar Mine No.2 —
    { id: 'hulbury', x: 695, y: 510, w: 58, h: 45, kind: 'city' },
    { id: 'galar-mine-no-2', x: 668, y: 576, w: 50, h: 40, kind: 'cave' },
    // — Motostoke Outskirts (#15) + Riverbank (#13) around Motostoke, into the
    //   North Wild Area (Bridge Field / Giant's Cap / Dusty Bowl / Lake of Outrage) —
    { id: 'motostoke-outskirts', x: 637, y: 614, w: 34, h: 28, kind: 'route' },
    { id: 'motostoke-riverbank', x: 626, y: 639, w: 28, h: 24, kind: 'route' },
    { id: 'bridge-field', x: 615, y: 581, w: 28, h: 24, kind: 'route' },
    { id: 'giants-cap', x: 573, y: 506, w: 28, h: 24, kind: 'route' },
    { id: 'dusty-bowl', x: 597, y: 516, w: 28, h: 24, kind: 'route' },
    { id: 'lake-of-outrage', x: 558, y: 497, w: 28, h: 24, kind: 'route' },
    { id: 'postgame-route-10-hero-path', x: 615, y: 487, w: 28, h: 24, kind: 'route' },
    { id: 'giants-mirror', x: 617, y: 514, w: 28, h: 24, kind: 'route' },
    { id: 'stony-wilderness', x: 615, y: 537, w: 28, h: 24, kind: 'route' },
    // — Hammerlocke (Dragon Gym) central + Route 6 west to Stow/Ballonlea —
    { id: 'hammerlocke', x: 552, y: 450, w: 80, h: 55, kind: 'city' },
    { id: 'route-6', x: 511, y: 443, w: 34, h: 28, kind: 'route' },
    { id: 'stow-on-side', x: 502, y: 410, w: 56, h: 46, kind: 'town' },
    { id: 'glimwood-tangle', x: 482, y: 356, w: 58, h: 46, kind: 'forest' },
    { id: 'ballonlea', x: 462, y: 311, w: 52, h: 44, kind: 'town' },
    // — Route 7/8 east to Circhester (Rock/Ice Gym), Route 9 to Spikemuth —
    { id: 'route-7', x: 651, y: 464, w: 34, h: 28, kind: 'route' },
    { id: 'route-8', x: 666, y: 407, w: 34, h: 28, kind: 'route' },
    { id: 'circhester', x: 685, y: 300, w: 60, h: 46, kind: 'city' },
    { id: 'circhester-bay', x: 668, y: 350, w: 44, h: 42, kind: 'route' },
    { id: 'route-9', x: 739, y: 368, w: 34, h: 28, kind: 'route' },
    { id: 'spikemuth', x: 728, y: 406, w: 52, h: 42, kind: 'town' },
    // — Route 10 up to Wyndon (Pokémon League / Rose Tower) —
    { id: 'route-10', x: 583, y: 240, w: 55, h: 95, kind: 'route' },
    { id: 'wyndon', x: 532, y: 110, w: 122, h: 96, kind: 'city' },
    // — Isle of Armor DLC (composited inset in the left gutter, y~360-605;
    //   dense but hover tooltips carry the names) —
    { id: 'honeycalm-island', x: 935, y: 327, w: 55, h: 45, kind: 'route' },
    { id: 'honeycalm-sea', x: 878, y: 377, w: 52, h: 45, kind: 'route' },
    { id: 'potbottom-desert', x: 1026, y: 341, w: 72, h: 40, kind: 'route' },
    { id: 'warm-up-tunnel', x: 1055, y: 384, w: 52, h: 37, kind: 'cave' },
    { id: 'challenge-road', x: 996, y: 384, w: 55, h: 37, kind: 'route' },
    { id: 'brawlers-cave', x: 960, y: 409, w: 48, h: 37, kind: 'cave' },
    { id: 'forest-of-focus', x: 1010, y: 422, w: 62, h: 42, kind: 'forest' },
    { id: 'loop-lagoon', x: 1071, y: 429, w: 55, h: 42, kind: 'route' },
    { id: 'fields-of-honor', x: 911, y: 419, w: 52, h: 42, kind: 'route' },
    { id: 'challenge-beach', x: 946, y: 449, w: 55, h: 40, kind: 'route' },
    { id: 'soothing-wetlands', x: 966, y: 489, w: 65, h: 40, kind: 'route' },
    { id: 'training-lowlands', x: 1023, y: 476, w: 62, h: 40, kind: 'route' },
    { id: 'courageous-cavern', x: 1051, y: 514, w: 55, h: 37, kind: 'cave' },
    { id: 'workout-sea', x: 1116, y: 377, w: 62, h: 45, kind: 'route' },
    { id: 'stepping-stone-sea', x: 1101, y: 531, w: 65, h: 45, kind: 'route' },
    { id: 'insular-sea', x: 875, y: 436, w: 52, h: 45, kind: 'route' },
    // — Crown Tundra DLC (composited inset in the left gutter, y~40-327:
    //   snowy highlands north, Giant's Bed center, Ballimere/Dyna Tree south) —
    { id: 'path-to-the-peak', x: 165, y: 309, w: 45, h: 38, kind: 'route' },
    { id: 'tunnel-to-the-top', x: 178, y: 357, w: 47, h: 33, kind: 'cave' },
    { id: 'frostpoint-field', x: 123, y: 349, w: 45, h: 33, kind: 'route' },
    { id: 'old-cemetery', x: 92, y: 381, w: 45, h: 33, kind: 'route' },
    { id: 'snowslide-slope', x: 145, y: 401, w: 55, h: 45, kind: 'route' },
    { id: 'slippery-slope', x: 57, y: 422, w: 55, h: 48, kind: 'route' },
    { id: 'giants-foot', x: 238, y: 429, w: 47, h: 42, kind: 'route' },
    { id: 'three-point-pass', x: 288, y: 447, w: 33, h: 28, kind: 'route' },
    { id: 'frigid-sea', x: 337, y: 437, w: 58, h: 42, kind: 'route' },
    { id: 'roaring-sea-caves', x: 302, y: 482, w: 38, h: 28, kind: 'cave' },
    { id: 'giants-bed', x: 128, y: 509, w: 122, h: 67, kind: 'route' },
    { id: 'ballimere-lake', x: 123, y: 637, w: 62, h: 47, kind: 'route' },
    { id: 'lakeside-cave', x: 235, y: 597, w: 38, h: 28, kind: 'cave' },
    { id: 'dyna-tree-hill', x: 168, y: 609, w: 47, h: 35, kind: 'landmark' },
  ],
  edges: [
    ['route-1', 'route-2'],
    ['route-2', 'rolling-fields'],
    ['rolling-fields', 'motostoke-riverbank'],
    ['motostoke-riverbank', 'motostoke'],
    ['motostoke', 'route-3'],
    ['route-3', 'galar-mine'],
    ['galar-mine', 'route-4'],
    ['route-4', 'route-5'],
    ['route-5', 'hulbury'],
    ['motostoke', 'bridge-field'],
    ['bridge-field', 'giants-cap'],
    ['giants-cap', 'dusty-bowl'],
    ['giants-cap', 'lake-of-outrage'],
    ['giants-cap', 'hammerlocke'],
    ['hammerlocke', 'route-6'],
    ['route-6', 'stow-on-side'],
    ['stow-on-side', 'glimwood-tangle'],
    ['glimwood-tangle', 'ballonlea'],
    ['hammerlocke', 'route-7'],
    ['route-7', 'route-8'],
    ['route-8', 'circhester'],
    ['hulbury', 'galar-mine-no-2'],
    ['galar-mine-no-2', 'motostoke'],
    ['circhester', 'circhester-bay'],
    ['circhester-bay', 'route-9'],
    ['route-9', 'spikemuth'],
    ['route-9', 'route-10'],
  ],
};
