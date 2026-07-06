import { describe, expect, it } from 'vitest';
import {
  DEFAULT_TAB,
  formatHash,
  isTabSlug,
  parseHash,
  slugForTabLabel,
  TAB_LABEL_BY_SLUG,
  TAB_SLUGS,
  tabLabelForSlug,
  type Route,
} from './route';

describe('parseHash', () => {
  it('empty hash → home', () => {
    expect(parseHash('')).toEqual({ screen: 'home' });
    expect(parseHash('#')).toEqual({ screen: 'home' });
  });

  it('parses a run + tab', () => {
    expect(parseHash('#run/abc/stats')).toEqual({ screen: 'run', runId: 'abc', tab: 'stats' });
  });

  it('parses every tab slug', () => {
    for (const slug of TAB_SLUGS) {
      expect(parseHash(`#run/xyz/${slug}`)).toEqual({ screen: 'run', runId: 'xyz', tab: slug });
    }
  });

  it('bare run hash defaults to the first tab', () => {
    expect(parseHash('#run/abc')).toEqual({ screen: 'run', runId: 'abc', tab: DEFAULT_TAB });
  });

  it('unknown tab slug falls back to the default tab', () => {
    expect(parseHash('#run/abc/nonsense')).toEqual({
      screen: 'run',
      runId: 'abc',
      tab: DEFAULT_TAB,
    });
  });

  it('run with no id → home (not a broken run route)', () => {
    expect(parseHash('#run')).toEqual({ screen: 'home' });
    expect(parseHash('#run/')).toEqual({ screen: 'home' });
  });

  it('parses a bare share token (defaults to first tab)', () => {
    expect(parseHash('#share/tok123')).toEqual({ screen: 'share', token: 'tok123', tab: DEFAULT_TAB });
  });

  it('parses a share token + tab', () => {
    expect(parseHash('#share/tok123/bosses')).toEqual({
      screen: 'share',
      token: 'tok123',
      tab: 'bosses',
    });
  });

  it('share with unknown tab falls back to default', () => {
    expect(parseHash('#share/tok123/whatever')).toEqual({
      screen: 'share',
      token: 'tok123',
      tab: DEFAULT_TAB,
    });
  });

  it('parses a profile handle', () => {
    expect(parseHash('#u/ash-ketchum')).toEqual({ screen: 'profile', handle: 'ash-ketchum' });
  });

  it('rejects a malformed profile handle → home', () => {
    expect(parseHash('#u/Bad_Handle!')).toEqual({ screen: 'home' });
    expect(parseHash('#u/')).toEqual({ screen: 'home' });
  });

  it('unknown head segment → home', () => {
    expect(parseHash('#wat/ever')).toEqual({ screen: 'home' });
  });

  it('does not throw on malformed hashes', () => {
    for (const junk of ['#', '#/', '#//', '#run//stats', '#///', '#access_token=abc&type=recovery', '####']) {
      expect(() => parseHash(junk)).not.toThrow();
    }
  });

  it('tolerates a missing leading #', () => {
    expect(parseHash('run/abc/team')).toEqual({ screen: 'run', runId: 'abc', tab: 'team' });
  });
});

describe('formatHash', () => {
  it('home → empty string', () => {
    expect(formatHash({ screen: 'home' })).toBe('');
  });

  it('run', () => {
    expect(formatHash({ screen: 'run', runId: 'abc', tab: 'stats' })).toBe('#run/abc/stats');
  });

  it('share', () => {
    expect(formatHash({ screen: 'share', token: 'tok', tab: 'team' })).toBe('#share/tok/team');
  });

  it('profile', () => {
    expect(formatHash({ screen: 'profile', handle: 'misty' })).toBe('#u/misty');
  });
});

describe('round-trips', () => {
  const cases: Route[] = [
    { screen: 'home' },
    { screen: 'run', runId: 'abc', tab: 'routes' },
    { screen: 'run', runId: 'deadbeef-1234', tab: 'stats' },
    { screen: 'share', token: 'shareTok', tab: 'bosses' },
    { screen: 'profile', handle: 'red' },
  ];
  for (const route of cases) {
    it(`${JSON.stringify(route)} survives format→parse`, () => {
      expect(parseHash(formatHash(route))).toEqual(route);
    });
  }
});

describe('tab slug <-> label bridge', () => {
  it('isTabSlug is exact', () => {
    expect(isTabSlug('stats')).toBe(true);
    expect(isTabSlug('Stats')).toBe(false);
    expect(isTabSlug('')).toBe(false);
  });

  it('slug ↔ label is a lossless bijection', () => {
    for (const slug of TAB_SLUGS) {
      expect(slugForTabLabel(TAB_LABEL_BY_SLUG[slug])).toBe(slug);
      expect(tabLabelForSlug(slug)).toBe(TAB_LABEL_BY_SLUG[slug]);
    }
  });
});
