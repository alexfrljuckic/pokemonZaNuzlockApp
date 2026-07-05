import type { GameDataset } from '@nuzlocke/engine';
import dataset from '@nuzlocke/datasets/games/swsh.json';
import { GALAR_MAP } from '../lib/maps/galar';
import type { GameAppConfig } from './types';

export const swshConfig: GameAppConfig = {
  dataset: dataset as GameDataset,
  cardColor: '#00a2d8',
  map: GALAR_MAP,
  versions: {
    sword: { mascot: 'zacian', theme: { id: 'swsh-sword', name: 'Sword' } },
    shield: { mascot: 'zamazenta', theme: { id: 'swsh-shield', name: 'Shield' } },
  },
};
