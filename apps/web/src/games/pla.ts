import type { GameDataset } from '@nuzlocke/engine';
import dataset from '@nuzlocke/datasets/games/pla.json';
import type { GameAppConfig } from './types';

export const plaConfig: GameAppConfig = {
  dataset: dataset as GameDataset,
  // PLA previously had no --card-color (a gap the old scattered CSS missed);
  // give it the Hisui/Arceus violet here.
  cardColor: '#9b7fc9',
  versions: {
    'legends-arceus': { mascot: 'kleavor', theme: { id: 'pla', name: 'Legends: Arceus' } },
  },
};
