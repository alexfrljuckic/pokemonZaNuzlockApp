// Galar layout for the SwSh interactive map. Node positions are calibrated
// against the backdrop at public/maps/galar.jpg (728x1420, official-style
// map: Postwick south / Wyndon north, numbered route banners, Isle of Armor
// inset right and Crown Tundra south — both DLC regions deliberately have
// no nodes; base-game dataset areas only). Wild Area zones get nodes across
// the two lobes (south = Rolling Fields, north = Riverbank/Bridge Field,
// north-west = Giant's Cap / Dusty Bowl / Lake of Outrage).
// victory-road-swsh is being removed (#77) and gets no node. Calibrated live
// with the debug overlay (stroked .route-region rects) per the standing map
// lesson; route-8 added with its area (BACKLOG 21) on the steam path between
// Route 7 and Circhester.
import type { GameMap } from './types';

export const GALAR_MAP: GameMap = {
  viewBox: { w: 728, h: 1420 },
  backdropSrc: '/maps/galar.jpg',
  ariaLabel: 'Galar route map',
  nodes: [
    { id: 'route-1', x: 185, y: 920, w: 55, h: 45, kind: 'route' },
    { id: 'route-2', x: 200, y: 862, w: 60, h: 45, kind: 'route' },
    { id: 'rolling-fields', x: 170, y: 795, w: 70, h: 50, kind: 'route' },
    { id: 'motostoke-riverbank', x: 220, y: 740, w: 55, h: 45, kind: 'route' },
    { id: 'bridge-field', x: 155, y: 740, w: 55, h: 45, kind: 'route' },
    { id: 'dusty-bowl', x: 250, y: 690, w: 45, h: 40, kind: 'route' },
    { id: 'giants-cap', x: 195, y: 690, w: 50, h: 40, kind: 'route' },
    { id: 'lake-of-outrage', x: 145, y: 690, w: 45, h: 40, kind: 'route' },
    { id: 'motostoke', x: 170, y: 630, w: 80, h: 55, kind: 'city' },
    { id: 'route-3', x: 158, y: 622, w: 50, h: 40, kind: 'route' },
    { id: 'galar-mine', x: 112, y: 612, w: 48, h: 40, kind: 'cave' },
    { id: 'route-4', x: 52, y: 563, w: 55, h: 45, kind: 'route' },
    { id: 'route-5', x: 115, y: 572, w: 70, h: 40, kind: 'route' },
    { id: 'hulbury', x: 283, y: 558, w: 58, h: 45, kind: 'city' },
    { id: 'hammerlocke', x: 155, y: 443, w: 82, h: 60, kind: 'city' },
    { id: 'route-6', x: 120, y: 458, w: 50, h: 45, kind: 'route' },
    { id: 'stow-on-side', x: 62, y: 418, w: 55, h: 45, kind: 'town' },
    { id: 'glimwood-tangle', x: 62, y: 288, w: 62, h: 45, kind: 'forest' },
    { id: 'ballonlea', x: 46, y: 334, w: 50, h: 42, kind: 'town' },
    { id: 'route-7', x: 243, y: 473, w: 55, h: 40, kind: 'route' },
    { id: 'route-8', x: 255, y: 425, w: 60, h: 45, kind: 'route' },
    { id: 'galar-mine-no-2', x: 258, y: 528, w: 50, h: 40, kind: 'cave' },
    { id: 'circhester', x: 288, y: 350, w: 60, h: 45, kind: 'city' },
    { id: 'circhester-bay', x: 276, y: 398, w: 42, h: 42, kind: 'route' },
    { id: 'route-9', x: 320, y: 398, w: 58, h: 48, kind: 'route' },
    { id: 'spikemuth', x: 342, y: 468, w: 50, h: 40, kind: 'town' },
    { id: 'route-10', x: 178, y: 238, w: 68, h: 98, kind: 'route' },
    // — Isle of Armor DLC (the circular inset, island ~(470-615, 400-565);
    //   placed from a 4x native-res crop; dense but hover tooltips carry
    //   the names) —
    { id: 'honeycalm-island', x: 486, y: 412, w: 34, h: 28, kind: 'route' },
    { id: 'honeycalm-sea', x: 452, y: 442, w: 32, h: 28, kind: 'route' },
    { id: 'potbottom-desert', x: 543, y: 420, w: 44, h: 24, kind: 'route' },
    { id: 'warm-up-tunnel', x: 560, y: 446, w: 32, h: 22, kind: 'cave' },
    { id: 'challenge-road', x: 524, y: 446, w: 34, h: 22, kind: 'route' },
    { id: 'brawlers-cave', x: 502, y: 462, w: 30, h: 22, kind: 'cave' },
    { id: 'forest-of-focus', x: 532, y: 470, w: 38, h: 26, kind: 'forest' },
    { id: 'loop-lagoon', x: 570, y: 474, w: 34, h: 26, kind: 'route' },
    { id: 'fields-of-honor', x: 472, y: 468, w: 32, h: 26, kind: 'route' },
    { id: 'challenge-beach', x: 494, y: 486, w: 34, h: 24, kind: 'route' },
    { id: 'soothing-wetlands', x: 506, y: 510, w: 40, h: 24, kind: 'route' },
    { id: 'training-lowlands', x: 540, y: 502, w: 38, h: 24, kind: 'route' },
    { id: 'courageous-cavern', x: 558, y: 526, w: 34, h: 22, kind: 'cave' },
    { id: 'workout-sea', x: 598, y: 442, w: 38, h: 28, kind: 'route' },
    { id: 'stepping-stone-sea', x: 588, y: 536, w: 40, h: 28, kind: 'route' },
    { id: 'insular-sea', x: 450, y: 478, w: 32, h: 28, kind: 'route' },
    // — Crown Tundra DLC (the southern landmass; placed from a 2.5x crop:
    //   snowy highlands north, Giant's Bed center, Ballimere/Dyna Tree
    //   south, Frigid Sea inlet east) —
    { id: 'path-to-the-peak', x: 184, y: 1044, w: 40, h: 34, kind: 'route' },
    { id: 'tunnel-to-the-top', x: 196, y: 1088, w: 42, h: 30, kind: 'cave' },
    { id: 'frostpoint-field', x: 146, y: 1080, w: 40, h: 30, kind: 'route' },
    { id: 'old-cemetery', x: 118, y: 1108, w: 40, h: 30, kind: 'route' },
    { id: 'snowslide-slope', x: 166, y: 1126, w: 50, h: 40, kind: 'route' },
    { id: 'slippery-slope', x: 86, y: 1146, w: 50, h: 44, kind: 'route' },
    { id: 'giants-foot', x: 250, y: 1152, w: 42, h: 38, kind: 'route' },
    { id: 'three-point-pass', x: 294, y: 1168, w: 30, h: 26, kind: 'route' },
    { id: 'frigid-sea', x: 338, y: 1160, w: 52, h: 38, kind: 'route' },
    { id: 'roaring-sea-caves', x: 306, y: 1200, w: 34, h: 26, kind: 'cave' },
    { id: 'giants-bed', x: 150, y: 1224, w: 110, h: 60, kind: 'route' },
    { id: 'ballimere-lake', x: 146, y: 1340, w: 56, h: 42, kind: 'route' },
    { id: 'lakeside-cave', x: 246, y: 1304, w: 34, h: 26, kind: 'cave' },
    { id: 'dyna-tree-hill', x: 186, y: 1314, w: 42, h: 32, kind: 'landmark' },
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
