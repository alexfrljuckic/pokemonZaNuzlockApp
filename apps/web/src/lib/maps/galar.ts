// Galar layout for the SwSh interactive map. Calibrated against the composited
// backdrop at public/maps/galar-combined.jpg (1200x1200): the base region is the
// official labeled map galar2.jpg (Postwick south / Wyndon north, cities labeled
// + wild-area points numbered 1-26), and the two DLC islands cropped out of the
// old galar.jpg are composited into the empty left margin — Crown Tundra top-left
// (~x8-248, y115-402), Isle of Armor below it (~x8-248, y440-685). galar2 has no
// DLC on it, so this keeps the better base map while preserving all DLC areas on
// their own insets. DLC node coords are the old galar.jpg positions run through
// the same crop+scale+translate transform (see scripts note below). Calibrated
// live with the debug overlay (stroked .route-region rects) per the standing lesson.
import type { GameMap } from './types';

export const GALAR_MAP: GameMap = {
  viewBox: { w: 1200, h: 1200 },
  backdropSrc: '/maps/galar-combined.jpg',
  ariaLabel: 'Galar route map',
  nodes: [
    // — south: Postwick / Wedgehurst / Route 1-2 into the South Wild Area —
    { id: 'postwick', x: 525, y: 1005, w: 55, h: 45, kind: 'town' },
    { id: 'wedgehurst', x: 565, y: 958, w: 55, h: 42, kind: 'town' },
    { id: 'route-1', x: 500, y: 995, w: 45, h: 35, kind: 'route' },
    { id: 'route-2', x: 540, y: 912, w: 55, h: 42, kind: 'route' },
    // — South Wild Area (Rolling Fields cluster) —
    { id: 'rolling-fields', x: 470, y: 815, w: 70, h: 55, kind: 'route' },
    // — Motostoke (Fire Gym) + its mine / routes —
    { id: 'motostoke', x: 455, y: 705, w: 78, h: 55, kind: 'city' },
    { id: 'route-3', x: 430, y: 682, w: 45, h: 38, kind: 'route' },
    { id: 'galar-mine', x: 375, y: 700, w: 48, h: 42, kind: 'cave' },
    // — Turffield (Grass Gym) + Route 4/5 west —
    { id: 'turffield', x: 383, y: 635, w: 56, h: 46, kind: 'town' },
    { id: 'route-4', x: 378, y: 600, w: 50, h: 40, kind: 'route' },
    { id: 'route-5', x: 440, y: 632, w: 65, h: 40, kind: 'route' },
    // — Hulbury (Water Gym) east + Galar Mine No.2 —
    { id: 'hulbury', x: 595, y: 622, w: 58, h: 45, kind: 'city' },
    { id: 'galar-mine-no-2', x: 568, y: 688, w: 50, h: 40, kind: 'cave' },
    // — North Wild Area (Riverbank / Bridge Field / Giant's Cap / Dusty Bowl /
    //   Lake of Outrage) —
    { id: 'motostoke-riverbank', x: 448, y: 668, w: 55, h: 45, kind: 'route' },
    { id: 'bridge-field', x: 518, y: 668, w: 55, h: 45, kind: 'route' },
    { id: 'giants-cap', x: 472, y: 598, w: 52, h: 42, kind: 'route' },
    { id: 'dusty-bowl', x: 540, y: 600, w: 46, h: 40, kind: 'route' },
    { id: 'lake-of-outrage', x: 430, y: 585, w: 46, h: 40, kind: 'route' },
    // — Hammerlocke (Dragon Gym) central + Route 6 west to Stow/Ballonlea —
    { id: 'hammerlocke', x: 452, y: 562, w: 80, h: 55, kind: 'city' },
    { id: 'route-6', x: 418, y: 538, w: 50, h: 40, kind: 'route' },
    { id: 'stow-on-side', x: 402, y: 522, w: 56, h: 46, kind: 'town' },
    { id: 'glimwood-tangle', x: 382, y: 468, w: 58, h: 46, kind: 'forest' },
    { id: 'ballonlea', x: 362, y: 423, w: 52, h: 44, kind: 'town' },
    // — Route 7/8 east to Circhester (Rock/Ice Gym), Route 9 to Spikemuth —
    { id: 'route-7', x: 538, y: 542, w: 55, h: 42, kind: 'route' },
    { id: 'route-8', x: 555, y: 482, w: 60, h: 45, kind: 'route' },
    { id: 'circhester', x: 585, y: 412, w: 60, h: 46, kind: 'city' },
    { id: 'circhester-bay', x: 568, y: 462, w: 44, h: 42, kind: 'route' },
    { id: 'route-9', x: 578, y: 552, w: 58, h: 48, kind: 'route' },
    { id: 'spikemuth', x: 628, y: 518, w: 52, h: 42, kind: 'town' },
    // — Route 10 up to Wyndon (Pokémon League / Rose Tower) —
    { id: 'route-10', x: 483, y: 352, w: 55, h: 95, kind: 'route' },
    { id: 'wyndon', x: 432, y: 222, w: 122, h: 96, kind: 'city' },
    // — Isle of Armor DLC (composited inset in the left margin, y~440-685;
    //   dense but hover tooltips carry the names) —
    { id: 'honeycalm-island', x: 78, y: 466, w: 33, h: 27, kind: 'route' },
    { id: 'honeycalm-sea', x: 44, y: 496, w: 31, h: 27, kind: 'route' },
    { id: 'potbottom-desert', x: 133, y: 474, w: 43, h: 24, kind: 'route' },
    { id: 'warm-up-tunnel', x: 150, y: 500, w: 31, h: 22, kind: 'cave' },
    { id: 'challenge-road', x: 115, y: 500, w: 33, h: 22, kind: 'route' },
    { id: 'brawlers-cave', x: 93, y: 515, w: 29, h: 22, kind: 'cave' },
    { id: 'forest-of-focus', x: 123, y: 523, w: 37, h: 25, kind: 'forest' },
    { id: 'loop-lagoon', x: 160, y: 527, w: 33, h: 25, kind: 'route' },
    { id: 'fields-of-honor', x: 64, y: 521, w: 31, h: 25, kind: 'route' },
    { id: 'challenge-beach', x: 85, y: 539, w: 33, h: 24, kind: 'route' },
    { id: 'soothing-wetlands', x: 97, y: 563, w: 39, h: 24, kind: 'route' },
    { id: 'training-lowlands', x: 131, y: 555, w: 37, h: 24, kind: 'route' },
    { id: 'courageous-cavern', x: 148, y: 578, w: 33, h: 22, kind: 'cave' },
    { id: 'workout-sea', x: 187, y: 496, w: 37, h: 27, kind: 'route' },
    { id: 'stepping-stone-sea', x: 178, y: 588, w: 39, h: 27, kind: 'route' },
    { id: 'insular-sea', x: 42, y: 531, w: 31, h: 27, kind: 'route' },
    // — Crown Tundra DLC (composited inset in the left margin, y~115-402:
    //   snowy highlands north, Giant's Bed center, Ballimere/Dyna Tree south) —
    { id: 'path-to-the-peak', x: 107, y: 151, w: 27, h: 23, kind: 'route' },
    { id: 'tunnel-to-the-top', x: 115, y: 180, w: 28, h: 20, kind: 'cave' },
    { id: 'frostpoint-field', x: 82, y: 175, w: 27, h: 20, kind: 'route' },
    { id: 'old-cemetery', x: 63, y: 194, w: 27, h: 20, kind: 'route' },
    { id: 'snowslide-slope', x: 95, y: 206, w: 33, h: 27, kind: 'route' },
    { id: 'slippery-slope', x: 42, y: 219, w: 33, h: 29, kind: 'route' },
    { id: 'giants-foot', x: 151, y: 223, w: 28, h: 25, kind: 'route' },
    { id: 'three-point-pass', x: 181, y: 234, w: 20, h: 17, kind: 'route' },
    { id: 'frigid-sea', x: 210, y: 228, w: 35, h: 25, kind: 'route' },
    { id: 'roaring-sea-caves', x: 189, y: 255, w: 23, h: 17, kind: 'cave' },
    { id: 'giants-bed', x: 85, y: 271, w: 73, h: 40, kind: 'route' },
    { id: 'ballimere-lake', x: 82, y: 348, w: 37, h: 28, kind: 'route' },
    { id: 'lakeside-cave', x: 149, y: 324, w: 23, h: 17, kind: 'cave' },
    { id: 'dyna-tree-hill', x: 109, y: 331, w: 28, h: 21, kind: 'landmark' },
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
