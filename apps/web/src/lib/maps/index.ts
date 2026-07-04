import type { GameMap } from './types';
import { SINNOH_MAP } from './sinnoh';
import { KANTO_MAP } from './kanto';

export type { GameMap, MapNode, MapNodeKind } from './types';
export { mapHelpers } from './types';

/** Games with a schematic interactive route map, keyed by gameId. Games
 * absent here fall back to the flat area list in RoutesTab. */
export const GAME_MAPS: Record<string, GameMap> = {
  bdsp: SINNOH_MAP,
  lgpe: KANTO_MAP,
};
