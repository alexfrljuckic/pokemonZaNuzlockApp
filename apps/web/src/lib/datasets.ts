import speciesLinesRaw from '@nuzlocke/datasets/generated/species-lines.json';

// The game registry now lives in ../games (one config module per game). These
// are re-exported so existing importers of ../lib/datasets keep working.
export { DATASETS, listGames } from '../games';

// Evolution-line map (species slug -> line id), injected into the engine's
// EngineContext for the dupes-by-line clause. Not game-specific.
export const speciesToLine: Record<string, string> = speciesLinesRaw;
