// Paldea layout for the SV interactive map. The backdrop is an ORIGINAL
// hand-authored schematic (public/maps/paldea.svg, 1400x1400 — flat-color
// vector art drawn for this app, no traced/official assets; safe under the
// standing IP-caution constraint). SV tracks 16 broad zones rather than
// routes, so nodes are large province regions radiating around the Great
// Crater (area-zero). Edges exist only for the no-backdrop fallback view —
// the open world has no route lines. Calibrated live with the debug overlay.
import type { GameMap } from './types';

export const PALDEA_MAP: GameMap = {
  viewBox: { w: 1400, h: 1400 },
  backdropSrc: '/maps/paldea.svg',
  ariaLabel: 'Paldea region map',
  // v2 positions, recalibrated against the redrawn backdrop (real-geography
  // proportions: snow north, big central crater, Mesagoza on its south rim).
  nodes: [
    { id: 'area-zero', x: 620, y: 615, w: 240, h: 250, kind: 'landmark' },
    { id: 'south-province-area-one', x: 610, y: 1075, w: 210, h: 140, kind: 'route' },
    { id: 'south-province-area-two', x: 395, y: 1000, w: 175, h: 115, kind: 'route' },
    { id: 'south-province-area-three', x: 855, y: 1010, w: 170, h: 115, kind: 'route' },
    { id: 'south-province-area-four', x: 1000, y: 890, w: 175, h: 110, kind: 'route' },
    { id: 'east-province-area-one', x: 1115, y: 660, w: 165, h: 125, kind: 'route' },
    { id: 'east-province-area-three', x: 1160, y: 480, w: 135, h: 110, kind: 'route' },
    { id: 'tagtree-thicket', x: 1005, y: 520, w: 155, h: 110, kind: 'forest' },
    { id: 'north-province-area-one', x: 1000, y: 250, w: 175, h: 125, kind: 'route' },
    { id: 'north-province-area-two', x: 520, y: 440, w: 155, h: 100, kind: 'route' },
    { id: 'north-province-area-three', x: 900, y: 405, w: 150, h: 100, kind: 'route' },
    { id: 'glaseado-mountain', x: 560, y: 165, w: 320, h: 260, kind: 'landmark' },
    { id: 'casseroya-lake', x: 315, y: 265, w: 245, h: 215, kind: 'landmark' },
    { id: 'west-province-area-two', x: 180, y: 445, w: 180, h: 110, kind: 'route' },
    { id: 'asado-desert', x: 165, y: 560, w: 250, h: 220, kind: 'route' },
    { id: 'west-province-area-one', x: 275, y: 815, w: 195, h: 140, kind: 'route' },
  ],
  edges: [
    ['south-province-area-one', 'south-province-area-two'],
    ['south-province-area-one', 'south-province-area-three'],
    ['south-province-area-three', 'south-province-area-four'],
    ['south-province-area-four', 'east-province-area-one'],
    ['east-province-area-one', 'east-province-area-three'],
    ['east-province-area-three', 'tagtree-thicket'],
    ['tagtree-thicket', 'north-province-area-one'],
    ['north-province-area-one', 'north-province-area-two'],
    ['north-province-area-two', 'glaseado-mountain'],
    ['north-province-area-three', 'glaseado-mountain'],
    ['glaseado-mountain', 'casseroya-lake'],
    ['casseroya-lake', 'west-province-area-two'],
    ['west-province-area-two', 'asado-desert'],
    ['asado-desert', 'west-province-area-one'],
    ['west-province-area-one', 'south-province-area-two'],
    ['area-zero', 'south-province-area-one'],
  ],
};
