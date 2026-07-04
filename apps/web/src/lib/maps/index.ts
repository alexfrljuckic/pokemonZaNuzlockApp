export type { GameMap, MapNode, MapNodeKind } from './types';
export { mapHelpers } from './types';

// Route maps are now declared on each game's config (games/<id>.ts) and
// collected in the registry. Re-exported here so map importers are unchanged.
export { GAME_MAPS } from '../../games';
