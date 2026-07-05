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
  nodes: [
    { id: 'area-zero', x: 605, y: 610, w: 190, h: 180, kind: 'landmark' },
    { id: 'south-province-area-one', x: 600, y: 1165, w: 190, h: 100, kind: 'route' },
    { id: 'south-province-area-two', x: 420, y: 1045, w: 165, h: 105, kind: 'route' },
    { id: 'south-province-area-three', x: 830, y: 1050, w: 160, h: 105, kind: 'route' },
    { id: 'south-province-area-four', x: 1000, y: 930, w: 160, h: 105, kind: 'route' },
    { id: 'east-province-area-one', x: 1080, y: 750, w: 150, h: 110, kind: 'route' },
    { id: 'east-province-area-three', x: 1120, y: 545, w: 130, h: 95, kind: 'route' },
    { id: 'tagtree-thicket', x: 1000, y: 470, w: 150, h: 110, kind: 'forest' },
    { id: 'north-province-area-one', x: 1000, y: 320, w: 150, h: 110, kind: 'route' },
    { id: 'north-province-area-two', x: 820, y: 255, w: 145, h: 100, kind: 'route' },
    { id: 'north-province-area-three', x: 875, y: 420, w: 140, h: 100, kind: 'route' },
    { id: 'glaseado-mountain', x: 575, y: 305, w: 250, h: 180, kind: 'landmark' },
    { id: 'casseroya-lake', x: 310, y: 350, w: 230, h: 200, kind: 'landmark' },
    { id: 'west-province-area-two', x: 215, y: 545, w: 160, h: 105, kind: 'route' },
    { id: 'asado-desert', x: 285, y: 655, w: 230, h: 155, kind: 'route' },
    { id: 'west-province-area-one', x: 330, y: 850, w: 170, h: 120, kind: 'route' },
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
