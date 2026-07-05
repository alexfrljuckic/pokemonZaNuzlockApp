// Lumiose layout for the Z-A interactive map. Backdrop is an ORIGINAL
// hand-authored schematic (public/maps/lumiose.svg, 1200x1200 — same
// original-SVG pattern as Paldea/Hisui). DELIBERATELY schematic: wild zones
// sit on two rings by zone number (inner 1-10, outer 11-20, clockwise from
// south) rather than at their in-game street positions — the backdrop's
// numbered banners make the mapping obvious. Hyperspace zones are
// session-randomized DLC pocket dimensions with no geography; they get no
// nodes on purpose and list under "Other areas".
import type { GameMap } from './types';

const INNER: Array<[number, number]> = [
  [600, 860], [447, 810], [353, 680], [353, 520], [447, 390],
  [600, 340], [753, 390], [847, 520], [847, 680], [753, 810],
];
const OUTER: Array<[number, number]> = [
  [467, 1009], [252, 853], [170, 600], [252, 347], [467, 191],
  [733, 191], [948, 347], [1030, 600], [948, 853], [733, 1009],
];

export const LUMIOSE_MAP: GameMap = {
  viewBox: { w: 1200, h: 1200 },
  backdropSrc: '/maps/lumiose.svg',
  ariaLabel: 'Lumiose City wild-zone map',
  nodes: [
    ...INNER.map(([cx, cy], i) => ({
      id: `wild-zone-${i + 1}`,
      x: cx - 52,
      y: cy - 38,
      w: 104,
      h: 76,
      kind: 'route' as const,
    })),
    ...OUTER.map(([cx, cy], i) => ({
      id: `wild-zone-${i + 11}`,
      x: cx - 54,
      y: cy - 40,
      w: 108,
      h: 80,
      kind: 'route' as const,
    })),
  ],
  edges: [
    // decorative rings for the no-backdrop fallback view
    ...INNER.map((_, i): [string, string] => [`wild-zone-${i + 1}`, `wild-zone-${((i + 1) % 10) + 1}`]),
    ...OUTER.map((_, i): [string, string] => [`wild-zone-${i + 11}`, `wild-zone-${((i + 1) % 10) + 11}`]),
  ],
};
