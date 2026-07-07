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
  /** Optional per-zone maps, keyed by the zone id from the areas' `zone:*`
   * tags (PLA). RoutesTab swaps one in while its zone is active; the main
   * `map` stays the zone-selector overview. */
  zoneMaps?: Record<string, GameMap>;
  /** Bosses can be tackled in a player-chosen order (open-order games like
   * Scarlet/Violet): shows the "fight this next" picker that pins the level
   * cap. Absent/false for linear games (BDSP, LGPE, SwSh, …) where the dataset
   * order IS the boss order, so the picker is just noise. */
  openBossOrder?: boolean;
  /** Whether this game has Pokémon Abilities. Absent = true; set false for
   * games without them (Let's Go Pikachu/Eevee) so the ability editor hides. */
  hasAbilities?: boolean;
  /** One entry per slug in dataset.versions. */
  versions: Record<string, VersionAppConfig>;
}
