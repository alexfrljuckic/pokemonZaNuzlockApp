import { afterEach, describe, expect, it, vi } from 'vitest';
import { parseProviders } from './env';

describe('parseProviders', () => {
  it('returns empty for non-strings and blanks', () => {
    expect(parseProviders(undefined)).toEqual([]);
    expect(parseProviders(null)).toEqual([]);
    expect(parseProviders('')).toEqual([]);
    expect(parseProviders('   ')).toEqual([]);
  });

  it('parses a comma-separated list, trimming and lowercasing', () => {
    expect(parseProviders('google, Discord')).toEqual(['google', 'discord']);
  });

  it('ignores unsupported providers', () => {
    expect(parseProviders('google,github,facebook')).toEqual(['google']);
  });

  it('dedupes repeated providers, preserving first-seen order', () => {
    expect(parseProviders('discord,google,discord')).toEqual(['discord', 'google']);
  });
});

// Regression for the prod crash (2026-07-05): OAUTH_PROVIDERS is computed at
// module-eval time by calling parseProviders, which reads SUPPORTED. If those
// declarations sit below the OAUTH_PROVIDERS export, a non-empty env value takes
// the .filter path and hits SUPPORTED's temporal dead zone → ReferenceError →
// blank app. The plain parseProviders tests above miss it because they run after
// load with the env unset (early return). This forces the with-providers path
// through a fresh module evaluation.
describe('OAUTH_PROVIDERS module initialization', () => {
  afterEach(() => {
    vi.unstubAllEnvs();
    vi.resetModules();
  });

  it('initializes without a temporal-dead-zone crash when the env var is a non-empty string', async () => {
    vi.stubEnv('VITE_OAUTH_PROVIDERS', 'google,discord');
    vi.resetModules();
    const mod = await import('./env');
    expect(mod.OAUTH_PROVIDERS).toEqual(['google', 'discord']);
  });
});
