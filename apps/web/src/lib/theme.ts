export const THEMES = [
  { id: 'default-dark', name: 'Dark' },
  { id: 'plza', name: 'Lumiose (Z-A)' },
  { id: 'bdsp-bd', name: 'Brilliant Diamond' },
  { id: 'bdsp-sp', name: 'Shining Pearl' },
  { id: 'lgpe-pikachu', name: "Let's Go Pikachu" },
  { id: 'lgpe-eevee', name: "Let's Go Eevee" },
  { id: 'swsh-sword', name: 'Sword' },
  { id: 'swsh-shield', name: 'Shield' },
] as const;

export type ThemeId = (typeof THEMES)[number]['id'];

const KEY = 'nuzlocke-theme';

// Pre-split theme ids (one per game) map onto the first version's theme.
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

export function applyTheme(id: ThemeId): void {
  document.documentElement.dataset.theme = id;
  localStorage.setItem(KEY, id);
}
