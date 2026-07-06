import type { GameDataset } from '@nuzlocke/engine';
import dataset from '@nuzlocke/datasets/games/pla.json';
import { HISUI_MAP } from '../lib/maps/hisui';
import { HISUI_ZONE_MAPS } from '../lib/maps/hisui-zones';
import type { GameAppConfig } from './types';

export const plaConfig: GameAppConfig = {
  dataset: dataset as GameDataset,
  // PLA previously had no --card-color (a gap the old scattered CSS missed);
  // give it the Hisui/Arceus violet here.
  cardColor: '#9b7fc9',
  map: HISUI_MAP,
  zoneMaps: HISUI_ZONE_MAPS,
  versions: {
    // Arceus itself — the cover legendary, matching every other game's tile
    'legends-arceus': { mascot: 'arceus', theme: { id: 'pla', name: 'Legends: Arceus' } },
  },
};
