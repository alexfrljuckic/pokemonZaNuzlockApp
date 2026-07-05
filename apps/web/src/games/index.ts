import type { GameDataset } from '@nuzlocke/engine';
import type { GameMap } from '../lib/maps/types';
import type { ThemeId } from '../lib/theme';
import type { GameAppConfig } from './types';
import { bdspConfig } from './bdsp';
import { plzaConfig } from './plza';
import { lgpeConfig } from './lgpe';
import { swshConfig } from './swsh';
import { plaConfig } from './pla';
import { svConfig } from './sv';

export type { GameAppConfig, VersionAppConfig } from './types';

// The single game registry. Adding a game = one games/<id>.ts + one line here
// (+ a CSS palette block for its theme). Order drives the game-picker cards.
export const GAMES: GameAppConfig[] = [bdspConfig, plzaConfig, lgpeConfig, swshConfig, plaConfig, svConfig];

export const DATASETS: Record<string, GameDataset> = Object.fromEntries(
  GAMES.map((g) => [g.dataset.gameId, g.dataset]),
);

export function listGames(): GameDataset[] {
  return GAMES.map((g) => g.dataset);
}

// Games with a schematic route map, keyed by gameId. Absent games fall back to
// the flat area list in RoutesTab.
export const GAME_MAPS: Record<string, GameMap> = Object.fromEntries(
  GAMES.filter((g) => g.map).map((g) => [g.dataset.gameId, g.map as GameMap]),
);

// Per-zone maps (PLA): gameId -> zoneId -> map. RoutesTab swaps one in while
// its zone is active; the game's `map` stays the zone-selector overview.
export const ZONE_MAPS: Record<string, Record<string, GameMap>> = Object.fromEntries(
  GAMES.filter((g) => g.zoneMaps).map((g) => [g.dataset.gameId, g.zoneMaps as Record<string, GameMap>]),
);

const versionEntries = GAMES.flatMap((g) => Object.entries(g.versions));

// version slug -> cover mascot species.
export const VERSION_MASCOT: Record<string, string> = Object.fromEntries(
  versionEntries.map(([v, c]) => [v, c.mascot]),
);

// version slug -> the theme it selects (drives F3 "theme follows the game").
export const VERSION_THEME: Record<string, ThemeId> = Object.fromEntries(
  versionEntries.map(([v, c]) => [v, c.theme.id]),
);

// The color-theme dropdown: the neutral default, then each version's theme.
export const THEMES: { id: ThemeId; name: string }[] = [
  { id: 'default-dark', name: 'Dark' },
  ...versionEntries.map(([, c]) => c.theme),
];

export const cardColorFor = (gameId: string): string =>
  GAMES.find((g) => g.dataset.gameId === gameId)?.cardColor ?? 'var(--accent)';

// Dev-only completeness check: every dataset version needs an app config so the
// picker never renders a version with no mascot/theme. Cheap; runs once on load.
if (import.meta.env?.DEV) {
  for (const g of GAMES)
    for (const v of g.dataset.versions)
      if (!g.versions[v])
        console.warn(`[games] ${g.dataset.gameId} version "${v}" is missing an app config entry`);
}
