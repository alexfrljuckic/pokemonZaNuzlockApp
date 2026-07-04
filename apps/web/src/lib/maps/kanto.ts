// Kanto layout for the LGPE interactive map (cross-game extension of UX
// section E). Node positions are calibrated against the community-standard
// Kanto route-map backdrop at public/maps/kanto.png (2048x1448, numbered
// route banners 01-25) using real Kanto adjacency to place the areas our
// dataset actually tracks — LGPE only models a subset of routes/locations,
// so several numbered banners on the backdrop (7, 8, 13-15, 19, 21, 23-25)
// have no corresponding node here.
import type { GameMap } from './types';

export const KANTO_MAP: GameMap = {
  viewBox: { w: 2048, h: 1448 },
  backdropSrc: '/maps/kanto.png',
  ariaLabel: 'Kanto route map',
  nodes: [
    { id: 'route-1', x: 501, y: 811, w: 110, h: 90, kind: 'route' },
    { id: 'route-2', x: 501, y: 555, w: 110, h: 90, kind: 'route' },
    { id: 'viridian-forest', x: 370, y: 440, w: 120, h: 110, kind: 'forest' },
    { id: 'route-3', x: 742, y: 298, w: 140, h: 90, kind: 'route' },
    { id: 'mt-moon', x: 901, y: 205, w: 110, h: 110, kind: 'cave' },
    { id: 'route-4', x: 1132, y: 259, w: 140, h: 90, kind: 'route' },
    { id: 'cerulean-cave', x: 1180, y: 130, w: 100, h: 100, kind: 'cave' },
    { id: 'route-5', x: 1336, y: 323, w: 90, h: 110, kind: 'route' },
    { id: 'route-6', x: 1336, y: 592, w: 90, h: 140, kind: 'route' },
    { id: 'route-9', x: 1597, y: 259, w: 140, h: 90, kind: 'route' },
    { id: 'route-10', x: 1769, y: 410, w: 90, h: 140, kind: 'route' },
    { id: 'power-plant', x: 1810, y: 210, w: 100, h: 100, kind: 'landmark' },
    { id: 'rock-tunnel', x: 1810, y: 340, w: 100, h: 100, kind: 'cave' },
    { id: 'route-11', x: 1647, y: 780, w: 140, h: 90, kind: 'route' },
    { id: 'route-12', x: 1836, y: 660, w: 90, h: 140, kind: 'route' },
    { id: 'route-16', x: 824, y: 456, w: 140, h: 90, kind: 'route' },
    { id: 'route-17', x: 729, y: 709, w: 90, h: 140, kind: 'route' },
    { id: 'route-18', x: 872, y: 1157, w: 140, h: 90, kind: 'route' },
    { id: 'seafoam-islands', x: 850, y: 1280, w: 110, h: 110, kind: 'cave' },
    { id: 'pokemon-mansion', x: 400, y: 1310, w: 110, h: 110, kind: 'landmark' },
    { id: 'route-20', x: 916, y: 1331, w: 140, h: 90, kind: 'route' },
    { id: 'route-22', x: 338, y: 665, w: 140, h: 90, kind: 'route' },
  ],
  edges: [
    ['route-22', 'route-1'],
    ['route-1', 'route-2'],
    ['route-2', 'viridian-forest'],
    ['route-2', 'route-3'],
    ['route-3', 'mt-moon'],
    ['mt-moon', 'route-4'],
    ['route-4', 'cerulean-cave'],
    ['route-4', 'route-5'],
    ['route-5', 'route-6'],
    ['route-4', 'route-9'],
    ['route-9', 'route-10'],
    ['route-10', 'rock-tunnel'],
    ['rock-tunnel', 'power-plant'],
    ['route-6', 'route-11'],
    ['route-11', 'route-12'],
    ['route-12', 'route-10'],
    ['route-16', 'route-6'],
    ['route-16', 'route-17'],
    ['route-17', 'route-18'],
    ['route-18', 'route-20'],
    ['route-20', 'seafoam-islands'],
    ['route-20', 'pokemon-mansion'],
  ],
};
