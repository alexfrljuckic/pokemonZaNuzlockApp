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
    // — audit additions (#audit 2026-07-06): the 13 wild locations Serebii
    //   lists beyond the original 16, then towns (drawn after the province
    //   blobs so their smaller rects stack clickable on top) —
    { id: 'poco-path', x: 290, y: 512, w: 50, h: 34, kind: 'route' },
    { id: 'inlet-grotto', x: 338, y: 528, w: 40, h: 28, kind: 'cave' },
    { id: 'south-province-area-five', x: 445, y: 445, w: 72, h: 55, kind: 'route' },
    { id: 'south-province-area-six', x: 118, y: 478, w: 82, h: 60, kind: 'route' },
    { id: 'alfornada-cavern', x: 92, y: 452, w: 42, h: 28, kind: 'cave' },
    { id: 'east-province-area-two', x: 558, y: 340, w: 58, h: 46, kind: 'route' },
    { id: 'west-province-area-three', x: 72, y: 112, w: 58, h: 46, kind: 'route' },
    { id: 'dalizapa-passage', x: 428, y: 205, w: 58, h: 40, kind: 'route' },
    { id: 'socarrat-trail', x: 272, y: 205, w: 56, h: 40, kind: 'route' },
    { id: 'south-paldean-sea', x: 245, y: 545, w: 85, h: 28, kind: 'route' },
    { id: 'east-paldean-sea', x: 612, y: 300, w: 55, h: 82, kind: 'route' },
    { id: 'west-paldean-sea', x: 25, y: 300, w: 50, h: 82, kind: 'route' },
    { id: 'north-paldean-sea', x: 560, y: 38, w: 82, h: 46, kind: 'route' },
    { id: 'cabo-poco', x: 308, y: 548, w: 44, h: 28, kind: 'town' },
    { id: 'los-platos', x: 278, y: 478, w: 46, h: 28, kind: 'town' },
    { id: 'mesagoza', x: 315, y: 385, w: 82, h: 50, kind: 'city' },
    { id: 'cortondo', x: 212, y: 445, w: 46, h: 30, kind: 'town' },
    { id: 'artazon', x: 488, y: 362, w: 48, h: 32, kind: 'town' },
    { id: 'levincia', x: 542, y: 268, w: 48, h: 35, kind: 'city' },
    { id: 'cascarrafa', x: 222, y: 242, w: 48, h: 32, kind: 'city' },
    { id: 'porto-marinada', x: 118, y: 232, w: 50, h: 30, kind: 'town' },
    { id: 'medali', x: 208, y: 372, w: 46, h: 30, kind: 'town' },
    { id: 'montenevera', x: 278, y: 178, w: 48, h: 30, kind: 'town' },
    { id: 'alfornada', x: 135, y: 452, w: 45, h: 30, kind: 'town' },
    { id: 'zapapico', x: 498, y: 298, w: 45, h: 28, kind: 'town' },
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
