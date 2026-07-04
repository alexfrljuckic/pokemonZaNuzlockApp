export const THEMES = [
  { id: 'default-dark', name: 'Dark' },
  { id: 'plza', name: 'Lumiose (Z-A)' },
  { id: 'bdsp-bd', name: 'Brilliant Diamond' },
  { id: 'bdsp-sp', name: 'Shining Pearl' },
  { id: 'lgpe-pikachu', name: "Let's Go Pikachu" },
  { id: 'lgpe-eevee', name: "Let's Go Eevee" },
  { id: 'swsh-sword', name: 'Sword' },
  { id: 'swsh-shield', name: 'Shield' },
  { id: 'pla', name: 'Legends: Arceus' },
] as const;

export type ThemeId = (typeof THEMES)[number]['id'];

const KEY = 'nuzlocke-theme';
// Set only when the user picks a theme from the header dropdown. Once set, the
// per-game "theme follows the version" behaviour stops overriding their choice.
const EXPLICIT_KEY = 'nuzlocke-theme-explicit';
// Dispatched by applyTheme so the header dropdown can reflect a theme applied
// elsewhere (e.g. opening a run switches to that game's theme).
export const THEME_CHANGE_EVENT = 'nuzlocke-theme-change';

// Pre-split theme ids (one per game) map onto the first version's theme.
const LEGACY: Record<string, ThemeId> = {
  bdsp: 'bdsp-bd',
  lgpe: 'lgpe-pikachu',
  swsh: 'swsh-sword',
};

// A run's version → the theme that matches it. Absent versions fall back to
// default-dark (e.g. the first-ever view with no run open).
export const VERSION_THEME: Record<string, ThemeId> = {
  'brilliant-diamond': 'bdsp-bd',
  'shining-pearl': 'bdsp-sp',
  'lets-go-pikachu': 'lgpe-pikachu',
  'lets-go-eevee': 'lgpe-eevee',
  sword: 'swsh-sword',
  shield: 'swsh-shield',
  'legends-z-a': 'plza',
  'legends-arceus': 'pla',
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
