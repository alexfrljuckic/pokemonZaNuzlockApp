// @vitest-environment happy-dom
import { describe, expect, it, vi, beforeEach } from 'vitest';
import { act } from 'react';
import { createRoot } from 'react-dom/client';

vi.mock('../lib/shareLinks', () => ({
  listShareTokens: vi.fn(async () => [{ token: 'abc123', revoked: false }]),
  createShareToken: vi.fn(async () => {}),
  revokeShareToken: vi.fn(async () => {}),
}));

import { SharePopover } from './SharePopover';

(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;

async function flush() {
  // let the async listShareTokens resolve + React re-render + the open rAF fire
  await act(async () => {
    await new Promise((r) => setTimeout(r, 0));
  });
}

async function render() {
  const container = document.createElement('div');
  document.body.appendChild(container);
  await act(async () => {
    createRoot(container).render(<SharePopover runId="run1" />);
  });
  return container;
}

describe('SharePopover copy button', () => {
  beforeEach(() => {
    // navigator.clipboard is a read-only getter in happy-dom — define it.
    Object.defineProperty(navigator, 'clipboard', {
      value: { writeText: vi.fn(async () => {}) },
      configurable: true,
    });
  });

  it('copies the share URL and shows transient "Copied!" feedback', async () => {
    const c = await render();
    await act(async () => {
      c.querySelector<HTMLButtonElement>('.share-popover-trigger')!.click();
    });
    await flush();

    const copyBtn = c.querySelector<HTMLButtonElement>('.share-copy-btn')!;
    const input = c.querySelector<HTMLInputElement>('.share-link-row input')!;
    expect(copyBtn).toBeTruthy();
    expect(copyBtn.textContent).toBe('Copy');
    expect(input.value).toContain('#share/abc123');

    await act(async () => {
      copyBtn.click();
      await Promise.resolve();
    });

    expect(navigator.clipboard.writeText).toHaveBeenCalledWith(input.value);
    expect(copyBtn.textContent).toBe('Copied!');
  });
});
