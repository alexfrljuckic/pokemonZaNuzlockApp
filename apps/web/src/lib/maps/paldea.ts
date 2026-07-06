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
    { id: 'area-zero', x: 339, y: 293, w: 42, h: 30, kind: 'landmark' },
    { id: 'south-province-area-one', x: 311, y: 448, w: 84, h: 64, kind: 'route' },
    { id: 'south-province-area-two', x: 196, y: 441, w: 84, h: 64, kind: 'route' },
    { id: 'south-province-area-three', x: 401, y: 423, w: 84, h: 64, kind: 'route' },
    { id: 'south-province-area-four', x: 468, y: 361, w: 84, h: 64, kind: 'route' },
    { id: 'east-province-area-one', x: 536, y: 286, w: 84, h: 64, kind: 'route' },
    { id: 'east-province-area-three', x: 558, y: 188, w: 84, h: 64, kind: 'route' },
    { id: 'tagtree-thicket', x: 492, y: 243, w: 46, h: 40, kind: 'forest' },
    { id: 'north-province-area-one', x: 488, y: 43, w: 84, h: 64, kind: 'route' },
    { id: 'north-province-area-two', x: 243, y: 158, w: 84, h: 64, kind: 'route' },
    { id: 'north-province-area-three', x: 456, y: 153, w: 84, h: 64, kind: 'route' },
    { id: 'glaseado-mountain', x: 344, y: 80, w: 42, h: 30, kind: 'landmark' },
    { id: 'casseroya-lake', x: 182, y: 118, w: 42, h: 30, kind: 'landmark' },
    { id: 'west-province-area-two', x: 106, y: 146, w: 84, h: 64, kind: 'route' },
    { id: 'asado-desert', x: 86, y: 243, w: 84, h: 64, kind: 'route' },
    { id: 'west-province-area-one', x: 118, y: 346, w: 84, h: 64, kind: 'route' },
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
    { id: 'south-paldean-sea', x: 246, y: 545, w: 84, h: 28, kind: 'route' },
    { id: 'east-paldean-sea', x: 612, y: 309, w: 55, h: 64, kind: 'route' },
    { id: 'west-paldean-sea', x: 25, y: 309, w: 50, h: 64, kind: 'route' },
    { id: 'north-paldean-sea', x: 560, y: 38, w: 82, h: 46, kind: 'route' },
    { id: 'cabo-poco', x: 309, y: 548, w: 42, h: 28, kind: 'town' },
    { id: 'los-platos', x: 280, y: 478, w: 42, h: 28, kind: 'town' },
    { id: 'mesagoza', x: 335, y: 395, w: 42, h: 30, kind: 'city' },
    { id: 'cortondo', x: 214, y: 446, w: 42, h: 28, kind: 'town' },
    { id: 'artazon', x: 491, y: 364, w: 42, h: 28, kind: 'town' },
    { id: 'levincia', x: 545, y: 271, w: 42, h: 30, kind: 'city' },
    { id: 'cascarrafa', x: 225, y: 243, w: 42, h: 30, kind: 'city' },
    { id: 'porto-marinada', x: 122, y: 233, w: 42, h: 28, kind: 'town' },
    { id: 'medali', x: 210, y: 373, w: 42, h: 28, kind: 'town' },
    { id: 'montenevera', x: 281, y: 179, w: 42, h: 28, kind: 'town' },
    { id: 'alfornada', x: 137, y: 453, w: 42, h: 28, kind: 'town' },
    { id: 'zapapico', x: 500, y: 298, w: 42, h: 28, kind: 'town' },
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
