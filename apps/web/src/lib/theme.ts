// THEMES (dropdown list) and VERSION_THEME (version→theme) are assembled from
// the per-game configs. Only a type edge runs the other way (games/<id> imports
// ThemeId as a type), so there's no runtime import cycle.
import { THEMES, VERSION_THEME } from '../games';

// The set of theme ids — this module owns the apply/persist logic keyed on this
// stable id union; the labels + version mapping live in the per-game configs.
export type ThemeId =
  | 'default-dark'
  | 'plza'
  | 'bdsp-bd'
  | 'bdsp-sp'
  | 'lgpe-pikachu'
  | 'lgpe-eevee'
  | 'swsh-sword'
  | 'swsh-shield'
  | 'pla';

const KEY = 'nuzlocke-theme';
// Set only when the user picks a theme from the header dropdown. Once set, the
// per-game "theme follows the version" behaviour stops overriding their choice.
const EXPLICIT_KEY = 'nuzlocke-theme-explicit';
// Dispatched by applyTheme so the header dropdown can reflect a theme applied
// elsewhere (e.g. opening a run switches to that game's theme).
export const THEME_CHANGE_EVENT = 'nuzlocke-theme-change';

// Pre-split theme ids (one per game) map onto the first version's theme, for
// migrating any value stored before the per-version split.
const LEGACY: Record<string, ThemeId> = {
  bdsp: 'bdsp-bd',
  lgpe: 'lgpe-pikachu',
  swsh: 'swsh-sword',
};

export function currentTheme(): ThemeId {
  const stored = localStorage.getItem(KEY) ?? '';
  if (THEMES.some((t) => t.id === stored)) return stored as ThemeId;
  return LEGACY[stored] ?? 'default-dark';
}

export function isThemeExplicit(): boolean {
  return localStorage.getItem(EXPLICIT_KEY) === '1';
}

export function applyTheme(id: ThemeId): void {
  document.documentElement.dataset.theme = id;
  localStorage.setItem(KEY, id);
  window.dispatchEvent(new CustomEvent(THEME_CHANGE_EVENT, { detail: id }));
}

// The user explicitly chose a theme from the dropdown — lock it in so version
// themes no longer override it (until they change it again from the dropdown).
export function applyThemeExplicit(id: ThemeId): void {
  localStorage.setItem(EXPLICIT_KEY, '1');
  applyTheme(id);
}

// Apply the theme matching a game version, unless the user has made an explicit
// dropdown choice. Returns the theme now in effect.
export function applyVersionTheme(version: string): ThemeId {
  if (isThemeExplicit()) return currentTheme();
  const id = VERSION_THEME[version] ?? 'default-dark';
  applyTheme(id);
  return id;
}
