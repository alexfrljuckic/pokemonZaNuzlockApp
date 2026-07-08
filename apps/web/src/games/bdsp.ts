import type { GameDataset } from '@nuzlocke/engine';
import dataset from '@nuzlocke/datasets/games/bdsp.json';
import { SINNOH_MAP } from '../lib/maps/sinnoh';
import { SINNOH_ZONE_MAPS } from '../lib/maps/sinnoh-underground';
import type { GameAppConfig } from './types';

export const bdspConfig: GameAppConfig = {
  dataset: dataset as GameDataset,
  cardColor: '#3d7dca',
  map: SINNOH_MAP,
  // The Grand Underground is an alternate map toggled on top of Sinnoh (not a
  // full zone game like PLA) — RoutesTab shows a "View Grand Underground" button.
  zoneMaps: SINNOH_ZONE_MAPS,
  versions: {
    'brilliant-diamond': { mascot: 'dialga', theme: { id: 'bdsp-bd', name: 'Brilliant Diamond' } },
    'shining-pearl': { mascot: 'palkia', theme: { id: 'bdsp-sp', name: 'Shining Pearl' } },
  },
};
