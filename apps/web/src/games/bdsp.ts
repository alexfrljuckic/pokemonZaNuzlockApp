import type { GameDataset } from '@nuzlocke/engine';
import dataset from '@nuzlocke/datasets/games/bdsp.json';
import { SINNOH_MAP } from '../lib/maps/sinnoh';
import type { GameAppConfig } from './types';

export const bdspConfig: GameAppConfig = {
  dataset: dataset as GameDataset,
  cardColor: '#3d7dca',
  map: SINNOH_MAP,
  versions: {
    'brilliant-diamond': { mascot: 'dialga', theme: { id: 'bdsp-bd', name: 'Brilliant Diamond' } },
    'shining-pearl': { mascot: 'palkia', theme: { id: 'bdsp-sp', name: 'Shining Pearl' } },
  },
};
