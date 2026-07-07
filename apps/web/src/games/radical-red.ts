import type { GameDataset } from '@nuzlocke/engine';
import dataset from '@nuzlocke/datasets/games/radical-red.json';
import { KANTO_MAP } from '../lib/maps/kanto';
import type { GameAppConfig } from './types';

// Radical Red — a FireRed ROM hack (Kanto + Sevii). First non-mainline game.
// Reuses the LGPE Kanto map (same region); RR's floor-split dungeons + Sevii +
// Safari sub-zones aren't on the map and fall into the "Other areas" list. No
// PokeAPI version group, so move learn-levels degrade to "unknown" (handled).
// See docs/RADICAL-RED-RESEARCH.md.
export const radicalRedConfig: GameAppConfig = {
  dataset: dataset as GameDataset,
  cardColor: '#e03131',
  map: KANTO_MAP,
  versions: {
    'radical-red': { mascot: 'charizard', theme: { id: 'radical-red', name: 'Radical Red' } },
  },
};
