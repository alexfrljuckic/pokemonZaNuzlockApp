export const THEMES = [
  { id: 'default-dark', name: 'Dark' },
  { id: 'plza', name: 'Lumiose (Z-A)' },
  { id: 'bdsp', name: 'Sinnoh (BDSP)' },
  { id: 'lgpe', name: "Kanto (Let's Go)" },
  { id: 'swsh', name: 'Galar (SwSh)' },
] as const;

export type ThemeId = (typeof THEMES)[number]['id'];

const KEY = 'nuzlocke-theme';

export function currentTheme(): ThemeId {
  const stored = localStorage.getItem(KEY);
  return THEMES.some((t) => t.id === stored) ? (stored as ThemeId) : 'default-dark';
}

export function applyTheme(id: ThemeId): void {
  document.documentElement.dataset.theme = id;
  localStorage.setItem(KEY, id);
}
