// Hisui layout for the PLA interactive map. Backdrop is an ORIGINAL
// hand-authored schematic (public/maps/hisui.svg, 1200x1200 — same original-
// SVG pattern as Paldea; no traced/official assets). Seven nodes: the five
// open zones around Mt. Coronet, the Jubilife Village hub, and Ramanas
// Island offshore. Edges (fallback view only) fan out from Jubilife — that
// is how the game actually structures travel.
import type { GameMap } from './types';

export const HISUI_MAP: GameMap = {
  viewBox: { w: 1200, h: 1200 },
  backdropSrc: '/maps/hisui.svg',
  ariaLabel: 'Hisui region map',
  nodes: [
    { id: 'jubilife-village', x: 290, y: 868, w: 140, h: 88, kind: 'town' },
    { id: 'obsidian-fieldlands', x: 405, y: 760, w: 320, h: 160, kind: 'route' },
    { id: 'crimson-mirelands', x: 715, y: 505, w: 270, h: 160, kind: 'route' },
    { id: 'cobalt-coastlands', x: 845, y: 725, w: 200, h: 185, kind: 'route' },
    { id: 'coronet-highlands', x: 445, y: 295, w: 310, h: 290, kind: 'landmark' },
    { id: 'alabaster-icelands', x: 395, y: 125, w: 460, h: 210, kind: 'route' },
    { id: 'ramanas-island', x: 505, y: 1080, w: 190, h: 105, kind: 'landmark' },
  ],
  edges: [
    ['jubilife-village', 'obsidian-fieldlands'],
    ['jubilife-village', 'crimson-mirelands'],
    ['jubilife-village', 'cobalt-coastlands'],
    ['jubilife-village', 'coronet-highlands'],
    ['jubilife-village', 'alabaster-icelands'],
    ['obsidian-fieldlands', 'ramanas-island'],
  ],
};
