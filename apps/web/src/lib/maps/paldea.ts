// Paldea layout for the SV interactive map. Backdrop is the region map Alex
// uploaded (public/maps/paldea.png, 678x578 — the in-game-style map with
// gym-leader pins), which replaced the earlier hand-authored original-SVG
// schematic. Node rects are broad province regions placed on the real
// geography: the Great Crater dead center (Area Zero), Glaseado snowfields
// across the north, Casseroya NW, Asado desert west, Mesagoza on the
// crater's southern rim. Zones, not routes — SV tracks one encounter per
// province area.
import type { GameMap } from './types';

export const PALDEA_MAP: GameMap = {
  viewBox: { w: 678, h: 578 },
  backdropSrc: '/maps/paldea.png',
  ariaLabel: 'Paldea region map',
  nodes: [
    { id: 'area-zero', x: 290, y: 235, w: 140, h: 145, kind: 'landmark' },
    { id: 'south-province-area-one', x: 295, y: 435, w: 115, h: 90, kind: 'route' },
    { id: 'south-province-area-two', x: 185, y: 430, w: 105, h: 85, kind: 'route' },
    { id: 'south-province-area-three', x: 390, y: 415, w: 105, h: 80, kind: 'route' },
    { id: 'south-province-area-four', x: 455, y: 350, w: 110, h: 85, kind: 'route' },
    { id: 'east-province-area-one', x: 525, y: 275, w: 105, h: 85, kind: 'route' },
    { id: 'east-province-area-three', x: 555, y: 180, w: 90, h: 80, kind: 'route' },
    { id: 'tagtree-thicket', x: 470, y: 230, w: 90, h: 65, kind: 'forest' },
    { id: 'north-province-area-one', x: 470, y: 30, w: 120, h: 90, kind: 'route' },
    { id: 'north-province-area-two', x: 235, y: 155, w: 100, h: 70, kind: 'route' },
    { id: 'north-province-area-three', x: 445, y: 145, w: 105, h: 80, kind: 'route' },
    { id: 'glaseado-mountain', x: 270, y: 40, w: 190, h: 110, kind: 'landmark' },
    { id: 'casseroya-lake', x: 145, y: 85, w: 115, h: 95, kind: 'landmark' },
    { id: 'west-province-area-two', x: 95, y: 135, w: 105, h: 85, kind: 'route' },
    { id: 'asado-desert', x: 70, y: 225, w: 115, h: 100, kind: 'route' },
    { id: 'west-province-area-one', x: 100, y: 330, w: 120, h: 95, kind: 'route' },
  ],
  edges: [
    // decorative, fallback view only — the open world has no route lines
    ['south-province-area-one', 'south-province-area-two'],
    ['south-province-area-one', 'south-province-area-three'],
    ['south-province-area-three', 'south-province-area-four'],
    ['south-province-area-four', 'east-province-area-one'],
    ['east-province-area-one', 'east-province-area-three'],
    ['east-province-area-three', 'tagtree-thicket'],
    ['tagtree-thicket', 'north-province-area-three'],
    ['north-province-area-three', 'north-province-area-one'],
    ['north-province-area-three', 'glaseado-mountain'],
    ['glaseado-mountain', 'north-province-area-two'],
    ['north-province-area-two', 'casseroya-lake'],
    ['casseroya-lake', 'west-province-area-two'],
    ['west-province-area-two', 'asado-desert'],
    ['asado-desert', 'west-province-area-one'],
    ['west-province-area-one', 'south-province-area-two'],
    ['area-zero', 'south-province-area-one'],
  ],
};
