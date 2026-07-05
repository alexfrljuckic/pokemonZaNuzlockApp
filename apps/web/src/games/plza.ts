import type { GameDataset } from '@nuzlocke/engine';
import dataset from '@nuzlocke/datasets/games/plza.json';
import { LUMIOSE_MAP } from '../lib/maps/lumiose';
import type { GameAppConfig } from './types';

export const plzaConfig: GameAppConfig = {
  dataset: dataset as GameDataset,
  cardColor: '#e0435a',
  map: LUMIOSE_MAP,
  versions: {
    'legends-z-a': { mascot: 'zygarde', theme: { id: 'plza', name: 'Lumiose (Z-A)' } },
  },
};
