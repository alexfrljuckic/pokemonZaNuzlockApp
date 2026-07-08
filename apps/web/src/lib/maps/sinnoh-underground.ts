// BDSP Grand Underground — an alternate map toggled on top of the Sinnoh
// overworld (RoutesTab shows a "View Grand Underground" button; the underground
// isn't tied to one overworld spot, so it isn't a Sinnoh node).
//
// Backdrop is Alex's uploaded community map (public/maps/bdspUnderground.jpg,
// 1267x900, "by Skudde"). That art charts item pickups + sphere traders but
// does NOT label the hideaways by name, so these 18 node positions are
// APPROXIMATE — one node per hideaway, spread across the map's big rooms so
// they're clickable, not calibrated to a specific named room (the source can't
// support that). The node id is what matters — it opens the right hideaway's
// encounter pool.
import type { GameMap } from './types';

export const SINNOH_UNDERGROUND_MAP: GameMap = {
  viewBox: { w: 1267, h: 900 },
  backdropSrc: '/maps/bdspUnderground.jpg',
  ariaLabel: 'BDSP Grand Underground map',
  // the community item-guide backdrop is busy — highlight every unresolved
  // hideaway so the small nodes are easy to spot.
  highlightAllNodes: true,
  nodes: [
    { id: 'grand-underground-rocky-cave', x: 280, y: 106, w: 52, h: 46, kind: 'cave' },
    { id: 'grand-underground-big-bluff-cavern', x: 545, y: 123, w: 52, h: 46, kind: 'cave' },
    { id: 'grand-underground-typhlo-cavern', x: 870, y: 233, w: 52, h: 46, kind: 'cave' },
    { id: 'grand-underground-sandsear-cave', x: 1070, y: 168, w: 52, h: 46, kind: 'cave' },
    { id: 'grand-underground-volcanic-cave', x: 865, y: 523, w: 52, h: 46, kind: 'cave' },
    { id: 'grand-underground-grassland-cave', x: 325, y: 408, w: 52, h: 46, kind: 'cave' },
    { id: 'grand-underground-sunlit-cavern', x: 410, y: 426, w: 52, h: 46, kind: 'cave' },
    { id: 'grand-underground-dazzling-cave', x: 300, y: 323, w: 52, h: 46, kind: 'cave' },
    { id: 'grand-underground-stargleam-cavern', x: 705, y: 468, w: 52, h: 46, kind: 'cave' },
    { id: 'grand-underground-swampy-cave', x: 575, y: 273, w: 52, h: 46, kind: 'cave' },
    { id: 'grand-underground-bogsunk-cavern', x: 465, y: 320, w: 52, h: 46, kind: 'cave' },
    { id: 'grand-underground-icy-cave', x: 330, y: 658, w: 52, h: 46, kind: 'cave' },
    { id: 'grand-underground-glacial-cavern', x: 220, y: 483, w: 52, h: 46, kind: 'cave' },
    { id: 'grand-underground-whiteout-cave', x: 915, y: 438, w: 52, h: 46, kind: 'cave' },
    { id: 'grand-underground-still-water-cavern', x: 675, y: 698, w: 52, h: 46, kind: 'cave' },
    { id: 'grand-underground-fountainspring-cave', x: 1080, y: 618, w: 52, h: 46, kind: 'cave' },
    { id: 'grand-underground-riverbank-cave', x: 535, y: 688, w: 52, h: 46, kind: 'cave' },
    { id: 'grand-underground-spacious-cave', x: 1200, y: 448, w: 52, h: 46, kind: 'cave' },
  ],
  edges: [],
};

/** BDSP alternate maps, keyed by the toggle id RoutesTab looks up. */
export const SINNOH_ZONE_MAPS: Record<string, GameMap> = {
  'grand-underground': SINNOH_UNDERGROUND_MAP,
};
