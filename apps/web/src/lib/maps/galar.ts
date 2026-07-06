// Galar layout for the SwSh interactive map. Backdrop is a composited,
// theme-transparent PNG at public/maps/galar-combined.png (634x976): the base
// region is the official labeled map galar2.jpg cropped to just its map panel
// (Postwick south / Wyndon north, cities labeled + wild-area points numbered
// 1-26), and the two DLC islands cropped out of the old galar.jpg are stacked
// in the left gutter — Crown Tundra top-left (~y40-327), Isle of Armor below it
// (~y360-605). The page margin / book legend is masked to transparent so the
// app's --bg-inset shows through and the map matches the active theme. DLC node
// coords are the old galar.jpg positions run through a crop+scale+translate;
// base nodes are the galar2 calibration shifted into panel space. Recalibrate
// live with the debug overlay (stroke the map SVG's rects) per the standing lesson.
import type { GameMap } from './types';

export const GALAR_MAP: GameMap = {
  viewBox: { w: 634, h: 976 },
  backdropSrc: '/maps/galar-combined.png',
  ariaLabel: 'Galar route map',
  nodes: [
    // — south: Postwick / Wedgehurst / Route 1-2 into the South Wild Area —
    { id: 'postwick', x: 459, y: 893, w: 55, h: 45, kind: 'town' },
    { id: 'wedgehurst', x: 499, y: 846, w: 55, h: 42, kind: 'town' },
    { id: 'route-1', x: 434, y: 883, w: 45, h: 35, kind: 'route' },
    { id: 'route-2', x: 474, y: 800, w: 55, h: 42, kind: 'route' },
    // — South Wild Area: the lakes cluster, calibrated onto the official map's
    //   numbered points (4-12). Dense but hover tooltips carry the names —
    { id: 'watchtower-ruins', x: 376, y: 681, w: 30, h: 24, kind: 'route' },
    { id: 'east-lake-axewell', x: 414, y: 688, w: 30, h: 24, kind: 'route' },
    { id: 'north-lake-miloch', x: 462, y: 685, w: 30, h: 24, kind: 'route' },
    { id: 'west-lake-axewell', x: 373, y: 707, w: 30, h: 24, kind: 'route' },
    { id: 'axews-eye', x: 404, y: 712, w: 30, h: 24, kind: 'route' },
    { id: 'south-lake-miloch', x: 451, y: 740, w: 30, h: 24, kind: 'route' },
    { id: 'giants-seat', x: 471, y: 739, w: 30, h: 24, kind: 'route' },
    { id: 'rolling-fields', x: 393, y: 748, w: 30, h: 24, kind: 'route' },
    { id: 'dappled-grove', x: 368, y: 761, w: 30, h: 24, kind: 'route' },
    { id: 'meetup-spot', x: 412, y: 790, w: 30, h: 24, kind: 'route' },
    // — Motostoke (Fire Gym) + its mine / routes —
    { id: 'motostoke', x: 389, y: 593, w: 78, h: 55, kind: 'city' },
    { id: 'route-3', x: 364, y: 570, w: 45, h: 38, kind: 'route' },
    { id: 'galar-mine', x: 309, y: 588, w: 48, h: 42, kind: 'cave' },
    // — Turffield (Grass Gym) + Route 4/5 west —
    { id: 'turffield', x: 317, y: 523, w: 56, h: 46, kind: 'town' },
    { id: 'route-4', x: 312, y: 488, w: 50, h: 40, kind: 'route' },
    { id: 'route-5', x: 374, y: 520, w: 65, h: 40, kind: 'route' },
    // — Hulbury (Water Gym) east + Galar Mine No.2 —
    { id: 'hulbury', x: 529, y: 510, w: 58, h: 45, kind: 'city' },
    { id: 'galar-mine-no-2', x: 502, y: 576, w: 50, h: 40, kind: 'cave' },
    // — Motostoke Outskirts (#15) + Riverbank (#13) around Motostoke, into the
    //   North Wild Area (Bridge Field / Giant's Cap / Dusty Bowl / Lake of Outrage) —
    { id: 'motostoke-outskirts', x: 471, y: 614, w: 34, h: 28, kind: 'route' },
    { id: 'motostoke-riverbank', x: 457, y: 637, w: 34, h: 28, kind: 'route' },
    { id: 'bridge-field', x: 452, y: 556, w: 55, h: 45, kind: 'route' },
    { id: 'giants-cap', x: 406, y: 486, w: 52, h: 42, kind: 'route' },
    { id: 'dusty-bowl', x: 474, y: 488, w: 46, h: 40, kind: 'route' },
    { id: 'lake-of-outrage', x: 364, y: 473, w: 46, h: 40, kind: 'route' },
    { id: 'postgame-route-10-hero-path', x: 446, y: 484, w: 34, h: 28, kind: 'route' },
    { id: 'giants-mirror', x: 448, y: 511, w: 34, h: 28, kind: 'route' },
    { id: 'stony-wilderness', x: 446, y: 535, w: 34, h: 28, kind: 'route' },
    // — Hammerlocke (Dragon Gym) central + Route 6 west to Stow/Ballonlea —
    { id: 'hammerlocke', x: 386, y: 450, w: 80, h: 55, kind: 'city' },
    { id: 'route-6', x: 352, y: 426, w: 50, h: 40, kind: 'route' },
    { id: 'stow-on-side', x: 336, y: 410, w: 56, h: 46, kind: 'town' },
    { id: 'glimwood-tangle', x: 316, y: 356, w: 58, h: 46, kind: 'forest' },
    { id: 'ballonlea', x: 296, y: 311, w: 52, h: 44, kind: 'town' },
    // — Route 7/8 east to Circhester (Rock/Ice Gym), Route 9 to Spikemuth —
    { id: 'route-7', x: 472, y: 430, w: 55, h: 42, kind: 'route' },
    { id: 'route-8', x: 489, y: 370, w: 60, h: 45, kind: 'route' },
    { id: 'circhester', x: 519, y: 300, w: 60, h: 46, kind: 'city' },
    { id: 'circhester-bay', x: 502, y: 350, w: 44, h: 42, kind: 'route' },
    { id: 'route-9', x: 512, y: 440, w: 58, h: 48, kind: 'route' },
    { id: 'spikemuth', x: 562, y: 406, w: 52, h: 42, kind: 'town' },
    // — Route 10 up to Wyndon (Pokémon League / Rose Tower) —
    { id: 'route-10', x: 417, y: 240, w: 55, h: 95, kind: 'route' },
    { id: 'wyndon', x: 366, y: 110, w: 122, h: 96, kind: 'city' },
    // — Isle of Armor DLC (composited inset in the left gutter, y~360-605;
    //   dense but hover tooltips carry the names) —
    { id: 'honeycalm-island', x: 70, y: 386, w: 33, h: 27, kind: 'route' },
    { id: 'honeycalm-sea', x: 36, y: 416, w: 31, h: 27, kind: 'route' },
    { id: 'potbottom-desert', x: 125, y: 394, w: 43, h: 24, kind: 'route' },
    { id: 'warm-up-tunnel', x: 142, y: 420, w: 31, h: 22, kind: 'cave' },
    { id: 'challenge-road', x: 107, y: 420, w: 33, h: 22, kind: 'route' },
    { id: 'brawlers-cave', x: 85, y: 435, w: 29, h: 22, kind: 'cave' },
    { id: 'forest-of-focus', x: 115, y: 443, w: 37, h: 25, kind: 'forest' },
    { id: 'loop-lagoon', x: 152, y: 447, w: 33, h: 25, kind: 'route' },
    { id: 'fields-of-honor', x: 56, y: 441, w: 31, h: 25, kind: 'route' },
    { id: 'challenge-beach', x: 77, y: 459, w: 33, h: 24, kind: 'route' },
    { id: 'soothing-wetlands', x: 89, y: 483, w: 39, h: 24, kind: 'route' },
    { id: 'training-lowlands', x: 123, y: 475, w: 37, h: 24, kind: 'route' },
    { id: 'courageous-cavern', x: 140, y: 498, w: 33, h: 22, kind: 'cave' },
    { id: 'workout-sea', x: 179, y: 416, w: 37, h: 27, kind: 'route' },
    { id: 'stepping-stone-sea', x: 170, y: 508, w: 39, h: 27, kind: 'route' },
    { id: 'insular-sea', x: 34, y: 451, w: 31, h: 27, kind: 'route' },
    // — Crown Tundra DLC (composited inset in the left gutter, y~40-327:
    //   snowy highlands north, Giant's Bed center, Ballimere/Dyna Tree south) —
    { id: 'path-to-the-peak', x: 99, y: 76, w: 27, h: 23, kind: 'route' },
    { id: 'tunnel-to-the-top', x: 107, y: 105, w: 28, h: 20, kind: 'cave' },
    { id: 'frostpoint-field', x: 74, y: 100, w: 27, h: 20, kind: 'route' },
    { id: 'old-cemetery', x: 55, y: 119, w: 27, h: 20, kind: 'route' },
    { id: 'snowslide-slope', x: 87, y: 131, w: 33, h: 27, kind: 'route' },
    { id: 'slippery-slope', x: 34, y: 144, w: 33, h: 29, kind: 'route' },
    { id: 'giants-foot', x: 143, y: 148, w: 28, h: 25, kind: 'route' },
    { id: 'three-point-pass', x: 173, y: 159, w: 20, h: 17, kind: 'route' },
    { id: 'frigid-sea', x: 202, y: 153, w: 35, h: 25, kind: 'route' },
    { id: 'roaring-sea-caves', x: 181, y: 180, w: 23, h: 17, kind: 'cave' },
    { id: 'giants-bed', x: 77, y: 196, w: 73, h: 40, kind: 'route' },
    { id: 'ballimere-lake', x: 74, y: 273, w: 37, h: 28, kind: 'route' },
    { id: 'lakeside-cave', x: 141, y: 249, w: 23, h: 17, kind: 'cave' },
    { id: 'dyna-tree-hill', x: 101, y: 256, w: 28, h: 21, kind: 'landmark' },
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
