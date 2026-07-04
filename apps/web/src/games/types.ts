import type { GameDataset } from '@nuzlocke/engine';
import type { GameMap } from '../lib/maps/types';
import type { ThemeId } from '../lib/theme';

// Everything the web app needs to register one game, in one place. Adding a
// game = one games/<id>.ts exporting this + one line in games/index.ts (plus a
// CSS palette block for the theme). See docs/CONSOLIDATION.md item C1.

export interface VersionAppConfig {
  /** Cover-tile mascot species (a Showdown sprite — no IP-heavy box art). */
  mascot: string;
  /** The color theme this version selects, and its dropdown label. */
  theme: { id: ThemeId; name: string };
}

export interface GameAppConfig {
  dataset: GameDataset;
  /** Accent color for the game-picker card (drives --card-color). */
  cardColor: string;
  /** Optional schematic interactive route map. */
  map?: GameMap;
  /** One entry per slug in dataset.versions. */
  versions: Record<string, VersionAppConfig>;
}
