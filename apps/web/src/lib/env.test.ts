import { describe, expect, it } from 'vitest';
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
