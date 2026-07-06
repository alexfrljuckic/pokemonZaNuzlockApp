import { describe, expect, it } from 'vitest';
import {
  HANDLE_RE,
  claimProfile,
  deleteProfile,
  fetchFeed,
  fetchProfile,
  getMyProfile,
  searchProfiles,
} from './profiles';
import { describeFeedItem } from '../components/FollowFeed';
import type { FeedItem } from './profiles';

// VITE_SYNC_ENABLED is unset in the test env, so the supabase client is null:
// every profile function must be an inert no-op (degrade-to-free invariant).
describe('profiles lib with sync disabled', () => {
  it('no-ops safely across the API', async () => {
    expect(await getMyProfile('u1')).toBeNull();
    expect(await fetchProfile('somebody')).toBeNull();
    expect(await fetchFeed()).toEqual([]);
    expect(await claimProfile('u1', 'valid-handle', '')).toBe('Sync is disabled.');
    expect(await deleteProfile('u1')).toBe('Sync is disabled.');
    expect(await searchProfiles('alex')).toEqual([]);
  });

  it('validates handles', () => {
    expect(HANDLE_RE.test('alex')).toBe(true);
    expect(HANDLE_RE.test('a-1')).toBe(true);
    expect(HANDLE_RE.test('ab')).toBe(false); // too short
    expect(HANDLE_RE.test('-lead')).toBe(false);
    expect(HANDLE_RE.test('Nope')).toBe(false);
    expect(HANDLE_RE.test('x'.repeat(25))).toBe(false);
  });
});

describe('describeFeedItem', () => {
  const item = (gameId: string, type: string, payload: unknown): FeedItem => ({
    handle: 'alex',
    displayName: 'Alex',
    token: 't',
    gameId,
    version: 'sword',
    event: { seq: 1, at: '2026-01-01T00:00:00Z', type, payload } as FeedItem['event'],
  });

  it('describes big beats in the run game\'s own language', () => {
    const desc = describeFeedItem(item('swsh', 'milestone_cleared', { milestoneId: 'gym-1-milo' }));
    expect(desc?.text).toBe('Cleared: Milo (Turffield Gym)');
    expect(desc?.tone).toBe('milestone');
    expect(describeFeedItem(item('swsh', 'run_ended', { result: 'victory' }))?.text).toBe('Victory!');
  });

  it('drops rows from games without a local dataset', () => {
    expect(describeFeedItem(item('not-a-game', 'run_ended', { result: 'victory' }))).toBeNull();
  });
});
