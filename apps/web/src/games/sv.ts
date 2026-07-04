import type { GameDataset } from '@nuzlocke/engine';
import dataset from '@nuzlocke/datasets/games/sv.json';
import type { GameAppConfig } from './types';

export const svConfig: GameAppConfig = {
  dataset: dataset as GameDataset,
  cardColor: '#c8102e',
  versions: {
    scarlet: { mascot: 'koraidon', theme: { id: 'sv-scarlet', name: 'Scarlet' } },
    violet: { mascot: 'miraidon', theme: { id: 'sv-violet', name: 'Violet' } },
  },
};
