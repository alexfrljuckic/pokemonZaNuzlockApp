// @vitest-environment happy-dom
import { beforeEach, describe, expect, it } from 'vitest';
import { applyTheme, applyThemeExplicit, applyVersionTheme, currentTheme, isThemeExplicit } from './theme';

// Locks the F3 semantics: the theme follows the run's version until the user
// explicitly picks one from the dropdown — then their pick sticks forever.

beforeEach(() => {
  localStorage.clear();
  delete document.documentElement.dataset.theme;
});

describe('theme', () => {
  it('defaults to default-dark with nothing stored', () => {
    expect(currentTheme()).toBe('default-dark');
    expect(isThemeExplicit()).toBe(false);
  });

  it('applyVersionTheme follows the version while no explicit pick exists', () => {
    expect(applyVersionTheme('shield')).toBe('swsh-shield');
    expect(document.documentElement.dataset.theme).toBe('swsh-shield');
    expect(applyVersionTheme('scarlet')).toBe('sv-scarlet');
    expect(isThemeExplicit()).toBe(false); // version themes never set the flag
  });

  it('an explicit dropdown pick locks the theme against version overrides', () => {
    applyThemeExplicit('default-dark');
    expect(isThemeExplicit()).toBe(true);
    // opening a run no longer overrides
    expect(applyVersionTheme('sword')).toBe('default-dark');
    expect(document.documentElement.dataset.theme).toBe('default-dark');
  });

  it('unknown versions fall back to default-dark', () => {
    expect(applyVersionTheme('not-a-version')).toBe('default-dark');
  });

  it('migrates legacy pre-split stored ids (bdsp -> bdsp-bd)', () => {
    localStorage.setItem('nuzlocke-theme', 'bdsp');
    expect(currentTheme()).toBe('bdsp-bd');
  });

  it('applyTheme persists and announces the change', () => {
    let announced: string | null = null;
    window.addEventListener('nuzlocke-theme-change', (e) => {
      announced = (e as CustomEvent<string>).detail;
    });
    applyTheme('pla');
    expect(localStorage.getItem('nuzlocke-theme')).toBe('pla');
    expect(announced).toBe('pla');
  });
});
