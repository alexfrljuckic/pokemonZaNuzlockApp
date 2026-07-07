import type { GameDataset } from '@nuzlocke/engine';
import dataset from '@nuzlocke/datasets/games/lgpe.json';
import { KANTO_MAP } from '../lib/maps/kanto';
import type { GameAppConfig } from './types';

export const lgpeConfig: GameAppConfig = {
  dataset: dataset as GameDataset,
  cardColor: '#e3b505',
  map: KANTO_MAP,
  hasAbilities: false, // Let's Go Pikachu/Eevee have no Abilities
  versions: {
    'lets-go-pikachu': { mascot: 'pikachu', theme: { id: 'lgpe-pikachu', name: "Let's Go Pikachu" } },
    'lets-go-eevee': { mascot: 'eevee', theme: { id: 'lgpe-eevee', name: "Let's Go Eevee" } },
  },
};
