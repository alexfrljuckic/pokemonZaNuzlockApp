// @vitest-environment happy-dom
import { describe, expect, it, vi } from 'vitest';
import { act } from 'react';
import { createRoot } from 'react-dom/client';

// Render the signed-out popover in its ENABLED state (providers configured,
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

(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;

async function renderAuthBar() {
  const container = document.createElement('div');
  document.body.appendChild(container);
  await act(async () => {
    createRoot(container).render(<AuthBar />);
  });
  return container;
}

describe('AuthBar signed-out sign-in popover', () => {
  it('is one small trigger by default — zero page footprint', async () => {
    const c = await renderAuthBar();
    const trigger = c.querySelector<HTMLButtonElement>('.auth-signin-trigger')!;
    expect(trigger).toBeTruthy();
    expect(trigger.getAttribute('aria-haspopup')).toBe('dialog');
    expect(trigger.getAttribute('aria-expanded')).toBe('false');
    expect(c.textContent).toContain('sync · share · follow'); // hint still sells it
    expect(c.querySelector('.auth-popover-panel')).toBeNull(); // nothing pushed down
  });

  it('opens a dialog with the full value prop and branded provider buttons', async () => {
    const c = await renderAuthBar();
    await act(async () => {
      c.querySelector<HTMLButtonElement>('.auth-signin-trigger')!.click();
    });
    const panel = c.querySelector('.auth-popover-panel')!;
    expect(panel).toBeTruthy();
    expect(panel.getAttribute('role')).toBe('dialog');
    expect(panel.getAttribute('aria-modal')).toBe('true');
    expect(panel.textContent).toContain('Take your run everywhere');
    expect(panel.textContent).toContain('Sync across devices');
    expect(panel.textContent).toContain('Share your run live');
    expect(panel.textContent).toContain('Follow other trainers');
    expect(panel.textContent).toContain('Continue with Google');
    expect(panel.textContent).toContain('Continue with Discord');
    // local-first invariant stays stated
    expect(panel.textContent).toMatch(/keeps working on this device without an account/);
    // 3 benefit icons + 2 brand glyphs, all inline (CSP forbids external assets)
    expect(panel.querySelectorAll('svg').length).toBeGreaterThanOrEqual(5);
  });

  it('closes on Escape', async () => {
    const c = await renderAuthBar();
    await act(async () => {
      c.querySelector<HTMLButtonElement>('.auth-signin-trigger')!.click();
    });
    expect(c.querySelector('.auth-popover-panel')).toBeTruthy();
    await act(async () => {
      document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }));
    });
    expect(c.querySelector('.auth-popover-panel')).toBeNull();
  });
});
