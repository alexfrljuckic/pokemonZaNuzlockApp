import type { GameDataset } from '@nuzlocke/engine';
import bdsp from '@nuzlocke/datasets/games/bdsp.json';
import plza from '@nuzlocke/datasets/games/plza.json';
import lgpe from '@nuzlocke/datasets/games/lgpe.json';
import swsh from '@nuzlocke/datasets/games/swsh.json';
import pla from '@nuzlocke/datasets/games/pla.json';
import speciesLinesRaw from '@nuzlocke/datasets/generated/species-lines.json';

export const DATASETS: Record<string, GameDataset> = {
  bdsp: bdsp as GameDataset,
  plza: plza as GameDataset,
  lgpe: lgpe as GameDataset,
  swsh: swsh as GameDataset,
  pla: pla as GameDataset,
};

export const speciesToLine: Record<string, string> = speciesLinesRaw;

export function listGames(): GameDataset[] {
  return Object.values(DATASETS);
}
