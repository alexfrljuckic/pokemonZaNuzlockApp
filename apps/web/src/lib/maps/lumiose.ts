// Lumiose layout for the Z-A interactive map. Backdrop is the in-game-style
// city map Alex uploaded (public/maps/lumiose.jpg, 1920x1920) with all 20
// wild zones badge-numbered at their REAL locations — this replaced the
// earlier deliberately-schematic original-SVG ring layout. Node rects are
// centered on each zone's numbered badge, calibrated live with the debug
// overlay. Hyperspace zones are session-randomized DLC pocket dimensions
// with no geography; they get no nodes on purpose and list under
// "Other areas".
import type { GameMap } from './types';

// Zone-badge centers on the 1920x1920 backdrop, indexed by zone number.
// Located programmatically: darkest-patch search around visual estimates
// (the numbered badges are the only large dark features), then verified
// with wide-patch luminance sampling so none snapped to a small POI icon.
const BADGES: Array<[number, number]> = [
  [1129, 1779], [1185, 1245], [941, 521], [1090, 285], [785, 1150],
  [1724, 1046], [538, 824], [1343, 811], [236, 1090], [300, 1245],
  [1590, 1140], [800, 1560], [765, 145], [217, 816], [1540, 355],
  [712, 1291], [1453, 1507], [381, 373], [1540, 605], [955, 965],
];

export const LUMIOSE_MAP: GameMap = {
  viewBox: { w: 1920, h: 1920 },
  backdropSrc: '/maps/lumiose.jpg',
  ariaLabel: 'Lumiose City wild-zone map',
  nodes: BADGES.map(([cx, cy], i) => ({
    id: `wild-zone-${i + 1}`,
    x: Math.max(10, Math.min(1750, cx - 80)),
    y: Math.max(10, Math.min(1786, cy - 62)),
    w: 160,
    h: 124,
    kind: 'route' as const,
  })),
  edges: [
    // decorative rings for the no-backdrop fallback view only
    ...Array.from({ length: 10 }, (_, i): [string, string] => [`wild-zone-${i + 1}`, `wild-zone-${((i + 1) % 10) + 1}`]),
    ...Array.from({ length: 10 }, (_, i): [string, string] => [`wild-zone-${i + 11}`, `wild-zone-${((i + 1) % 10) + 11}`]),
  ],
};
