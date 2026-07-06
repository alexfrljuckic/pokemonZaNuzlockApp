import { describe, expect, it, vi } from 'vitest';
import { renderToStaticMarkup } from 'react-dom/server';

// Render the signed-out card in its ENABLED state (providers configured,
// auth available) — env-gated branches must be tested with the gate open,
// not just in the everything-off default (see the #139 TDZ prod bug).
vi.mock('../lib/useAuth', () => ({
  useAuth: () => ({
    session: null,
    loading: false,
    available: true,
    signInWithProvider: vi.fn(),
    signOut: vi.fn(),
  }),
}));
vi.mock('../lib/env', () => ({ OAUTH_PROVIDERS: ['google', 'discord'] }));

import { AuthBar } from './AuthBar';

describe('AuthBar signed-out sign-in card', () => {
  const html = renderToStaticMarkup(<AuthBar />);

  it('leads with the value prop, not a bare button row', () => {
    expect(html).toContain('Take your run everywhere');
    expect(html).toContain('Sync across devices');
    expect(html).toContain('Share your run live');
    expect(html).toContain('Follow other trainers');
  });

  it('renders one branded button per configured provider', () => {
    expect(html).toContain('Continue with Google');
    expect(html).toContain('Continue with Discord');
    // 3 benefit icons + 2 brand glyphs, all inline (CSP forbids external assets)
    expect((html.match(/<svg/g) ?? []).length).toBeGreaterThanOrEqual(5);
  });

  it('says the app keeps working without an account (local-first invariant)', () => {
    expect(html).toMatch(/keeps working on this device without an account/);
  });
});
