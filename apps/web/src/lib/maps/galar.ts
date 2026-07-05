// Galar layout for the SwSh interactive map. Node positions are calibrated
// against the backdrop at public/maps/galar.jpg (728x1420, official-style
// map: Postwick south / Wyndon north, numbered route banners, Isle of Armor
// inset right and Crown Tundra south — both DLC regions deliberately have
// no nodes; base-game dataset areas only). Wild Area zones get nodes across
// the two lobes (south = Rolling Fields, north = Riverbank/Bridge Field,
// north-west = Giant's Cap / Dusty Bowl / Lake of Outrage). route-8 is a
// known dataset gap (BACKLOG 21) and victory-road-swsh is being removed
// (#77) — neither gets a node. Calibrated live with the debug overlay
// (stroked .route-region rects) per the standing map lesson.
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
    { id: 'circhester', x: 288, y: 350, w: 60, h: 45, kind: 'city' },
    { id: 'circhester-bay', x: 276, y: 398, w: 42, h: 42, kind: 'route' },
    { id: 'route-9', x: 320, y: 398, w: 58, h: 48, kind: 'route' },
    { id: 'spikemuth', x: 342, y: 468, w: 50, h: 40, kind: 'town' },
    { id: 'route-10', x: 178, y: 238, w: 68, h: 98, kind: 'route' },
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
    ['route-7', 'circhester'],
    ['circhester', 'circhester-bay'],
    ['circhester-bay', 'route-9'],
    ['route-9', 'spikemuth'],
    ['route-9', 'route-10'],
  ],
};
