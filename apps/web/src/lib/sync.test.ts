import { describe, expect, it, vi } from 'vitest';
import { pushAllRuns, pullAllRuns, pushRun, pullRun, syncRun, deleteRemoteRun, SYNC_AVAILABLE } from './sync';
import * as db from './db';

// VITE_SYNC_ENABLED is unset in the test env, so the supabase client is null.
// Every sync entry point must be an inert no-op that never throws and — this is
// the load-bearing part for the local-first invariant — never touches
// IndexedDB either. pushAllRuns in particular is the mirror of pullAllRuns
// added to fix cross-device run visibility: it must stay a clean no-op when
// sync is off, since it runs on sign-in on every device.
describe('sync lib with sync disabled', () => {
  it('exposes SYNC_AVAILABLE=false when no supabase client', () => {
    expect(SYNC_AVAILABLE).toBe(false);
  });

  it('no-ops across the API without reading local runs', async () => {
    const listRuns = vi.spyOn(db, 'listRuns');
    const loadEvents = vi.spyOn(db, 'loadEvents');

    await expect(pushAllRuns('u1')).resolves.toBeUndefined();
    await expect(pullAllRuns('u1')).resolves.toBeUndefined();
    await expect(deleteRemoteRun('run-1')).resolves.toBeUndefined();
    await expect(
      pushRun({ id: 'run-1', gameId: 'sv', version: 'scarlet', createdAt: '2026-01-01' }, 'u1'),
    ).resolves.toBeUndefined();
    expect(await pullRun('run-1')).toBe(false);
    expect(
      await syncRun({ id: 'run-1', gameId: 'sv', version: 'scarlet', createdAt: '2026-01-01' }, 'u1'),
    ).toBe(false);

    // With sync off, none of these should have hit IndexedDB at all.
    expect(listRuns).not.toHaveBeenCalled();
    expect(loadEvents).not.toHaveBeenCalled();
  });
});
